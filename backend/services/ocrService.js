// backend/services/ocrService.js
const Tesseract = require('tesseract.js');
const Jimp = require('jimp');
const jsQR = require('jsqr');

// Single persistent worker — created once, reused for every request.
// Tesseract.recognize() cold-starts a new worker each call (~8-12s language load).
// A reused worker skips that cost entirely (~1-2s per image).
let _worker = null;

async function getOcrWorker() {
  if (!_worker) {
    // OEM 1 = LSTM_ONLY (fastest + most accurate for printed text)
    // PSM 6 = single uniform block of text (Aadhaar front layout)
    _worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
    await _worker.setParameters({ tessedit_pageseg_mode: '6' });
  }
  return _worker;
}

// Call at server startup so the first real request isn't slow.
async function warmUpOcr() {
  console.log('[OCR] Initializing Tesseract worker...');
  await getOcrWorker();
  console.log('[OCR] Tesseract worker ready.');
}

// Safety-net preprocessing for file uploads (camera images are pre-processed by the frontend).
// No upscale here — camera images arrive already 2.5× upscaled; uploads are high-res phone photos.
async function preprocessForOcr(base64Image) {
  const buf = Buffer.from(base64Image, 'base64');
  const img = await Jimp.read(buf);
  img.grayscale().normalize().contrast(0.3);
  return img.getBufferAsync(Jimp.MIME_PNG);
}

async function extractTextFromImage(base64Image) {
  const [processedBuf, worker] = await Promise.all([
    preprocessForOcr(base64Image),
    getOcrWorker(),
  ]);
  const { data: { text } } = await worker.recognize(processedBuf);
  return text;
}

/**
 * Parse Aadhaar FRONT side text
 * Extracts: Name, DOB, Gender, Aadhaar Number
 */
function parseFrontAadhaar(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const result = {
    fullName: '',
    dob: '',
    gender: '',
    aadhaarNumber: '',
  };

  // Aadhaar number: 12 digits (may appear as XXXX XXXX XXXX), skip VID line
  const aadhaarMatch = text.match(/(?<!VID\s*:\s*)\b(\d{4}\s\d{4}\s\d{4}|\d{12})\b(?!\s*\d)/);
  if (aadhaarMatch) {
    result.aadhaarNumber = aadhaarMatch[0].replace(/\s/g, '');
  }

  // DOB: DD/MM/YYYY or DD-MM-YYYY
  const dobMatch = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  if (dobMatch) {
    result.dob = dobMatch[1].replace(/-/g, '/');
  }

  // Gender — handle "/ MALE" or "/ FEMALE" format on the card
  const genderMatch = text.match(/\b(MALE|FEMALE|OTHER|Male|Female|Other)\b/i);
  if (genderMatch) {
    result.gender =
      genderMatch[1].charAt(0).toUpperCase() +
      genderMatch[1].slice(1).toLowerCase();
  }

  // Name: anchor to the DOB line and search backward for the first
  // pure-English line with at least two words (first + last name).
  const dobLineIndex = lines.findIndex(
    (l) => /DOB|Date of Birth|Year of Birth|YOB/i.test(l) || /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/.test(l)
  );

  const searchFrom = dobLineIndex > 0 ? dobLineIndex - 1 : lines.length - 1;

  for (let i = searchFrom; i >= 0; i--) {
    const line = lines[i];

    if (
      /\d{4}\s?\d{4}\s?\d{4}/.test(line) ||
      /DOB|Date of Birth|Year of Birth|YOB/i.test(line) ||
      /MALE|FEMALE|OTHER/i.test(line) ||
      /Government|India|UNIQUE|Authority|Aadhaar/i.test(line) ||
      line.length < 4
    ) {
      continue;
    }

    // Letters, spaces, periods, hyphens, apostrophes (common OCR noise on names)
    // Strip leading/trailing punctuation that OCR sometimes prepends
    const cleaned = line.trim().replace(/^[^A-Za-z]+/, '').replace(/[^A-Za-z]+$/, '');
    if (
      /^[A-Za-z][A-Za-z\s.'\-]+$/.test(cleaned) &&
      cleaned.split(/\s+/).length >= 2 &&
      cleaned.length >= 4
    ) {
      result.fullName = cleaned;
      break;
    }
  }

  console.log(result);
  return result;
}

/**
 * Parse Aadhaar BACK side text
 * Extracts: Address
 */
function parseBackAadhaar(text) {
  const result = { address: '' };

  // Anchor on the English "Address" label which appears after the Telugu address block.
  // This reliably skips the Telugu version of the address above it.
  const addrLabelIdx = text.search(/\bAddress\b/i);
  let addrText = addrLabelIdx !== -1
    ? text.slice(addrLabelIdx + 'Address'.length)
    : text;

  // Drop the colon/spaces immediately after the label
  addrText = addrText.replace(/^\s*:?\s*/, '');

  // Stop before VID number or Aadhaar number (both appear at the bottom)
  addrText = addrText
    .replace(/\bVID\s*:[\s\S]*/gi, '')
    .replace(/\b\d{4}\s\d{4}\s\d{4}\b[\s\S]*/g, '');

  // Remove all non-ASCII characters (Telugu script and other Unicode)
  addrText = addrText.replace(/[^\x00-\x7F]+/g, ' ');

  // Remove noise punctuation that Tesseract adds from image artifacts
  addrText = addrText.replace(/[|§"'`~\\@#$%^*_=<>{}[\]!?]/g, ' ');

  // Normalize common OCR misread: "3/0" or "3/O" → "S/O"
  addrText = addrText.replace(/\b3\/[O0]\b/gi, 'S/O');

  // Split by comma, filter out noise-only segments (must have a real word or house-number)
  const segments = addrText
    .split(/,/)
    .map((s) => s.replace(/\s{2,}/g, ' ').trim())
    .filter((s) => s.length >= 3 && /[A-Za-z]{3,}|\d+-\d+/.test(s));

  result.address = segments.join(', ');

  console.log(result);
  return result;
}

/**
 * Calculate age from DOB string (DD/MM/YYYY)
 */
function calculateAge(dobString) {
  if (!dobString) return '';

  const parts = dobString.split('/');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts;
  const dob = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age.toString();
}

/**
 * Read QR code from image and parse Aadhaar XML data.
 * Returns null if no QR code found or parsing fails.
 */
async function extractFromQR(base64Image) {
  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const image = await Jimp.read(imageBuffer);
    const { data, width, height } = image.bitmap;
    const code = jsQR(new Uint8ClampedArray(data), width, height);
    if (!code || !code.data) return null;

    return parseAadhaarQR(code.data);
  } catch (err) {
    console.error('QR read error:', err.message);
    return null;
  }
}

/**
 * Parse the XML string embedded in the Aadhaar QR code.
 * Handles both old (yob only) and new (dob field) QR formats.
 */
function parseAadhaarQR(qrData) {
  const attr = (name) => {
    const m = qrData.match(new RegExp(`\\b${name}="([^"]*)"`));
    return m ? m[1].trim() : '';
  };

  const gRaw = attr('gender');
  const gender = gRaw === 'M' ? 'Male' : gRaw === 'F' ? 'Female' : gRaw || '';

  // Prefer explicit dob field; fall back to yob (year only → 01/01/YYYY)
  let dob = attr('dob');
  if (!dob) {
    const yob = attr('yob');
    if (yob) dob = `01/01/${yob}`;
  }

  const uid = attr('uid').replace(/\s/g, '');

  const addressParts = [
    attr('co'),
    attr('house'),
    attr('street'),
    attr('lm'),
    attr('loc'),
    attr('vtc'),
    attr('dist') ? `DIST: ${attr('dist')}` : '',
    attr('state'),
    attr('pc'),
  ].filter(Boolean);

  return {
    fullName: attr('name'),
    dob,
    gender,
    aadhaarNumber: uid,
    address: addressParts.join(', '),
  };
}

module.exports = {
  warmUpOcr,
  extractTextFromImage,
  extractFromQR,
  parseFrontAadhaar,
  parseBackAadhaar,
  calculateAge,
};
