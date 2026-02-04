# CRM Social Backend

A Next.js backend API for social media management POC supporting Facebook, Instagram, and LinkedIn.

## Features

- 🔐 User authentication with NextAuth.js
- 📱 Multi-platform social media integration (Facebook, Instagram, LinkedIn)
- 📝 Create and publish posts to multiple platforms simultaneously
- 💬 Collect and aggregate comments from all platforms
- 📊 Dashboard with engagement statistics
- 🖼️ Image upload support via Cloudinary

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Facebook Developer App (for FB/IG integration)
- LinkedIn Developer App
- Cloudinary account (optional, for image uploads)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your credentials

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Run database migrations:

```bash
npx prisma migrate dev
```

6. Start development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Accounts

- `GET /api/accounts` - List connected accounts
- `POST /api/accounts/facebook` - Connect Facebook pages
- `POST /api/accounts/instagram` - Connect Instagram accounts
- `POST /api/accounts/linkedin` - Connect LinkedIn organizations
- `GET /api/accounts/[id]` - Get account details
- `DELETE /api/accounts/[id]` - Disconnect account
- `PATCH /api/accounts/[id]` - Update account status

### Posts

- `GET /api/posts` - List posts
- `POST /api/posts/create` - Create and publish post
- `GET /api/posts/[id]` - Get post details
- `DELETE /api/posts/[id]` - Delete post
- `POST /api/posts/[id]/retry` - Retry failed publishing
- `GET /api/posts/[id]/comments` - Get post comments
- `POST /api/posts/[id]/comments` - Refresh comments from platforms

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

### Utilities

- `POST /api/upload` - Upload image to Cloudinary
- `GET /api/health` - Health check

## Environment Variables

| Variable                 | Description                  |
| ------------------------ | ---------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string |
| `NEXTAUTH_URL`           | Application URL              |
| `NEXTAUTH_SECRET`        | NextAuth secret key          |
| `FACEBOOK_CLIENT_ID`     | Facebook App ID              |
| `FACEBOOK_CLIENT_SECRET` | Facebook App Secret          |
| `LINKEDIN_CLIENT_ID`     | LinkedIn Client ID           |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn Client Secret       |
| `ENCRYPTION_KEY`         | Key for encrypting tokens    |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary cloud name        |
| `CLOUDINARY_API_KEY`     | Cloudinary API key           |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret        |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Prisma Studio

## Deployment

Deploy to Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

## License

MIT
