# Job Bid Management System - Frontend Guide

## 🎨 Application Overview

Your Job Bid Management System is a **Tauri desktop application** with a React frontend. It has two main dashboards for managing job applications and interviews.

---

## 📱 Application Structure

### **Main Layout** (`packages/frontend/src/components/Layout.tsx`)

The app has a clean navigation layout with:
- **Header**: Application title "Job Bid Management System"
- **Navigation Tabs**: Switch between "Bids" and "Interviews"
- **Content Area**: Shows the active dashboard

---

## 🎯 Dashboard 1: Bid Dashboard

**Location**: `packages/frontend/src/pages/BidDashboard.tsx`

### Features:

#### **1. Create New Bid Form** (`BidForm.tsx`)
Fields:
- **Link** (required): Job posting URL
- **Company** (required): Company name
- **Client**: Client company (if different)
- **Role** (required): Job title
- **Main Stacks** (required): Technologies (comma-separated)
- **Job Description** (required): Full job description
- **Resume** (required): Resume text you submitted

**Warnings Displayed**:
- ⚠️ Duplication warnings (if same link or company+role exists)
- ⚠️ Company history warnings (if you failed interviews there before)

#### **2. Bid List Table** (`BidList.tsx`)
Columns:
- **Date**: When bid was created
- **Company**: Company name
- **Client**: Client company
- **Role**: Job title
- **Status**: NEW, SUBMITTED, REJECTED, INTERVIEW_STAGE, CLOSED
- **Interview Winning**: ✓ if you got an interview
- **Resume Checker**: Shows if ATS or Recruiter screened (with confidence)
- **Actions**: Edit, Delete, Rebid buttons

#### **3. Filtering** (`BidFilters.tsx`)
Filter by:
- Company name
- Role
- Status
- Date range

#### **4. Sorting**
Click column headers to sort by:
- Date
- Company
- Role
- Status

#### **5. Rebid Feature** (`RebidForm.tsx`)
For rejected bids (without interview):
- Pre-fills all data from original bid
- Allows updating resume and job description
- Links to original bid for tracking

---

## 🎯 Dashboard 2: Interview Dashboard

**Location**: `packages/frontend/src/pages/InterviewDashboard.tsx`

### Features:

#### **1. Schedule Interview Form** (`InterviewForm.tsx`)

**Two Modes**:

**A. From Bid**:
- Select existing bid from dropdown
- Auto-populates: company, client, role
- Add: recruiter name, attendees, interview type, date, details

**B. From LinkedIn Chat**:
- Manual entry for all fields
- Company, client, role, recruiter, attendees, type, date, details

**Eligibility Validation**:
- ✅ Shows if interview is allowed
- ❌ Blocks if same recruiter + overlapping attendees from failed interview
- ℹ️ Explains why (e.g., "New recruiter, allowed")

#### **2. Interview List Table** (`InterviewList.tsx`)
Columns:
- **Date**: Interview date
- **Company**: Company name
- **Client**: Client company
- **Role**: Job title
- **Type**: HR, Technical, Final, etc.
- **Recruiter**: Recruiter name
- **Status**: SCHEDULED, COMPLETED_SUCCESS, COMPLETED_FAILURE, CANCELLED
- **Actions**: Complete, Edit, Delete buttons

#### **3. Complete Interview Form** (`CompleteInterviewForm.tsx`)
For scheduled interviews:
- Mark as **Success** or **Failure**
- Add completion details/notes
- If failed: automatically records in company history

#### **4. Filtering** (`InterviewFilters.tsx`)
Filter by:
- Company name
- Role
- Status
- Date range

#### **5. Sorting**
Click column headers to sort by:
- Date
- Company
- Role
- Status

---

## 🎨 Styling

**Location**: `packages/frontend/src/styles/dashboard.css`

The app uses a clean, modern design with:
- **Color Scheme**: Professional blues and grays
- **Typography**: Clear, readable fonts
- **Layout**: Responsive grid system
- **Forms**: Clean input fields with validation
- **Tables**: Sortable, filterable data tables
- **Buttons**: Clear action buttons with hover effects

---

## 🔌 API Integration

**Location**: `packages/frontend/src/api/client.ts`

The frontend connects to the backend API at `http://localhost:3000`:

### Endpoints Used:

**Bids**:
- `GET /api/bids` - List all bids (with filters)
- `POST /api/bids` - Create new bid
- `GET /api/bids/:id` - Get single bid
- `PUT /api/bids/:id` - Update bid
- `DELETE /api/bids/:id` - Delete bid
- `POST /api/bids/:id/rebid` - Create rebid

**Interviews**:
- `GET /api/interviews` - List all interviews (with filters)
- `POST /api/interviews` - Schedule interview
- `GET /api/interviews/:id` - Get single interview
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview
- `POST /api/interviews/:id/complete` - Complete interview

**Company History**:
- `GET /api/company-history` - Get history by company and role
- `GET /api/company-history/all` - Get all history

---

## 🚀 Running the Frontend

### Development Mode (with hot reload):
```bash
cd packages/frontend
npm run dev          # Vite dev server (browser)
npm run tauri:dev    # Tauri desktop app
```

### Production Build:
```bash
cd packages/frontend
npm run build        # Build React app
npm run tauri:build  # Build desktop app executable
```

---

## 📦 Key Technologies

- **Tauri**: Native desktop app framework
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **React Query**: Data fetching and caching
- **React Router**: Navigation
- **Axios**: HTTP client
- **Vite**: Build tool and dev server

---

## 🎯 User Workflow Examples

### **Scenario 1: Creating a New Bid**
1. Open app → Bids Dashboard
2. Fill out "Create New Bid" form
3. Submit
4. See warnings if duplicate or company history issues
5. Bid appears in table below

### **Scenario 2: Scheduling an Interview**
1. Open app → Interviews Dashboard
2. Click "Schedule Interview"
3. Select "From Bid" → Choose bid from dropdown
4. Add recruiter, attendees, type, date
5. System validates eligibility
6. Submit → Interview appears in table

### **Scenario 3: Completing an Interview**
1. Interviews Dashboard → Find scheduled interview
2. Click "Complete" button
3. Select Success or Failure
4. Add notes
5. Submit → Status updates, company history recorded if failed

### **Scenario 4: Rebidding After Rejection**
1. Bids Dashboard → Find rejected bid (without interview)
2. Click "Rebid" button
3. Update resume or job description
4. Submit → New bid created, linked to original

---

## 🎨 What It Looks Like

The app opens as a **native desktop window** with:

```
┌─────────────────────────────────────────────────────┐
│  Job Bid Management System                          │
├─────────────────────────────────────────────────────┤
│  [Bids] [Interviews]                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Create New Bid                                     │
│  ┌────────────────────────────────────────────┐    │
│  │ Link: [_____________________________]      │    │
│  │ Company: [_____________________________]   │    │
│  │ Role: [_____________________________]      │    │
│  │ ...                                        │    │
│  │ [Submit Bid]                               │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Your Bids                                          │
│  ┌────────────────────────────────────────────┐    │
│  │ Date    Company    Role    Status    ...   │    │
│  ├────────────────────────────────────────────┤    │
│  │ 1/26    Google     SWE     NEW       ...   │    │
│  │ 1/25    Meta       SRE     REJECTED  ...   │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

**Environment Variables** (`packages/frontend/.env`):
```bash
VITE_API_BASE_URL=http://localhost:3000
```

This tells the frontend where to find the backend API.

---

**Your frontend is fully built and ready to run!** Just use `start.bat` to launch the desktop app! 🎉
