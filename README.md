# My Business ERP — React/Vite Edition

A professional, modular ERP system for small-to-medium businesses. Built with React 18, Vite, Zustand, Firebase, and Tailwind CSS.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure Firebase
cp .env.example .env
# Edit .env with your Firebase project credentials

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📦 Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| UI Framework  | React 18 + Vite 5                   |
| State         | Zustand 4 (with devtools)           |
| Routing       | React Router v6 (lazy-loaded)       |
| Backend       | Firebase (Auth + Firestore + Storage)|
| Styling       | Tailwind CSS 3                      |
| PDF Export    | html2pdf.js (Android-safe)          |
| Voice         | Web SpeechRecognition API (no LLM)  |
| Icons         | Inline SVGs (no bundle overhead)    |

---

## 📁 Project Structure

```
src/
├── config/          Firebase init + constants (GST rates, plan limits)
├── router/          AppRoutes + ProtectedRoute + RoleRoute
├── store/           Zustand slices (auth, invoice, inventory, crm, expense, subscription, ui)
├── services/
│   ├── firebase/    One file per module: auth, invoice, inventory, crm, expense, subscription
│   └── pdf/         invoice.pdf.js + bulk.pdf.js (with Android blank-PDF fix)
├── hooks/           useVoice, useOmnibox, useRealtimeSync, useSubscription
├── components/
│   ├── ui/          Button, Modal, Toast, Badge (atomic, no business logic)
│   ├── layout/      AppShell, Sidebar, Topbar
│   └── voice/       VoicePanel, UpgradeModal
├── features/        One folder per ERP module
│   ├── dashboard/   Dashboard, Analytics
│   ├── invoice/     InvoiceModule (new), InvoiceRecords
│   ├── inventory/   InventoryModule
│   ├── crm/         CRMModule
│   ├── expenses/    ExpenseModule
│   ├── employees/   EmployeeModule
│   ├── gst/         GSTModule
│   └── settings/    SettingsModule
└── utils/           gst.js, fuzzy.js, date.js, invoiceId.js
```

---

## 🔑 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project (or use existing `dev-ayurveda`)
3. Enable **Authentication → Email/Password**
4. Enable **Firestore Database** (production mode)
5. Copy credentials to `.env`

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /subscriptions/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if false; // Cloud Functions only
    }
    match /businesses/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

---

## 🎙️ Voice Commands

The voice engine is a **pure rule-based state machine** — no LLM, no API costs.

| Say (Hindi/English/Hinglish)          | Action                          |
|---------------------------------------|---------------------------------|
| `naya bill banao` / `new invoice`     | Start invoice creation flow     |
| `client check karo`                   | CRM balance lookup              |
| `stock check karo`                    | Inventory stock query           |
| `aaj ki report`                       | Daily sales summary (TTS)       |
| `gst calculate`                       | GST calculator                  |
| `dashboard` / `inventory tab`         | Navigate to any tab             |
| `cancel` / `band karo`               | Reset from any state            |

---

## 💳 SaaS Plans

| Feature               | Free (30 inv/mo) | Pro ₹499/mo | Enterprise ₹1499/mo |
|-----------------------|-----------------|-------------|---------------------|
| Invoices/month        | 30              | Unlimited   | Unlimited           |
| Analytics             | ✗               | ✓           | ✓                   |
| Employees             | 2               | 10          | Unlimited           |
| Bulk PDF              | ✗               | ✓           | ✓                   |
| Voice Assistant       | ✓               | ✓           | ✓                   |
| White-label           | ✗               | ✗           | ✓                   |

To integrate Razorpay, edit `src/components/voice/UpgradeModal.jsx` — the hook slot is clearly marked.

---

## 🔧 Build for Production

```bash
npm run build
# Output in /dist — deploy to Firebase Hosting, Vercel, or Netlify
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set public dir to "dist"
npm run build
firebase deploy
```

---

## 📌 Key Architectural Decisions

**Zustand over Redux** — AppState maps 1:1 with Zustand's flat store. Zero ceremony, full devtools support.

**Feature folders** — Each ERP module owns its own folder. Moving a feature or onboarding a new developer requires touching only one folder.

**Services layer** — Firebase is only called inside `/services/firebase/`. Components never call `db.collection()` directly, making backend migration painless.

**Lazy-loaded routes** — Each feature module is code-split. Dashboard loads instantly; GST module only downloads when the user navigates there.

**Android-safe PDF** — `position:fixed;left:-9999px` instead of `z-index:-9999`. The latter causes blank 3kb PDFs on Android Chrome. Both `invoice.pdf.js` and `bulk.pdf.js` use the correct approach.

---

*My Business ERP v2.0 — Built with React + Firebase + ❤️*
