// backend/controllers/ocrController.js
const ocrService = require('../services/ocrService');

/**
 * POST /api/ocr/front
 * Process front side of Aadhaar
 */
async function processFront(req, res) {
  try {
    const { image } = req.body;

    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: 'No image data provided' });
    }

    // Remove data URL prefix if present
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');

    const rawText = await ocrService.extractTextFromImage(base64);
    const parsed = ocrService.parseFrontAadhaar(rawText);
    const age = ocrService.calculateAge(parsed.dob);

    return res.json({
      success: true,
      data: {
        ...parsed,
        age,
        rawText,
      },
    });
  } catch (error) {
    console.error('OCR front error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'OCR processing failed' });
  }
}

/**
 * POST /api/ocr/back
 * Process back side of Aadhaar
 */
async function processBack(req, res) {
  try {
    const { image } = req.body;

    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: 'No image data provided' });
    }

    const base64 = image.replace(/^data:image\/\w+;base64,/, '');

    const rawText = await ocrService.extractTextFromImage(base64);
    const parsed = ocrService.parseBackAadhaar(rawText);

    return res.json({
      success: true,
      data: {
        ...parsed,
        rawText,
      },
    });
  } catch (error) {
    console.error('OCR back error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'OCR processing failed' });
  }
}

module.exports = { processFront, processBack };
