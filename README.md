# 🏨 Lodge Management System

A production-ready lodge management system with Reception Dashboard, Admin Analytics, OCR-based Aadhaar scanning, and Google Sheets as the database.

---

## 📁 Project Structure

```
lodge-system/
├── frontend/               # React.js (Vite) frontend
│   ├── src/
│   │   ├── pages/          # ReceptionPage, AdminPage
│   │   ├── components/
│   │   │   ├── reception/  # RoomCard
│   │   │   ├── booking/    # ImageCapture, Steps 1-4, Modals
│   │   │   └── admin/      # AnalyticsCards, AdminCharts, BookingsTable
│   │   ├── services/       # api.js (axios)
│   │   └── styles/         # global.css
│   └── package.json
│
├── backend/                # Node.js + Express backend
│   ├── controllers/        # bookingController, ocrController
│   ├── routes/             # index.js (all API routes)
│   ├── services/           # googleSheets.js, ocrService.js
│   ├── assets/             # QR code image goes here
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Prerequisites

- Node.js v18+
- Google Cloud project with:
  - Google Sheets API enabled
  - Google Vision API enabled
  - A Service Account with credentials

---

## 🔧 Setup Instructions

### Step 1: Google Sheets Setup

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name the first sheet tab exactly: **Bookings**
3. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

### Step 2: Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable these APIs:
   - **Google Sheets API**
   - **Cloud Vision API**
4. Go to **IAM & Admin → Service Accounts**
5. Create a service account, download JSON key
6. Share your Google Sheet with the service account email (Editor permission)

### Step 3: Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
```

**backend/.env:**
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY\n-----END RSA PRIVATE KEY-----"
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_VISION_API_KEY=your_vision_api_key
PORT=5000
FRONTEND_URL=http://localhost:5173
QR_CODE_IMAGE=qr-payment.png
```

> **Note**: Place your UPI QR code image at `backend/assets/qr-payment.png`

```bash
npm run dev    # Development
npm start      # Production
```

### Step 4: Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env if backend runs on a different port
npm install
npm run dev
```

**frontend/.env:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/status` | Get all room statuses |
| POST | `/api/bookings` | Create a new booking |
| GET | `/api/bookings` | Get all bookings |
| POST | `/api/bookings/checkout` | Checkout a room |
| POST | `/api/ocr/front` | OCR front side of Aadhaar |
| POST | `/api/ocr/back` | OCR back side of Aadhaar |
| GET | `/api/admin/analytics` | Get admin analytics |
| GET | `/api/qr-code` | Get payment QR code image |
| GET | `/api/health` | Health check |

---

## 📊 Google Sheet Columns

The system auto-creates headers in this order:

| Column | Description |
|--------|-------------|
| Booking ID | BK-YYYYMMDD-XXXX |
| Room Number | Room 1–7 |
| Room Type | Suite / Deluxe / Luxury |
| Room Cost | ₹1500 / ₹1800 / ₹2000 |
| Customer Name | From Aadhaar OCR |
| DOB | From Aadhaar OCR |
| Age | Auto-calculated |
| Gender | From Aadhaar OCR |
| Contact Number | Manual entry |
| Address | From Aadhaar back OCR |
| Aadhaar Number | From Aadhaar OCR |
| Check-In DateTime | Selected by staff |
| Expected Check-Out DateTime | Selected by staff |
| Actual Check-Out DateTime | Set at checkout |
| Payment Type | UPI / CASH |
| Booking Status | ACTIVE / CHECKED_OUT |
| Created At | Auto timestamp |

---

## 🏨 Features

### Reception Dashboard
- 7 color-coded room cards (Green = Available, Red = Occupied)
- Shows guest name & checkout time for occupied rooms
- Auto-refresh every 60 seconds
- Tap green room → Book; Tap red room → Checkout

### Booking Flow (4 Steps)
1. **Customer Verification** — Camera/upload Aadhaar, OCR auto-fills details
2. **Room Type** — Suite ₹1500, Deluxe ₹1800, Luxury ₹2000
3. **Payment** — QR code + UPI/Cash selection
4. **Success** — Booking ID generated, saved to Google Sheets

### Admin Dashboard (`/admin`)
- 5 analytics cards: Today, Week, Month, Occupied, Available
- 4 charts: Room Type Pie, Room-Wise Pie, Daily Bar, Revenue Line
- Full bookings table with search, filter, pagination

---

## 🚀 Deployment

### Option 1: Same Server (Recommended for small lodge)

```bash
# Build frontend
cd frontend && npm run build

# Serve static files from Express
# Add to backend/server.js:
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

# Run backend
cd backend && npm start
```

### Option 2: Separate Deployment
- **Frontend**: Deploy `frontend/dist` to Netlify, Vercel, or any static host
- **Backend**: Deploy to Railway, Render, Heroku, or VPS
- Update `VITE_API_BASE_URL` and `FRONTEND_URL` accordingly

---

## 🔒 Security Notes

- Never commit `.env` files to git
- Add `backend/.env` and `frontend/.env` to `.gitignore`
- Rotate Google Vision API key periodically
- Consider adding basic auth to `/admin` route for production

---

## 📱 Mobile Support

The system is fully mobile-responsive:
- Large touch targets on all buttons
- Camera access for Aadhaar scanning
- Responsive grid layouts
- Bottom-sheet modals on mobile

---

## ❓ Troubleshooting

**OCR not working?**
- Verify `GOOGLE_VISION_API_KEY` in backend `.env`
- Enable Cloud Vision API in Google Cloud Console

**Sheets not saving?**
- Verify service account email has Editor access to the sheet
- Check `GOOGLE_SHEET_ID` is correct (only the ID, not full URL)
- Ensure the tab is named exactly `Bookings`

**Rooms always showing green?**
- Check backend is running and reachable
- Verify Google Sheets credentials

**Camera not opening?**
- Camera requires HTTPS in production (or localhost)
- Use image upload as fallback
