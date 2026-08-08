# WriteSpace ✍️

A modern, Substack-inspired editorial blogging platform built with **Next.js 13 (App Router)**, **Prisma ORM**, **MongoDB Atlas**, **Cloudinary**, and **NextAuth.js**.

![WriteSpace Crimson Theme](https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- ✍️ **Rich Text Article Publishing**: Write stories with a clean Quill editor supporting instant Cloudinary image uploads and custom category tagging.
- 🎨 **Substack Editorial Typography**: Pairings of Google Fonts **Lora (Serif)** for titles/stories and **Inter (Sans-Serif)** for UI elements with a signature **Crimson** accent theme.
- 🛡️ **Role-Based Access Control (RBAC)**: Distinct permissions for `user` and `admin` accounts.
- 👑 **Admin Dashboard (`/admin`)**: Real-time stats overview (Users, Posts, Comments) and one-click post & comment moderation.
- 🔐 **Dual Authentication**: Manual Email & Password registration (with `bcryptjs` password hashing) plus **Google** and **GitHub** OAuth sign-in options.
- 👤 **Custom & Fallback Avatars**: Automatic Crimson Initials avatars (`UI-Avatars`) generated for users without profile photos.
- ⏱️ **Relative Timestamping**: Human-readable *"5 minutes ago"*, *"2 hours ago"*, *"3 days ago"* relative dates across cards, articles, and comments.
- 🌟 **Dynamic Featured Spotlight**: Automatically highlights the latest published story on the homepage hero section with a typewriter text animation.
- 📊 **Sidebar Highlights**: Top 4 **Most Popular** stories (sorted by view count) and **Editor's Picks**.
- 🌙 **Persistent Dark / Light Theme**: Theme switcher backed by `localStorage` persistence that stays active across refreshes.
- ⚡ **Scroll Reveal Animations**: Smooth 60fps `IntersectionObserver` scroll animations as you navigate through stories and categories.
- 📱 **100% Mobile Responsive**: Animated Hamburger-to-`X` menu toggle, scroll-locked mobile overlay, and responsive cover images.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 13 (App Router)](https://nextjs.org/)
- **Language & Logic**: JavaScript (ES6+), React 18
- **Styling**: Vanilla CSS Modules, CSS Custom Properties
- **Fonts**: Google Fonts (`Lora` & `Inter`) via `next/font/google`
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **ORM**: [Prisma ORM (v6.x)](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) + `bcryptjs`
- **Media Storage**: [Cloudinary](https://cloudinary.com/)
- **Rich Text Editor**: `react-quill-new`

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- A **MongoDB Atlas** database connection string
- A **Cloudinary** account for image uploads

---

### Installation & Local Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YourUsername/WriteSpace.git
   cd WriteSpace
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add the following keys:

   ```env
   # Database
   DATABASE_URL="mongodb+srv://username:password@cluster0.mongodb.net/blog?retryWrites=true&w=majority"

   # NextAuth Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_nextauth_secret_key_here"

   # Google OAuth Provider
   GOOGLE_ID="your_google_client_id"
   GOOGLE_SECRET="your_google_client_secret"

   # GitHub OAuth Provider
   GITHUB_ID="your_github_client_id"
   GITHUB_SECRET="your_github_client_secret"

   # Cloudinary Media Storage
   CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
   CLOUDINARY_API_KEY="your_cloudinary_api_key"
   CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
   ```

4. **Sync Prisma Database Schema**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to explore WriteSpace!

---

## 📁 Project Structure

```
WriteSpace/
├── prisma/
│   └── schema.prisma          # Database schema (User, Account, Post, Comment, Category)
├── public/                    # Static image assets
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   │   ├── about/             # About Page
│   │   ├── admin/             # Admin Dashboard (/admin)
│   │   ├── api/               # Serverless API routes (posts, comments, admin, auth, register, upload)
│   │   ├── blog/              # Category Filtered Posts Page
│   │   ├── login/             # Sign-In Page (Credentials + Social)
│   │   ├── posts/[slug]/      # Single Story Page
│   │   ├── register/          # Account Registration Page
│   │   ├── settings/          # User Account Settings & Account Deletion
│   │   ├── write/             # Article Creation & Editor Page
│   │   ├── globals.css        # Global CSS variables & typography rules
│   │   └── layout.js          # Root layout with providers & fonts
│   ├── components/            # Reusable UI components
│   │   ├── authLinks/         # Navbar links & animated mobile hamburger menu
│   │   ├── card/              # Article post card
│   │   ├── CardList/          # Main feed list with pagination
│   │   ├── CategoryList/      # Topic category badges
│   │   ├── comments/          # Article comments section
│   │   ├── deletePostButton/  # Author & Admin post deletion trigger
│   │   ├── Featured/          # Homepage hero spotlight with typewriter animation
│   │   ├── Footer/            # Footer navigation & branding
│   │   ├── Menu/              # Sidebar container (Popular, Categories, Editor Picks)
│   │   ├── MenuCategories/    # Sidebar topic badges
│   │   ├── MenuPosts/         # Sidebar popular & editor pick items
│   │   ├── navbar/            # Global navigation bar with active page indicator
│   │   ├── scrollReveal/      # Scroll reveal animation wrapper
│   │   └── themeToggle/       # Dark/Light mode toggle switch
│   ├── context/               # React Context (ThemeContext)
│   ├── providers/             # NextAuth AuthProvider & ThemeProvider
│   └── utils/                 # Utilities (auth, connect, timeAgo)
└── package.json
```

---

## 👑 Assigning Admin Permissions

By default, newly registered users receive the `"user"` role. To set your account as an **Admin**:

1. Log into your [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
2. Go to **Browse Collections** → **`blog`** → **`User`**.
3. Locate your user document by email.
4. Edit the `role` field from `"user"` to `"admin"`.
5. Save changes and re-login to access the `/admin` dashboard link in the navbar.

Alternatively, run this terminal command:
```powershell
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.update({ where: { email: 'YOUR_EMAIL@example.com' }, data: { role: 'admin' } }).then(u => { console.log('Admin updated:', u.email); process.exit(0); });"
```

---

## 🚀 Building for Production

To create an optimized production build:

```bash
npm run build
npm run start
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
