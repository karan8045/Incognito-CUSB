# Incognito CUSB — Student Social Forum Platform

> **Your Campus. Your Voice.**  
> An independent, full-stack, mobile-first social platform designed exclusively for students of **Central University of South Bihar (CUSB), Gaya, Bihar, India**.

Incognito CUSB uniquely synthesizes:
- **Reddit-inspired** public feed & department forums with upvoting/downvoting and post immutability (no user edit/delete).
- **Discord-inspired** nested discussion threads with collapsible replies and `@username` mentions.
- **Telegram-inspired** private messaging with strict chat-request controls (exactly one initial message before acceptance, then unlimited real-time chat with replies, reactions, and media).

---

## 🏛️ Core Platform Architecture

### 1. Dual Public Areas
- **Global Forum (`/feed`):** University-wide discussion feed with latest/popular sorting, rich media attachments, voting, and report mechanisms.
- **29 Department Hubs (`/departments`):** Independent academic forums for all 29 official CUSB departments with "Turn on notifications" subscription toggles.

### 2. Privacy & Telegram-Style Messaging (`/messages`)
- **Chat Request Flow:** User A sends a chat request with **strictly one message**. User B sees the request and can **Accept**, **Reject**, or **Block**.
- **Post-Acceptance:** Unlimited real-time private messaging over Server-Sent Events (SSE) with typing indicators, read receipts, message replies, and emoji reactions.
- **Two-Way Blocking:** When User A blocks User B, both users immediately lose mutual messaging, chat requests, profile visibility, and post interactions.
- **No Anonymous Posting:** Every public post and comment displays the author's avatar, username, display name, and timestamp.

### 3. Account Security & Strict Policies
- **No Password Recovery System:** Passwords cannot be recovered through email, SMS, OTP, or admin resets. Users are warned explicitly during signup.
- **Permanent Account Deletion:** Immediate irreversible anonymization transforms user records to **"Deleted User"** across historical posts, comments, and conversations while preserving discussion integrity.
- **Security & Audit Telemetry:** Captures standard HTTP metadata (IP address, user-agent, browser, OS, device type) for fraud and abuse prevention without claiming or attempting deceptive MAC address collection.

---

## 📚 All 29 Official CUSB Departments (Database-Seeded)

1. Centre for Development Studies
2. Centre for Foreign Languages
3. Centre for Indian Languages
4. Department of Agriculture
5. Department of Bioinformatics
6. Department of Biotechnology
7. Department of Chemistry
8. Department of Commerce and Business Studies
9. Department of Computer Science
10. Department of Economics
11. Department of English
12. Department of Environmental Science
13. Department of Geography
14. Department of Geology
15. Department of Hindi
16. Department of History
17. Department of Law and Governance
18. Department of Life Science
19. Department of Mass Communication and Media
20. Department of Mathematics
21. Department of Pharmacy
22. Department of Physical Education
23. Department of Physics
24. Department of Political Science and International Relations
25. Department of Psychology
26. Department of Social Work
27. Department of Sociology
28. Department of Statistics
29. Department of Teacher Education

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom CUSB color system and glassmorphism UI
- **Database & ORM:** Prisma ORM with dual PostgreSQL (production) & SQLite (zero-config local dev) schemas
- **Authentication:** Salted bcrypt (12 rounds) + JWT stored in secure `httpOnly`, `SameSite=Lax` cookies
- **Real-Time:** Native Server-Sent Events (SSE) stream (`/api/realtime/stream`)
- **Media Uploads:** Multi-part file upload with strict MIME type checking and executable script blocking
- **Icons:** Lucide React

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/incognito-cusb.git
cd "Incognito CUSB"
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local configuration uses SQLite (`file:./dev.db`), allowing you to develop and test immediately with zero external services.

### 3. Generate Prisma Client & Push Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Seed all 29 Official Departments
```bash
npm run seed
```

### 5. Run Verification Suite
```bash
npm test
```
Runs 31 automated tests verifying auth, voting, nested comments, chat requests, blocking, and account deletion.

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel (PostgreSQL Production)

### 1. Provision a PostgreSQL Database (Supabase / Neon)
Create a free PostgreSQL database on [Supabase](https://supabase.com):
1. Create a new project (e.g., `incognito-cusb` in region South Asia / Mumbai).
2. Go to **SQL Editor** (`>_`) &rarr; click **+ New query**.
3. Paste the contents of [`schema.sql`](./schema.sql) and click **Run**. This creates all 19 tables, foreign keys, indexes, and automatically seeds all 29 official CUSB departments!
4. Copy your database connection URI from **Connect** / **Database Settings** (Port `5432` Session Mode).

### 2. Switch Prisma to PostgreSQL
Run the switch helper:
```bash
npm run db:postgres
```
This updates `prisma/schema.prisma` to use `provider = "postgresql"`.

### 3. Set Environment Variables in Vercel
In your Vercel Project Settings &rarr; **Environment Variables**, add:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A secure random 64-character secret key.
- `ADMIN_SECRET`: A secure administrator key.
- `NEXT_PUBLIC_APP_URL`: Your production domain (e.g. `https://incognito-cusb.vercel.app`).
- `NODE_ENV`: `production`.

### 4. Deploy
Push to GitHub and deploy on Vercel:
```bash
vercel --prod
```
During the build, `prisma generate` will automatically compile the client. On first deployment, run `npx prisma db push && node prisma/seed.js` to initialize the tables and seed all 29 departments.

---

## ⚖️ Legal & Community Pages

- **Privacy Policy (`/privacy`):** Fully documented data practices, storage, audit logs, and transparent disclosures.
- **Terms of Service (`/terms`):** Detailed user agreement, immutable post rules, and anti-abuse policies.
- **Community Guidelines (`/guidelines`):** Student-friendly norms protecting freedom of speech, academic debate, and clear anti-harassment safeguards.

---

## 🛡️ Disclaimer
Incognito CUSB is an independent student platform created exclusively for students of Central University of South Bihar (CUSB), Gaya, Bihar, India. It is not affiliated with, endorsed by, or operated by the university administration.
