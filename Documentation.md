Social Media Management Platform - POC/MVP System Requirements Document
1. Executive Summary
1.1 POC/MVP Overview
A Proof of Concept demonstrating the core functionality of a multi-platform social media management system. The POC validates the technical feasibility of simultaneous posting to multiple platforms, basic interaction collection, and centralized dashboard management within a 1-week development timeline.
1.2 POC Success Criteria
✅ Successfully authenticate and connect to 2-3 social media platforms
✅ Post identical content (text + image) to all connected platforms simultaneously
✅ Retrieve and display comments/interactions from posted content
✅ Present a functional, professional-looking dashboard UI
✅ Demonstrate end-to-end workflow in live demo
1.3 POC Scope Limitations
IN SCOPE:
Facebook Pages, Instagram Business, LinkedIn Company Pages
Immediate publishing only (no scheduling)
Basic comment retrieval (read-only)
Simple analytics dashboard
Single user/admin access
OUT OF SCOPE (for full product):
Content scheduling/calendar
Advanced analytics and reporting
Team collaboration features
Multi-user role management
Comment moderation/reply functionality
TikTok, Twitter/X, other platforms
Video uploads
Content templates
Mobile applications
1.4 Target Platforms (POC)
Facebook Pages (Priority 1 - Must Have)
Instagram Business (Priority 1 - Must Have)
LinkedIn Company Pages (Priority 2 - Should Have)

2. Functional Requirements - POC/MVP
2.1 User Authentication
2.1.1 Basic Authentication
POC-101: System shall provide a simple login mechanism (email/password or demo account)
POC-102: System shall maintain user session for duration of demo
POC-103: Single admin user account sufficient for POC
POC-104: No password reset or user registration needed for POC
Acceptance Criteria:
User can log in with credentials
Session persists across page refreshes
User can log out
Technical Implementation:
- NextAuth.js with credentials provider
- JWT session strategy
- Session stored in HTTP-only cookies

2.2 Social Media Account Connection
2.2.1 OAuth Integration
POC-201: System shall connect to Facebook via OAuth 2.0
POC-202: System shall retrieve user's Facebook Pages upon authorization
POC-203: System shall connect to Instagram Business accounts linked to Facebook Pages
POC-204: System shall connect to LinkedIn via OAuth 2.0
POC-205: System shall retrieve LinkedIn Company Pages user can manage
POC-206: System shall store access tokens securely in database
Acceptance Criteria:
User clicks "Connect Facebook" → OAuth flow completes → Pages displayed
User clicks "Connect Instagram" → Business accounts linked to FB Pages displayed
User clicks "Connect LinkedIn" → Company Pages displayed
Connected accounts persist after page reload
User can see list of all connected accounts in dashboard
Technical Implementation:
Facebook/Instagram:
- Meta Business API (Graph API v19.0+)
- Scopes: pages_show_list, pages_read_engagement, 
  pages_manage_posts, instagram_basic, 
  instagram_content_publish
- Store: page_access_token, instagram_account_id

LinkedIn:
- LinkedIn API v2
- Scopes: w_member_social, r_organization_social
- Store: access_token, organization_id

2.2.2 Account Display
POC-207: System shall display connected accounts in a list/card view
POC-208: Each account card shall show:
Platform icon/logo
Account name
Platform type (e.g., "Facebook Page")
Connection status (Connected/Error)
Last activity timestamp
Acceptance Criteria:
Connected accounts visible on dashboard
Account names and avatars display correctly
Connection status clearly indicated
UI Mockup:
┌────────────────────────────────────┐
│ Connected Accounts                  │
├────────────────────────────────────┤
│ [FB] My Business Page               │
│      Facebook Page • Connected      │
│                                     │
│ [IG] @mybusiness                    │
│      Instagram Business • Connected │
│                                     │
│ [LI] My Company                     │
│      LinkedIn Page • Connected      │
└────────────────────────────────────┘

2.3 Content Publishing
2.3.1 Content Creation Form
POC-301: System shall provide a single form with the following fields:
Text area: Post content (max 2,000 characters)
Image upload: Single image (JPG/PNG, max 5MB)
Platform selectors: Checkboxes for FB, IG, LinkedIn
Post button: Trigger publishing to selected platforms
Acceptance Criteria:
Form accepts text input up to 2,000 characters
Form accepts image upload (JPG/PNG)
Image preview displayed after upload
Character counter shows remaining characters
Platform checkboxes toggle on/off
Form validation prevents empty posts
Submit button disabled until valid input provided
UI Mockup:
┌─────────────────────────────────────────┐
│ Create New Post                          │
├─────────────────────────────────────────┤
│ What would you like to share?            │
│ ┌─────────────────────────────────────┐ │
│ │ [Text area for post content]         │ │
│ │                                      │ │
│ │                                      │ │
│ └─────────────────────────────────────┘ │
│ 0/2000 characters                        │
│                                          │
│ [Upload Image] or drag and drop          │
│ [Image preview if uploaded]              │
│                                          │
│ Post to:                                 │
│ ☑ Facebook   ☑ Instagram   ☑ LinkedIn   │
│                                          │
│            [Post to Selected Platforms]  │
└─────────────────────────────────────────┘

2.3.2 Multi-Platform Publishing
POC-302: Clicking "Post" shall publish content to all selected platforms simultaneously
POC-303: System shall display real-time publishing status for each platform:
⏳ Publishing...
✅ Posted successfully
❌ Failed (with error message)
POC-304: System shall provide direct links to published posts on each platform
POC-305: Publishing process shall complete within 10 seconds under normal conditions
Acceptance Criteria:
Content posts to all selected platforms within 10 seconds
Success message displayed for each platform
Links to live posts provided
Errors handled gracefully with meaningful messages
Post appears on actual social media platforms (verified manually)
Technical Implementation:
POST /api/post/create
{
  "content": "Post text",
  "imageUrl": "https://...",
  "platforms": ["facebook", "instagram", "linkedin"]
}

Response:
{
  "results": [
    {
      "platform": "facebook",
      "status": "success",
      "postId": "123456_789012",
      "postUrl": "https://facebook.com/..."
    },
    {
      "platform": "instagram",
      "status": "success",
      "postId": "ABC123",
      "postUrl": "https://instagram.com/p/..."
    },
    {
      "platform": "linkedin",
      "status": "success",
      "shareId": "urn:li:share:456",
      "postUrl": "https://linkedin.com/feed/update/..."
    }
  ]
}

2.3.3 Publishing Status Feedback
POC-306: System shall show loading spinner while posting
POC-307: System shall display toast notifications for success/failure
POC-308: Failed posts shall show specific error messages:
"Facebook: Invalid access token - please reconnect"
"Instagram: Image format not supported"
"LinkedIn: Rate limit exceeded"
Acceptance Criteria:
Loading state visible during API calls
Success toast appears for successful posts
Error toast appears with actionable message for failures
User can dismiss notifications
2.4 Interaction Collection
2.4.1 Comment Retrieval
POC-401: System shall fetch comments from published Facebook posts
POC-402: System shall fetch comments from published Instagram posts
POC-403: (Optional) System shall fetch comments from published LinkedIn posts
POC-404: Comment collection shall be triggered manually via "Refresh Comments" button
POC-405: System shall display up to 50 most recent comments per post
Acceptance Criteria:
Click "Refresh Comments" → Comments fetched from platforms
Comments display within 5 seconds
At least Facebook and Instagram comments working
Comments show commenter name, text, timestamp
Technical Implementation:
Facebook:
GET /{post-id}/comments?fields=id,from{name},message,created_time

Instagram:
GET /{media-id}/comments?fields=id,username,text,timestamp

LinkedIn:
GET /socialActions/{share-urn}/comments

2.4.2 Comment Display
POC-406: System shall display comments in a table/list format showing:
Platform icon
Commenter name
Comment text (truncated if >100 chars)
Timestamp (relative, e.g., "2 hours ago")
Link to original comment
Acceptance Criteria:
Comments displayed in readable format
Most recent comments shown first
Timestamps formatted correctly
Platform clearly identified
UI Mockup:
┌──────────────────────────────────────────────────────┐
│ Recent Comments                    [Refresh Comments] │
├──────────────────────────────────────────────────────┤
│ Platform │ User       │ Comment          │ Time       │
├──────────┼────────────┼──────────────────┼───────────┤
│ [FB]     │ John Doe   │ Great post!      │ 2 hrs ago │
│ [IG]     │ @janedoe   │ Love this! 😍    │ 3 hrs ago │
│ [FB]     │ Mike Smith │ When is the...   │ 5 hrs ago │
│ [LI]     │ Sarah Lee  │ Interesting...   │ 1 day ago │
└──────────────────────────────────────────────────────┘

2.5 Dashboard & Analytics
2.5.1 Dashboard Overview
POC-501: Dashboard shall display:
Total connected accounts count
Total posts published (lifetime)
Total comments/interactions collected
List of recent posts (last 10)
Acceptance Criteria:
Metrics update after each action
Recent posts list shows latest first
Dashboard loads within 2 seconds
UI Mockup:
┌────────────────────────────────────────────┐
│ Dashboard                                   │
├────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────────┐│
│ │Connected │ │  Posts   │ │  Comments    ││
│ │Accounts  │ │Published │ │  Collected   ││
│ │    3     │ │    12    │ │     47       ││
│ └──────────┘ └──────────┘ └──────────────┘│
│                                             │
│ Recent Posts                                │
│ ┌─────────────────────────────────────────┐│
│ │ "Check out our new..." • 2 hours ago    ││
│ │ Posted to: FB, IG, LI                   ││
│ │ 5 comments • View details               ││
│ ├─────────────────────────────────────────┤│
│ │ "Exciting announcement..." • 1 day ago  ││
│ │ Posted to: FB, IG                       ││
│ │ 12 comments • View details              ││
│ └─────────────────────────────────────────┘│
└────────────────────────────────────────────┘

2.5.2 Basic Analytics
POC-502: System shall display per-post metrics:
Number of comments
Post timestamp
Platforms posted to
Success/failure status per platform
Acceptance Criteria:
Metrics visible on dashboard
Data accurate (matches actual platform data)
No advanced analytics needed (reach, impressions out of scope)
2.6 Error Handling
2.6.1 API Error Handling
POC-601: System shall gracefully handle platform API errors:
Invalid/expired tokens → Prompt user to reconnect
Rate limits → Display "Please try again in X minutes"
Network errors → Display "Connection failed, retrying..."
Invalid content → Display specific validation error
Acceptance Criteria:
No unhandled errors crash the application
Error messages are user-friendly, not technical stack traces
User can recover from errors without refreshing page
2.6.2 Validation
POC-602: System shall validate before posting:
At least one platform selected
Content not empty
Image size under 5MB
Image format is JPG or PNG
Acceptance Criteria:
Form shows validation errors inline
Submit button disabled until validation passes
Clear error messages guide user to fix issues

3. Non-Functional Requirements - POC/MVP
3.1 Performance
POC-NF-101: Dashboard shall load within 3 seconds on standard broadband
POC-NF-102: Publishing to 3 platforms shall complete within 10 seconds
POC-NF-103: Comment refresh shall complete within 5 seconds for up to 50 comments
POC-NF-104: UI shall remain responsive during API calls (no freezing)
3.2 Security
POC-NF-201: Access tokens shall be encrypted at rest in database
POC-NF-202: Tokens shall never be exposed in client-side code or URLs
POC-NF-203: All API calls shall use HTTPS
POC-NF-204: User session shall expire after 24 hours of inactivity
3.3 Usability
POC-NF-301: UI shall be intuitive enough for demo without extensive training
POC-NF-302: All interactive elements shall have clear labels
POC-NF-303: Loading states shall be visually indicated
POC-NF-304: Mobile-responsive design (works on tablet/desktop)
3.4 Reliability
POC-NF-401: Application shall be available during scheduled demo time
POC-NF-402: Failed API calls shall not crash the application
POC-NF-403: Database connection failures shall be handled gracefully
3.5 Compatibility
POC-NF-501: Shall work on latest versions of Chrome, Firefox, Safari, Edge
POC-NF-502: Shall work on screen resolutions 1280x720 and above

4. Technical Architecture - POC/MVP
4.1 Technology Stack
Frontend:
Next.js 14 (App Router)
React 18
TypeScript
Tailwind CSS
shadcn/ui components
Backend:
Next.js API Routes
Node.js runtime
Database:
PostgreSQL (via Supabase or Neon)
Prisma ORM
Authentication:
NextAuth.js
OAuth 2.0 for social platforms
Deployment:
Vercel (frontend + backend)
Supabase/Neon (database)
External APIs:
Meta Graph API (Facebook/Instagram)
LinkedIn API v2
4.2 Database Schema (Simplified for POC)
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
  id            String   @id @default(cuid())
  userId        String
  platform      String   // 'facebook', 'instagram', 'linkedin'
  platformId    String   // Page ID, Account ID, Org ID
  accountName   String
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, platform, platformId])
}

model Post {
  id          String    @id @default(cuid())
  userId      String
  content     String    @db.Text
  imageUrl    String?
  platforms   String[]  // ['facebook', 'instagram', 'linkedin']
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  postResults PostResult[]
}

model PostResult {
  id          String   @id @default(cuid())
  postId      String
  platform    String
  status      String   // 'success', 'failed'
  platformPostId String?
  platformPostUrl String?
  errorMessage String?
  createdAt   DateTime @default(now())
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  comments    Comment[]
}

model Comment {
  id            String     @id @default(cuid())
  postResultId  String
  platform      String
  commenterId   String
  commenterName String
  text          String     @db.Text
  timestamp     DateTime
  createdAt     DateTime   @default(now())
  postResult    PostResult @relation(fields: [postResultId], references: [id], onDelete: Cascade)
}

4.3 API Endpoints (POC)
Authentication:
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

Social Accounts:
GET    /api/accounts              # List connected accounts
POST   /api/accounts/facebook     # Connect Facebook
POST   /api/accounts/instagram    # Connect Instagram  
POST   /api/accounts/linkedin     # Connect LinkedIn
DELETE /api/accounts/:id          # Disconnect account

Publishing:
POST   /api/posts/create          # Create and publish post
GET    /api/posts                 # List user's posts
GET    /api/posts/:id             # Get single post details

Comments:
GET    /api/posts/:id/comments    # Fetch comments for a post
POST   /api/posts/:id/comments/refresh  # Manually refresh comments

Dashboard:
GET    /api/dashboard/stats       # Get dashboard metrics

4.4 External API Integration Details
Facebook/Instagram (Meta Graph API)
Authentication Flow:
1. User clicks "Connect Facebook"
2. Redirect to Facebook OAuth: 
   https://www.facebook.com/v19.0/dialog/oauth
3. User authorizes app
4. Receive code, exchange for access_token
5. GET /me/accounts → Fetch user's Facebook Pages
6. For each Page, check if Instagram Business account linked
7. Store page_access_token and instagram_account_id

Posting to Facebook:
POST https://graph.facebook.com/v19.0/{page-id}/photos
{
  "url": "https://...",
  "caption": "Post text",
  "access_token": "page_access_token"
}

Posting to Instagram:
Step 1: Create container
POST https://graph.facebook.com/v19.0/{instagram-account-id}/media
{
  "image_url": "https://...",
  "caption": "Post text",
  "access_token": "page_access_token"
}

Step 2: Publish container
POST https://graph.facebook.com/v19.0/{instagram-account-id}/media_publish
{
  "creation_id": "{container-id}",
  "access_token": "page_access_token"
}

Fetching Comments:
Facebook:
GET https://graph.facebook.com/v19.0/{post-id}/comments
  ?fields=id,from{name},message,created_time

Instagram:
GET https://graph.facebook.com/v19.0/{media-id}/comments
  ?fields=id,username,text,timestamp

LinkedIn API
Authentication Flow:
1. User clicks "Connect LinkedIn"
2. Redirect to LinkedIn OAuth:
   https://www.linkedin.com/oauth/v2/authorization
3. User authorizes app
4. Receive code, exchange for access_token
5. GET /v2/organizationalEntityAcls → Fetch company pages
6. Store access_token and organization URN

Posting to LinkedIn:
POST https://api.linkedin.com/v2/ugcPosts
{
  "author": "urn:li:organization:{org-id}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Post text"
      },
      "shareMediaCategory": "IMAGE",
      "media": [
        {
          "status": "READY",
          "media": "urn:li:digitalmediaAsset:{asset-id}"
        }
      ]
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}

Note: Images must be uploaded to LinkedIn's asset API first


5. POC Deliverables
5.1 Code Deliverables
✅ Complete Next.js application source code
✅ Database schema and migrations
✅ README with setup instructions
✅ Environment variable template (.env.example)
5.2 Deployment
✅ Live demo URL (deployed on Vercel)
✅ Demo credentials provided
✅ Pre-configured with test social media accounts
5.3 Documentation
✅ Setup guide for local development
✅ API endpoint documentation
✅ Known limitations document
✅ Next steps/roadmap for full product
5.4 Demo Preparation
✅ Pre-populated with 2-3 sample posts
✅ Connected to real Facebook, Instagram, LinkedIn test accounts
✅ Sample comments visible in dashboard
✅ Demo script for presentation (10-15 minutes)

6. POC Testing Checklist
6.1 Functional Testing
Authentication:
[ ] User can log in successfully
[ ] Session persists after page refresh
[ ] User can log out
Account Connection:
[ ] Facebook OAuth flow completes
[ ] Facebook Pages display correctly
[ ] Instagram accounts display correctly
[ ] LinkedIn OAuth flow completes
[ ] LinkedIn Company Pages display correctly
[ ] Connected accounts persist after reconnecting
Publishing:
[ ] Can create post with text only
[ ] Can create post with text + image
[ ] Post publishes to Facebook successfully
[ ] Post publishes to Instagram successfully
[ ] Post publishes to LinkedIn successfully
[ ] Post publishes to multiple platforms simultaneously
[ ] Success messages display correctly
[ ] Links to published posts work
[ ] Posts visible on actual social media platforms
Comment Collection:
[ ] Can fetch comments from Facebook post
[ ] Can fetch comments from Instagram post
[ ] Comments display with correct data
[ ] Timestamps formatted correctly
[ ] Refresh button updates comment list
Dashboard:
[ ] Metrics display correctly
[ ] Recent posts list populated
[ ] Post details show correct information
Error Handling:
[ ] Form validation prevents empty posts
[ ] Image size validation works
[ ] Graceful handling of API errors
[ ] User-friendly error messages displayed
6.2 Browser Testing
[ ] Works in Chrome (latest)
[ ] Works in Firefox (latest)
[ ] Works in Safari (latest)
[ ] Works in Edge (latest)
[ ] Responsive on tablet (768px width)
[ ] Responsive on desktop (1920px width)
6.3 Performance Testing
[ ] Dashboard loads < 3 seconds
[ ] Publishing completes < 10 seconds
[ ] Comments refresh < 5 seconds
[ ] No UI freezing during operations

7. Demo Script (15 minutes)
Minute 0-2: Introduction
"Today I'll demonstrate our social media management POC. This system allows you to post content once and have it appear simultaneously across Facebook, Instagram, and LinkedIn. Let me show you how it works."
Minute 2-4: Show Connected Accounts
Navigate to dashboard
Point out connected accounts section
"We have 3 accounts connected: a Facebook Page, Instagram Business account, and LinkedIn Company Page. The system securely stores authentication tokens and maintains these connections."
Minute 4-9: Create and Publish Post (THE WOW MOMENT)
Click "Create Post"
Type sample text: "Excited to announce our new product launch! 🚀 #innovation #business"
Upload sample image
Check all three platform boxes
"Watch what happens when I click 'Post to Selected Platforms'..."
Click Post button
Show loading indicators
Show success messages with platform links
Open three new browser tabs:
Tab 1: Facebook Page → show post live
Tab 2: Instagram profile → show post live
Tab 3: LinkedIn Company Page → show post live
"As you can see, the same content appeared on all three platforms simultaneously, posted just 5 seconds ago."
Minute 9-12: Show Comment Collection
Navigate back to dashboard
Click on recent post
Click "Refresh Comments"
Show comments table
"The system automatically collects comments from all platforms. Here you can see comments from Facebook and Instagram users, all in one centralized view."
Minute 12-14: Dashboard Overview
Show metrics: connected accounts, posts published, comments collected
Show recent posts list
"The dashboard gives you a quick overview of your social media activity across all platforms."
Minute 14-15: Q&A and Next Steps
"This POC demonstrates the core functionality works. The full product would include:"
Content scheduling and calendar
Advanced analytics and reporting
Team collaboration features
Additional platforms (TikTok, Twitter)
Comment moderation and reply capabilities
"We're ready to proceed to Phase 1 development. Any questions?"

8. Known Limitations (POC)
8.1 Feature Limitations
⚠️ No content scheduling (immediate posting only)
⚠️ No video upload support
⚠️ Comments are read-only (cannot reply or moderate)
⚠️ No analytics/insights from platforms
⚠️ Single user only (no team collaboration)
⚠️ No content calendar view
⚠️ Limited to 50 comments per post
⚠️ Manual comment refresh (no real-time updates)
8.2 Platform Limitations
⚠️ Facebook/Instagram requires Business accounts
⚠️ LinkedIn requires Company Page admin access
⚠️ Some features may require platform API approval
⚠️ Rate limits may affect high-volume posting
8.3 Technical Limitations
⚠️ Image only (JPG/PNG, max 5MB)
⚠️ Text limited to 2,000 characters
⚠️ No multi-image carousel support
⚠️ No hashtag suggestions
⚠️ Basic error handling

9. Success Metrics for POC
9.1 Demo Success Criteria
✅ Live posting works for all 3 platforms during demo
✅ No critical bugs or crashes
✅ UI is professional and intuitive
✅ Client understands the value proposition
✅ Client agrees to proceed with full development
9.2 Technical Success Criteria
✅ OAuth flows complete successfully
✅ API integrations functional
✅ Database stores data correctly
✅ Deployment stable on Vercel
✅ Code is maintainable for Phase 1 development

10. Post-POC Next Steps
10.1 If POC Approved
Week 1-2: Finalize Phase 1 requirements and pricing
Week 2-8: Develop Phase 1 (FB/IG/LinkedIn + scheduling + analytics)
Week 9: Testing and refinement
Week 10: Deployment and training
10.2 POC to Phase 1 Transition
Add to existing POC codebase:
Content scheduling system (queue + cron jobs)
Calendar view UI
Advanced analytics dashboard
Team user management
Comment moderation features
Platform-specific optimizations
Estimated Phase 1 Timeline: 6-8 weeks Estimated Phase 1 Cost: $10,500 - $13,500

11. Risk Assessment
11.1 Technical Risks
Risk
Probability
Impact
Mitigation
OAuth approval delays
Medium
High
Start applications immediately, use development mode for demo
API rate limits hit during demo
Low
High
Test extensively beforehand, use fresh accounts
Platform API changes
Low
Medium
Use stable API versions, monitor changelogs
Image upload failures
Low
Medium
Validate formats/sizes, test multiple images
Network issues during demo
Low
High
Have backup video recording, test on stable connection

11.2 Schedule Risks
Risk
Probability
Impact
Mitigation
Development takes >7 days
Medium
Medium
Focus on FB+IG first (LinkedIn optional), simplify UI if needed
Platform API learning curve
Medium
Medium
Review documentation Day 1, ask Claude for implementation guidance
Bug fixes delay completion
Medium
Low
Allocate Day 7 entirely for testing and fixes


12. Appendix
12.1 Platform API Requirements
Facebook/Instagram (Meta):
Developer account: https://developers.facebook.com
Create app with "Business" type
Add products: "Facebook Login", "Instagram Graph API"
Required permissions: pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish
Business verification: Can use development mode for POC
Rate limits: 200 calls/hour per user (sufficient for POC)
LinkedIn:
Developer account: https://developer.linkedin.com
Create app with "Organization" access
Required products: "Share on LinkedIn", "Sign In with LinkedIn"
Required scopes: w_member_social, r_organization_social
Verification: Email verification sufficient for development
Rate limits: Varies, generally 100 requests/day for free tier
12.2 Environment Variables Template
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret"

# Facebook/Instagram
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."

# LinkedIn
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."

# File Upload (Optional - Cloudinary/S3)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

12.3 Recommended VS Code Extensions
Prisma
ESLint
Prettier
Tailwind CSS IntelliSense
GitLens
12.4 Useful Resources
Meta Graph API Explorer: https://developers.facebook.com/tools/explorer
LinkedIn API Console: https://www.linkedin.com/developers/apps
Prisma Studio: npx prisma studio (database GUI)
shadcn/ui docs: https://ui.shadcn.com

Document Version: 1.0
 Last Updated: February 4, 2026
 Author: Development Team
 Status: Ready for POC Development

