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
];

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
    range: `${SHEET_NAME}!A1:Q1`,
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
    range: `${SHEET_NAME}!A:Q`,
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
    range: `${SHEET_NAME}!A:Q`,
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
    range: `${SHEET_NAME}!A${rowIndex}:Q${rowIndex}`,
  });

  const existingRow = response.data.values ? response.data.values[0] : [];

  // Merge updates
  const updatedRow = COLUMNS.map((col, i) => {
    if (updates[col] !== undefined) return updates[col];
    return existingRow[i] || '';
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A${rowIndex}:Q${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [updatedRow] },
  });
}

// Get active bookings per room
async function getRoomStatuses() {
  const bookings = await getAllBookings();
  const roomStatus = {};

  // Initialize all rooms as available
  for (let i = 1; i <= 7; i++) {
    roomStatus[`Room ${i}`] = { status: 'AVAILABLE', booking: null };
  }

  // Find active bookings
  bookings.forEach((booking) => {
    if (booking['Booking Status'] === 'ACTIVE') {
      const room = booking['Room Number'];
      roomStatus[room] = {
        status: 'OCCUPIED',
        booking: booking,
      };
    }
  });

  return roomStatus;
}

// Checkout: update booking status and actual checkout time
async function checkoutBooking(bookingId, actualCheckoutTime) {
  const bookings = await getAllBookings();
  const booking = bookings.find((b) => b['Booking ID'] === bookingId);

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
