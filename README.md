# CampusLink: Enterprise Campus Placement & Recruitment Portal

An end-to-end, role-based Campus Placement & Recruitment Management Platform designed to streamline college hiring pipelines. The application enables students to apply for eligible jobs, recruiters to manage drives and candidates, and administrators to verify recruiters and view global placement metrics.

## 🚀 Key Features

### 👤 Role-Based Portals (RBAC)
- **Student Dashboard**: 
  - Manage academic profiles (CGPA, Branch, Backlogs, Graduation Year).
  - Upload PDF resumes to be shared directly with recruiters.
  - Browse eligible job drives (automatically filtered by eligibility criteria).
  - Track application statuses in real-time with a visual status timeline.
  - Receive instant system notifications when application status updates or feedback is submitted.
- **Recruiter Portal**:
  - Post and manage job placement drives with dynamic details (LPA package, date, CGPA minimums, backlog limits).
  - Review applicant details, download resumes, and filter candidates.
  - Shortlist, select, or reject applicants and leave custom comments/feedback.
- **Admin Dashboard**:
  - Verify and approve/revoke recruiter accounts.
  - Monitor global placement analytics (total students placed, active companies, application counts, and overall placement rates).
  - Track academic branch metrics (total vs. placed students per branch).
  - Review all active recruitment drives.

### 🛡️ Core Security & Tech Stack
- **Authentication**: JWT (JSON Web Tokens) secure role-based session authorization.
- **Password Security**: Salted hashing using `bcryptjs`.
- **Database**: Lightweight SQLite (`sqlite3` module) with full foreign key constraint integrity.
- **Resume Uploads**: Handled securely via `multer` multipart form parser.
- **Frontend**: Single-Page Application (SPA) built using React (Vite) and Lucide React icons.
- **Styling**: Sleek glassmorphism visual system, customized dark mode, modern typography (Outfit Google Font), smooth transitions, and responsive grid layouts.

---

## 🛠️ Architecture

The project consists of a decoupled client-server structure:

```
placement-portal/
├── client/                 # React SPA (Vite Dev Server)
│   ├── src/
│   │   ├── components/     # AdminPortal, CompanyPortal, StudentPortal
│   │   ├── App.jsx         # Authentication wrapper & session routing
│   │   ├── index.css       # Custom design system & styles
│   │   └── main.jsx
│   └── vite.config.js      # API / Uploads proxy configurations
│
└── server/                 # Express REST API
    ├── uploads/            # Student resume storage directory
    ├── db.js               # SQLite database setup & tables schema
    ├── middleware.js       # JWT Verification & Role authorization filters
    ├── seed.js             # Mock seed data (drives, students, companies)
    └── server.js           # REST API endpoints & route handlers
```

---

## 💻 Installation & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Install Dependencies
Run the command below in the root directory to install packages for both the client and server:
```bash
npm run install-all
```

### 2. Seed the Database
Initialize the database schemas and insert mock datasets:
```bash
npm run seed
```

### 3. Launch Development Servers
Run client and server in separate terminal windows:
```bash
# Start backend server (Express on Port 5000)
npm run server

# Start frontend client (Vite on Port 3000)
npm run client
```

---

## 🔑 Seeding / Demo Accounts

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `admin123` | Full admin dashboard controls & global analytics |
| **Student** | `jane.doe@college.edu` | `password123` | Eligible student profile, resume uploaded |
| **Recruiter** | `hiring@stripe.com` | `password123` | Verified company account (Stripe Inc.) |
| **Recruiter** | `careers@atlassian.com` | `password123` | Unverified company account (Pending admin approval) |
"# CampusLink" 
