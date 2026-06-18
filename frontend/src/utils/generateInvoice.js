import jsPDF from 'jspdf';

function maskAadhaar(num) {
  if (!num) return 'N/A';
  const digits = num.replace(/\s/g, '');
  if (digits.length !== 12) return num;
  return `XXXX XXXX ${digits.slice(8)}`;
}

function formatDT(dtLocal) {
  if (!dtLocal) return 'N/A';
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return dtLocal;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function generateInvoice(bookingId, formData) {
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

  const field = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, LM, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(String(value || '—'), RM - LM - 52);
    doc.text(lines, LM + 50, y);
    y += lines.length * 5 + 1;
  };

 // ── Lodge Header with Logo ───────────────────────────────

// Placeholder logo
try {
  doc.addImage(logo, 'PNG', W / 2 - 20, y - 5, 40, 40);
} catch (err) {
  console.log('Logo not loaded');
}

y += 42;

// SUNRISE
doc.setFont('times', 'bold');
doc.setFontSize(26);
doc.setTextColor(35, 25, 15);
doc.text('SUNRISE', W / 2, y, {
  align: 'center'
});

y += 10;

// RESIDENCY
doc.setFont('times', 'bold');
doc.setFontSize(18);
doc.setTextColor(35, 25, 15);
doc.text('RESIDENCY', W / 2, y, {
  align: 'center'
});

y += 8;

// Tagline
doc.setFont('times', 'italic');
doc.setFontSize(10);
doc.setTextColor(120, 120, 120);
doc.text('Guest Check-In Invoice', W / 2, y, {
  align: 'center'
});

y += 10;

line([220, 220, 220]);

  // ── Invoice meta (right-aligned) ─────────────────────────
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
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  doc.text(`Issue Date : ${today}`, RM, y, { align: 'right' });
  y += 10;

  line([203, 213, 225]);

  // ── Guest Details ────────────────────────────────────────
  sectionHeading('GUEST DETAILS');
  field('Name', formData.fullName);
  field('Age', formData.age ? `${formData.age} years` : '—');
  field('Gender', formData.gender);
  field('Date of Birth', formData.dob);
  field('Contact No.', formData.contactNumber);
  field('Aadhaar No.', maskAadhaar(formData.aadhaarNumber));
  field('Address', formData.address);
  y += 3;

  // ── Reservation Details ──────────────────────────────────
  sectionHeading('RESERVATION DETAILS');
  field('Room', formData.roomNumber);
  field('Room Type', formData.roomType);
  field('Check-In', formatDT(formData.checkIn));
  field('Check-Out', formatDT(formData.checkOut));
  y += 3;

  // ── Payment Details ──────────────────────────────────────
  sectionHeading('PAYMENT DETAILS');
  field('Payment Method', formData.paymentType);
  y += 2;

  // Total amount highlighted box
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(LM, y, RM - LM, 13, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Amount', LM + 4, y + 8.5);
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(
    `Rs. ${parseInt(formData.roomCost || 0).toLocaleString('en-IN')}`,
    RM - 4, y + 8.5, { align: 'right' }
  );
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
