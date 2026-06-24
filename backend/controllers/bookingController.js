// backend/controllers/bookingController.js
const { v4: uuidv4 } = require('uuid');
const sheetsService = require('../services/googleSheets');

/**
 * Generate booking ID: BK-YYYYMMDD-HHMM (IST)
 */
function generateBookingId() {
  // Shift UTC to IST (UTC+5:30 = +330 min) then read via UTC getters
  const ist = new Date(Date.now() + 330 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const y = ist.getUTCFullYear();
  const m = pad(ist.getUTCMonth() + 1);
  const d = pad(ist.getUTCDate());
  const h = pad(ist.getUTCHours());
  const min = pad(ist.getUTCMinutes());
  return `BK-${y}${m}${d}-${h}${min}`;
}

/**
 * POST /api/bookings
 * Create a new booking
 */
async function createBooking(req, res) {
  try {
    const {
      roomNumber,
      roomType,
      roomCost,
      customerName,
      dob,
      age,
      gender,
      contactNumber,
      address,
      aadhaarNumber,
      checkInDateTime,
      checkOutDateTime,
      paymentType,
    } = req.body;

    // Validate required fields
    if (
      !roomNumber ||
      !roomType ||
      !customerName ||
      !checkInDateTime ||
      !checkOutDateTime
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const bookingId = generateBookingId();
    const createdAt = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });

    const bookingData = {
      'Booking ID': bookingId,
      'Room Number': roomNumber,
      'Room Type': roomType,
      'Room Cost': roomCost || '',
      'Customer Name': customerName,
      DOB: dob || '',
      Age: age || '',
      Gender: gender || '',
      'Contact Number': contactNumber || '',
      Address: address || '',
      'Aadhaar Number': aadhaarNumber || '',
      'Check-In DateTime': checkInDateTime,
      'Expected Check-Out DateTime': checkOutDateTime,
      'Actual Check-Out DateTime': '',
      'Payment Type': paymentType || '',
      'Booking Status': 'ACTIVE',
      'Created At': createdAt,
    };

    await sheetsService.appendBooking(bookingData);

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      bookingId,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' });
  }
}

/**
 * GET /api/rooms/status
 * Get all room statuses
 */
async function getRoomStatuses(req, res) {
  try {
    const statuses = await sheetsService.getRoomStatuses();
    return res.json({ success: true, data: statuses });
  } catch (error) {
    console.error('Get room statuses error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' });
  }
}

/**
 * POST /api/bookings/checkout
 * Checkout a room
 */
async function checkoutBooking(req, res) {
  try {
    const { bookingId, roomNumber } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: 'Booking ID required' });
    }

    const actualCheckout = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });

    await sheetsService.checkoutBooking(bookingId, actualCheckout, roomNumber);

    return res.json({
      success: true,
      message: 'Checkout successful',
      actualCheckout,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' });
  }
}

/**
 * GET /api/bookings
 * Get all bookings for admin
 */
async function getAllBookings(req, res) {
  try {
    const bookings = await sheetsService.getAllBookings();
    return res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' });
  }
}

/**
 * Parse the en-IN toLocaleString format stored in 'Created At':
 * "DD/MM/YYYY, H:MM:SS am/pm"  →  valid Date object (local time)
 */
function parseCreatedAt(dateStr) {
  if (!dateStr) return null;
  const m = dateStr.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)$/i
  );
  if (!m) return new Date(dateStr); // fallback for unexpected formats
  let [, day, month, year, h, min, sec, meridiem] = m;
  h = parseInt(h);
  if (/pm/i.test(meridiem) && h !== 12) h += 12;
  if (/am/i.test(meridiem) && h === 12) h = 0;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(min), parseInt(sec));
}

/**
 * GET /api/admin/analytics
 * Get analytics data
 */
async function getAnalytics(req, res) {
  try {
    const bookings = await sheetsService.getAllBookings();

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-IN');

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Booking counts
    const bookingsToday = bookings.filter((b) => {
      const created = parseCreatedAt(b['Created At']);
      return created.toLocaleDateString('en-IN') === todayStr;
    }).length;

    const bookingsThisWeek = bookings.filter((b) => {
      const created = parseCreatedAt(b['Created At']);
      return created >= startOfWeek;
    }).length;

    const bookingsThisMonth = bookings.filter((b) => {
      const created = parseCreatedAt(b['Created At']);
      return created >= startOfMonth;
    }).length;

    // Room status
    const activeBookings = bookings.filter(
      (b) => b['Booking Status'] === 'ACTIVE'
    );
    const occupiedRooms = activeBookings.length;
    const availableRooms = 7 - occupiedRooms;

    // Room type distribution
    const roomTypeDistribution = { Suite: 0, Deluxe: 0, Luxury: 0 };
    bookings.forEach((b) => {
      if (roomTypeDistribution[b['Room Type']] !== undefined) {
        roomTypeDistribution[b['Room Type']]++;
      }
    });

    // Room-wise occupancy
    const roomOccupancy = {};
    for (let i = 1; i <= 7; i++) {
      roomOccupancy[`Room ${i}`] = 0;
    }
    bookings.forEach((b) => {
      if (roomOccupancy[b['Room Number']] !== undefined) {
        roomOccupancy[b['Room Number']]++;
      }
    });

    // Daily bookings - last 30 days
    const dailyBookings = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
      });
      dailyBookings[key] = 0;
    }

    bookings.forEach((b) => {
      const created = parseCreatedAt(b['Created At']);
      const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
      if (diff <= 29) {
        const key = created.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
        });
        if (dailyBookings[key] !== undefined) {
          dailyBookings[key]++;
        }
      }
    });

    // Revenue trend - last 30 days
    const revenueByDay = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
      });
      revenueByDay[key] = 0;
    }

    bookings.forEach((b) => {
      const created = parseCreatedAt(b['Created At']);
      const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
      if (diff <= 29) {
        const key = created.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
        });
        if (revenueByDay[key] !== undefined) {
          revenueByDay[key] += parseFloat(b['Room Cost']) || 0;
        }
      }
    });

    return res.json({
      success: true,
      data: {
        bookingsToday,
        bookingsThisWeek,
        bookingsThisMonth,
        occupiedRooms,
        availableRooms,
        roomTypeDistribution,
        roomOccupancy,
        dailyBookings,
        revenueByDay,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' });
  }
}

/**
 * POST /api/bookings/multiple
 * Create one booking row per room for multiple rooms under one guest
 */
async function createMultipleBookings(req, res) {
  try {
    const {
      rooms, // [{ roomNumber, roomType, roomCost }]
      customerName,
      dob, age, gender,
      contactNumber, address, aadhaarNumber,
      checkInDateTime, checkOutDateTime,
      paymentType,
    } = req.body;

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({ success: false, message: 'No rooms specified' });
    }
    if (!customerName || !checkInDateTime || !checkOutDateTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const createdAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    // All rooms in one multi-booking share a single booking ID (group invoice)
    const groupBookingId = generateBookingId();

    for (const room of rooms) {
      await sheetsService.appendBooking({
        'Booking ID': groupBookingId,
        'Room Number': room.roomNumber,
        'Room Type': room.roomType,
        'Room Cost': room.roomCost || '',
        'Customer Name': customerName,
        'DOB': dob || '',
        'Age': age || '',
        'Gender': gender || '',
        'Contact Number': contactNumber || '',
        'Address': address || '',
        'Aadhaar Number': aadhaarNumber || '',
        'Check-In DateTime': checkInDateTime,
        'Expected Check-Out DateTime': checkOutDateTime,
        'Actual Check-Out DateTime': '',
        'Payment Type': paymentType || '',
        'Booking Status': 'ACTIVE',
        'Created At': createdAt,
        'Advance Paid': '',
      });
    }

    return res.status(201).json({
      success: true,
      message: `${rooms.length} bookings created successfully`,
      bookingId: groupBookingId,
    });
  } catch (error) {
    console.error('Create multiple bookings error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}

/**
 * POST /api/bookings/prebook
 * Create future/pre-bookings (status = FUTURE), one row per room
 */
async function createPreBooking(req, res) {
  try {
    const {
      rooms, // [{ roomNumber, roomType, roomCost }]
      customerName,
      contactNumber,
      checkInDateTime, checkOutDateTime,
      advancePaid,
    } = req.body;

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({ success: false, message: 'No rooms specified' });
    }
    if (!customerName || !checkInDateTime || !checkOutDateTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const createdAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const bookingIds = [];

    for (const room of rooms) {
      const bookingId = generateBookingId();
      await sheetsService.appendBooking({
        'Booking ID': bookingId,
        'Room Number': room.roomNumber,
        'Room Type': room.roomType,
        'Room Cost': room.roomCost || '',
        'Customer Name': customerName,
        'DOB': '', 'Age': '', 'Gender': '',
        'Contact Number': contactNumber || '',
        'Address': '', 'Aadhaar Number': '',
        'Check-In DateTime': checkInDateTime,
        'Expected Check-Out DateTime': checkOutDateTime,
        'Actual Check-Out DateTime': '',
        'Payment Type': '',
        'Booking Status': 'FUTURE',
        'Created At': createdAt,
        'Advance Paid': advancePaid !== undefined ? String(advancePaid) : '0',
      });
      bookingIds.push(bookingId);
    }

    return res.status(201).json({
      success: true,
      message: `${rooms.length} pre-bookings created successfully`,
      bookingIds,
    });
  } catch (error) {
    console.error('Create pre-booking error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}

module.exports = {
  createBooking,
  createMultipleBookings,
  createPreBooking,
  getRoomStatuses,
  checkoutBooking,
  getAllBookings,
  getAnalytics,
};
