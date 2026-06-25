import jsPDF from 'jspdf';
import logo from '../components/assets/logo.jpeg';

function maskAadhaar(num) {
  if (!num) return '';
  const digits = num.replace(/\s/g, '');
  if (digits.length !== 12) return num;
  return `XXXX XXXX ${digits.slice(8)}`;
}

function formatDT(dtLocal) {
  if (!dtLocal) return '';
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return dtLocal;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}


/**
 * @param {string} bookingId
 * @param {object} formData  - guest + booking fields from the form
 * @param {Array|null} rooms - for multi-room: [{ roomNumber, roomType, roomCost }, ...]
 *                            - null for single-room (uses formData.roomNumber etc.)
 */
export function generateInvoice(bookingId, formData, rooms = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const LM = 20;
  const RM = W - 20;
  let y = 22;

  // ── Helpers ──────────────────────────────────────────────

  const line = (color = [203, 213, 225]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.4);
    doc.line(LM, y, RM, y);
    y += 5;
  };

  const sectionHeading = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text(title, LM, y);
    y += 3;
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.3);
    doc.line(LM, y, RM, y);
    y += 5;
  };

  // Only renders if value is non-empty
  const field = (label, value) => {
    const v = value !== null && value !== undefined ? String(value).trim() : '';
    if (!v) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, LM, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(v, RM - LM - 52);
    doc.text(lines, LM + 50, y);
    y += lines.length * 5 + 1;
  };

  // ── Header ───────────────────────────────────────────────

  const headerTop = y;

  try {
    doc.addImage(logo, 'PNG', LM, headerTop - 2, 38, 30);
  } catch (_) {}

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('Sunrise Residency', W / 2, headerTop + 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Guest Check-In Invoice', W / 2, headerTop + 18, { align: 'center' });

  const rightX = W - 62;
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('PAN : ALCPC7552N', rightX, headerTop + 3);
  doc.text(
    ['Address :', 'Sunrise Residency, Opp TDP office,', 'Brahmanapalle road, Pulivendula,', 'Andhra Pradesh - 516390', 'Phone : +91 9440893697'],
    rightX, headerTop + 8
  );

  y = headerTop + 35;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(LM, y, RM, y);
  y += 8;

  // ── Invoice Meta ─────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  doc.text('INVOICE', RM, y, { align: 'right' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Booking ID : ${bookingId}`, RM, y, { align: 'right' });
  y += 5;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Issue Date : ${today}`, RM, y, { align: 'right' });
  y += 10;

  line([203, 213, 225]);

  // ── Guest Details ────────────────────────────────────────

  sectionHeading('GUEST DETAILS');

  field('Name', formData.fullName);
  field('Contact No.', formData.contactNumber);
  field('Aadhaar No.', maskAadhaar(formData.aadhaarNumber));
  field('Address', formData.address);
  y += 3;

  // ── Reservation Details ──────────────────────────────────

  sectionHeading('RESERVATION DETAILS');

  if (rooms && rooms.length > 0) {
    // Multi-room: list each room with its type
    field('Check-In', formatDT(formData.checkIn));
    field('Check-Out', formatDT(formData.checkOut));
    y += 2;

    // Room-type table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const col2 = LM + 38;
    const col3 = LM + 110;
    doc.text('Room', LM, y);
    doc.text('Type', col2, y);
    doc.text('Amount', col3, y, { align: 'right' });
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(LM, y, RM, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    let totalCost = 0;
    rooms.forEach((r) => {
      doc.text(r.roomNumber, LM, y);
      doc.text(r.roomType, col2, y);
      doc.text(`Rs. ${parseInt(r.roomCost || 0).toLocaleString('en-IN')}`, col3, y, { align: 'right' });
      y += 6;
      totalCost += parseInt(r.roomCost || 0);
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(LM, y, RM, y);
    y += 3;

    // store for total amount box
    formData._totalCost = totalCost;

  } else {
    // Single room
    field('Room', formData.roomNumber);
    field('Room Type', formData.roomType);
    field('Check-In', formatDT(formData.checkIn));
    field('Check-Out', formatDT(formData.checkOut));
  }

  y += 3;

  // ── Payment Details ──────────────────────────────────────

  sectionHeading('PAYMENT DETAILS');
  field('Payment Method', formData.paymentType);
  y += 2;

  // Total amount box — formData.roomCost acts as a manual override for multi-room
  const totalAmount = rooms
    ? (formData.roomCost ? parseInt(formData.roomCost || 0) : (formData._totalCost || 0))
    : parseInt(formData.roomCost || 0);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(LM, y, RM - LM, 13, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Amount', LM + 4, y + 8.5);
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(`Rs. ${totalAmount.toLocaleString('en-IN')}`, RM - 4, y + 8.5, { align: 'right' });
  y += 20;

  // ── Footer ───────────────────────────────────────────────

  line([203, 213, 225]);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for choosing Sunrise Lodge! We hope you enjoy your stay.', W / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('For any assistance, please contact the reception desk - +91 81439 59559', W / 2, y, { align: 'center' });

  doc.save(`Invoice-${bookingId}.pdf`);
}
