// backend/controllers/bookingController.js
const { v4: uuidv4 } = require('uuid');
const sheetsService = require('../services/googleSheets');

/**
 * Generate booking ID: BK-YYYYMMDD-XXXX
 */
function generateBookingId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BK-${date}-${random}`;
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
    const { bookingId } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: 'Booking ID required' });
    }

    const actualCheckout = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });

    await sheetsService.checkoutBooking(bookingId, actualCheckout);

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
      const created = new Date(b['Created At']);
      return created.toLocaleDateString('en-IN') === todayStr;
    }).length;

    const bookingsThisWeek = bookings.filter((b) => {
      const created = new Date(b['Created At']);
      return created >= startOfWeek;
    }).length;

    const bookingsThisMonth = bookings.filter((b) => {
      const created = new Date(b['Created At']);
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
      const created = new Date(b['Created At']);
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
      const created = new Date(b['Created At']);
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

module.exports = {
  createBooking,
  getRoomStatuses,
  checkoutBooking,
  getAllBookings,
  getAnalytics,
};
