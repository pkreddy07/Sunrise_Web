// backend/services/googleSheets.js
const { google } = require('googleapis');

const SHEET_NAME = 'Bookings';
const COLUMNS = [
  'Booking ID',
  'Room Number',
  'Room Type',
  'Room Cost',
  'Customer Name',
  'DOB',
  'Age',
  'Gender',
  'Contact Number',
  'Address',
  'Aadhaar Number',
  'Check-In DateTime',
  'Expected Check-Out DateTime',
  'Actual Check-Out DateTime',
  'Payment Type',
  'Booking Status',
  'Created At',
  'Advance Paid',
];

// Parse "DD/MM/YYYY, HH:MM am/pm" or "DD/MM/YYYY, HH:MM:SS am/pm" → Date
// Values in the sheet are stored as IST (Asia/Kolkata, UTC+5:30).
// Use Date.UTC then subtract the IST offset so the result is always the
// correct UTC instant regardless of the server's local timezone.
function parseSheetDateTime(str) {
  if (!str) return null;
  const m = str.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i
  );
  if (!m) return new Date(str);
  let [, day, month, year, h, min, sec, meridiem] = m;
  h = parseInt(h);
  if (/pm/i.test(meridiem) && h !== 12) h += 12;
  if (/am/i.test(meridiem) && h === 12) h = 0;
  const utcMs = Date.UTC(
    parseInt(year), parseInt(month) - 1, parseInt(day),
    h, parseInt(min), parseInt(sec || 0)
  ) - 330 * 60 * 1000; // subtract IST offset (UTC+5:30)
  return new Date(utcMs);
}

function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : '';

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

async function getSheetsClient() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// Ensure header row exists
async function ensureHeaders() {
  const sheets = await getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A1:R1`,
  });

  if (!response.data.values || response.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [COLUMNS] },
    });
  }
}

// Get all bookings
async function getAllBookings() {
  const sheets = await getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:R`,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map((row, index) => {
    const obj = { _rowIndex: index + 2 }; // 1-indexed, +1 for header
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });
}

// Append a new booking
async function appendBooking(bookingData) {
  await ensureHeaders();
  const sheets = await getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const row = COLUMNS.map((col) => bookingData[col] || '');

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:R`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

// Update a row by row index
async function updateRow(rowIndex, updates) {
  const sheets = await getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  // First get the existing row data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A${rowIndex}:R${rowIndex}`,
  });

  const existingRow = response.data.values ? response.data.values[0] : [];

  // Merge updates
  const updatedRow = COLUMNS.map((col, i) => {
    if (updates[col] !== undefined) return updates[col];
    return existingRow[i] || '';
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A${rowIndex}:R${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [updatedRow] },
  });
}

// Get room statuses — explicitly based on booking status + check-in/out datetime
async function getRoomStatuses() {
  const bookings = await getAllBookings();
  const now = new Date();
  const roomStatus = {};

  for (let i = 1; i <= 7; i++) {
    roomStatus[`Room ${i}`] = { status: 'AVAILABLE', booking: null, futureBookings: [] };
  }

  bookings.forEach((booking) => {
    const room = booking['Room Number'];
    if (!roomStatus[room]) return;

    const status = booking['Booking Status'];

    if (status === 'ACTIVE') {
      const checkIn = parseSheetDateTime(booking['Check-In DateTime']);
      if (checkIn && now >= checkIn) {
        // Guest has arrived — room is occupied
        roomStatus[room].status = 'OCCUPIED';
        roomStatus[room].booking = booking;
      } else if (checkIn && now < checkIn) {
        // Confirmed booking with a future check-in date
        roomStatus[room].futureBookings.push(booking);
      }
    } else if (status === 'FUTURE') {
      // Pre-booking
      roomStatus[room].futureBookings.push(booking);
    }
  });

  return roomStatus;
}

// Checkout: update booking status and actual checkout time.
// roomNumber is required when multiple rows share the same bookingId (multi-room group booking).
async function checkoutBooking(bookingId, actualCheckoutTime, roomNumber) {
  const bookings = await getAllBookings();
  const booking = bookings.find(
    (b) => b['Booking ID'] === bookingId && (!roomNumber || b['Room Number'] === roomNumber)
  );

  if (!booking) throw new Error('Booking not found');

  await updateRow(booking._rowIndex, {
    'Actual Check-Out DateTime': actualCheckoutTime,
    'Booking Status': 'CHECKED_OUT',
  });

  return booking;
}

module.exports = {
  getAllBookings,
  appendBooking,
  updateRow,
  getRoomStatuses,
  checkoutBooking,
  ensureHeaders,
};
