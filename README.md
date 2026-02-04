# CRM Social - Multi-Platform Social Media Management

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

A powerful social media management platform that enables simultaneous posting to Facebook, Instagram, and LinkedIn from a single dashboard.

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [API Reference](#api-reference)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Platform Integration](#platform-integration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

CRM Social is a proof-of-concept social media management platform designed to streamline content publishing across multiple social media platforms. With a single post creation, your content is simultaneously published to Facebook Pages, Instagram Business accounts, and LinkedIn Company Pages.

### Success Criteria

- ✅ Successfully authenticate and connect to 2-3 social media platforms
- ✅ Post identical content (text + image) to all connected platforms simultaneously
- ✅ Retrieve and display comments/interactions from posted content
- ✅ Present a functional, professional-looking dashboard UI
- ✅ Demonstrate end-to-end workflow in live demo

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Multi-Platform Publishing** | Post to Facebook, Instagram, and LinkedIn simultaneously |
| **OAuth Integration** | Secure authentication with social media platforms |
| **Comment Collection** | Centralized view of comments from all platforms |
| **Dashboard Analytics** | Track posts, comments, and connected accounts |
| **Image Upload** | Support for JPG/PNG images up to 5MB |
| **Real-time Status** | Live publishing status updates |

### User Authentication
- Email/password login
- JWT session management
- Secure token storage

### Social Media Account Management
- Connect Facebook Pages via OAuth 2.0
- Link Instagram Business accounts
- Connect LinkedIn Company Pages
- View connection status and last activity

### Content Publishing
- Rich text editor (up to 2,000 characters)
- Single image attachment support
- Platform selection checkboxes
- Real-time publishing feedback
- Direct links to published posts

### Interaction Management
- Fetch comments from all platforms
- Centralized comment display
- Manual refresh capability
- Commenter details and timestamps

---

## 🛠 Tech Stack

### Frontend (`CRM_Social_Frontend/`)

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI Components |
| **React Context** | State Management |

### Backend (`crm-social-backend/`)

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | API Routes & Server |
| **TypeScript** | Type Safety |
| **Prisma** | ORM |
| **PostgreSQL** | Database |
| **JWT (jose)** | Authentication |
| **bcryptjs** | Password Hashing |

### External Services

| Service | Purpose |
|---------|---------|
| **Meta Graph API** | Facebook & Instagram |
| **LinkedIn API v2** | LinkedIn |
| **Cloudinary** | Image Storage |

---

## 📁 Project Structure

```
CRM_Social/
├── CRM_Social_Frontend/          # React Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # Login/Authentication
│   │   │   ├── dashboard/        # Dashboard Components
│   │   │   ├── layout/           # Layout Components
│   │   │   ├── shared/           # Shared Components
│   │   │   └── ui/               # shadcn/ui Components
│   │   ├── context/              # React Context (AppContext)
│   │   ├── lib/                  # Utilities & API Client
│   │   ├── types/                # TypeScript Types
│   │   └── hooks/                # Custom Hooks
│   ├── .env                      # Environment Variables
│   └── package.json
│
├── crm-social-backend/           # Next.js Backend Application
│   ├── app/
│   │   └── api/
│   │       ├── auth/             # Authentication Endpoints
│   │       ├── accounts/         # Social Account Management
│   │       ├── posts/            # Post Management
│   │       ├── dashboard/        # Dashboard Stats
│   │       └── upload/           # Image Upload
│   ├── lib/
│   │   ├── platforms/            # Platform API Integrations
│   │   ├── services/             # Business Logic
│   │   └── utils/                # Utilities
│   ├── prisma/
│   │   ├── schema.prisma         # Database Schema
│   │   └── migrations/           # Database Migrations
│   ├── .env.local                # Environment Variables
│   └── package.json
│
└── Documentation.md              # Detailed Requirements Document
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- Facebook Developer Account
- LinkedIn Developer Account
- Cloudinary Account (for image uploads)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/CRM_Social.git
cd CRM_Social
```

### 2. Setup Backend

```bash
# Navigate to backend
cd crm-social-backend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your credentials (see Configuration section)

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Setup Frontend

```bash
# Navigate to frontend (in new terminal)
cd CRM_Social_Frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env
echo "VITE_FACEBOOK_APP_ID=your_facebook_app_id" >> .env

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the Application

1. Open `http://localhost:5173` in your browser
2. Register a new account or use demo credentials
3. Connect your social media accounts
4. Start publishing!

---

## ⚙️ Configuration

### Backend Environment Variables (`.env.local`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm_social"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-characters"

# Facebook/Instagram (Meta)
FACEBOOK_CLIENT_ID="your_facebook_app_id"
FACEBOOK_CLIENT_SECRET="your_facebook_app_secret"

# LinkedIn
LINKEDIN_CLIENT_ID="your_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret"

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"
```

### Frontend Environment Variables (`.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Get current user |

### Social Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/accounts` | List connected accounts |
| `POST` | `/api/accounts/facebook` | Connect Facebook Page |
| `POST` | `/api/accounts/instagram` | Connect Instagram |
| `POST` | `/api/accounts/linkedin` | Connect LinkedIn |
| `DELETE` | `/api/accounts/:id` | Disconnect account |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | List all posts |
| `POST` | `/api/posts/create` | Create & publish post |
| `GET` | `/api/posts/:id` | Get post details |
| `GET` | `/api/posts/:id/comments` | Get post comments |
| `POST` | `/api/posts/:id/comments` | Refresh comments |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Get dashboard metrics |

### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload image |

---

## 🗄 Database Schema

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  name      String?
  accounts  Account[]
  posts     Post[]
  createdAt DateTime  @default(now())
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  platform          String   // 'facebook', 'instagram', 'linkedin'
  platformAccountId String
  accountName       String
  accountType       String?
  accessToken       String   @db.Text
  refreshToken      String?  @db.Text
  tokenExpiresAt    DateTime?
  avatarUrl         String?
  isActive          Boolean  @default(true)
  lastSyncedAt      DateTime?
  createdAt         DateTime @default(now())
  user              User     @relation(...)
}

model Post {
  id          String       @id @default(cuid())
  userId      String
  content     String       @db.Text
  imageUrl    String?
  platforms   String[]
  createdAt   DateTime     @default(now())
  user        User         @relation(...)
  postResults PostResult[]
}

model PostResult {
  id              String    @id @default(cuid())
  postId          String
  platform        String
  status          String    // 'success', 'failed', 'pending'
  platformPostId  String?
  platformPostUrl String?
  errorMessage    String?
  commentsCount   Int       @default(0)
  createdAt       DateTime  @default(now())
  post            Post      @relation(...)
  comments        Comment[]
}

model Comment {
  id              String     @id @default(cuid())
  postResultId    String
  platform        String
  platformCommentId String
  commenterName   String
  commenterAvatar String?
  text            String     @db.Text
  commentedAt     DateTime
  createdAt       DateTime   @default(now())
  postResult      PostResult @relation(...)
}
```

---

## 🔗 Platform Integration

### Facebook & Instagram (Meta Graph API)

1. Create app at [developers.facebook.com](https://developers.facebook.com)
2. Add products: "Facebook Login", "Instagram Graph API"
3. Configure OAuth redirect URIs
4. Required permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`

### LinkedIn API

1. Create app at [developer.linkedin.com](https://developer.linkedin.com)
2. Request "Share on LinkedIn" product
3. Configure OAuth 2.0 settings
4. Required scopes:
   - `w_member_social`
   - `r_organization_social`

### Instagram Business Account Setup

To connect Instagram, you must:
1. Convert Instagram to a Business or Creator account
2. Create a Facebook Page
3. Link Instagram to the Facebook Page
4. Connect via the app using Facebook OAuth

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] User can register
- [ ] User can login
- [ ] Session persists after refresh
- [ ] User can logout

**Account Connection:**
- [ ] Facebook OAuth completes
- [ ] Instagram accounts detected
- [ ] LinkedIn OAuth completes
- [ ] Accounts persist after reload

**Publishing:**
- [ ] Text-only post works
- [ ] Image upload works
- [ ] Multi-platform publishing works
- [ ] Success/error status displays
- [ ] Links to posts work

**Comments:**
- [ ] Comments fetch correctly
- [ ] Refresh updates comments
- [ ] Timestamps format correctly

---

## 🚢 Deployment

### Backend (Vercel)

```bash
cd crm-social-backend
vercel
```

### Frontend (Vercel)

```bash
cd CRM_Social_Frontend
vercel
```

### Database (Recommended)

- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [PlanetScale](https://planetscale.com) - MySQL compatible

---

## ⚠️ Known Limitations

| Limitation | Description |
|------------|-------------|
| No Scheduling | Immediate posting only |
| No Video | Image support only (JPG/PNG) |
| Read-only Comments | Cannot reply or moderate |
| Single User | No team collaboration |
| 50 Comments Max | Per post limit |
| Manual Refresh | No real-time updates |

---

## 🗺 Roadmap

### Phase 2 (Planned)
- [ ] Content scheduling & calendar
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Comment moderation & replies
- [ ] Video upload support

### Phase 3 (Future)
- [ ] TikTok integration
- [ ] Twitter/X integration
- [ ] AI content suggestions
- [ ] Mobile application
- [ ] Content templates

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

<div align="center">

**Built with ❤️ by the Development Team**

</div>
