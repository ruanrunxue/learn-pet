# 学宠 LearnPet - 教学宠物养成应用

## Overview

学宠 (LearnPet) is a cross-platform educational assistant application available on H5 and WeChat Mini Programs. It enables students to earn points by completing teacher-assigned tasks, which are then used to nurture virtual pets. The project aims to enhance student engagement and motivation through gamification in an educational setting.

## User Preferences

I prefer concise and direct communication. When suggesting code changes, provide clear explanations for the rationale behind them. For new features or significant modifications, please outline the approach and ask for confirmation before proceeding. Ensure all interactions and changes align with the established technical stack and architectural patterns.

## System Architecture

The application is built with a modern web stack, featuring a cross-platform frontend and a Node.js backend.

**Technology Stack:**
- **Frontend:** Taro 4.1.7 + React (for H5 and WeChat Mini Programs)
- **Backend:** Node.js v22.20.0 + Express
- **Database:** PostgreSQL (Neon) + Drizzle ORM

**Core Features & Design:**

1.  **User Authentication & Authorization:**
    *   Supports teacher and student roles with distinct access levels.
    *   Secure registration and login using phone number and password (hashed with bcrypt).
    *   JWT for session management.

2.  **Class Management System:**
    *   Teachers can create and manage classes, including adding/removing students.
    *   Students can browse available classes and join them.
    *   Database schema ensures unique class memberships and proper data relationships.

3.  **Pet Management System:**
    *   Students can adopt a unique virtual pet for each class.
    *   Pets have levels and experience points; experience increases through activities like "feeding" (using earned points).
    *   AI-generated personalized pet images (cartoony style) upon adoption.

4.  **Task Management System:**
    *   Teachers can publish tasks with descriptions, points, and deadlines to specific classes.
    *   Students can submit tasks, automatically earning points upon submission.
    *   Comprehensive permission validation ensures teachers manage their own classes' tasks and students interact with their assigned tasks.

5.  **Learning Materials Management (Enhanced Table Interface):**
    *   Teachers can upload learning materials with attachments and tags.
    *   **Full-featured table interface with:**
      - Search by ID and material name
      - Filter by tags
      - Sort by ID, name, or file type
      - Pagination (10/20/50/100 rows per page)
      - Batch selection and deletion
      - Click row to view details
    *   **Enhanced upload page:**
      - Drag-and-drop file upload (H5)
      - Tag input with Enter key confirmation
      - Colored rounded tag badges
      - File type auto-detection and display
    *   **File management:**
      - Auto-extraction of file extensions (.pdf, .mp4, .docx, etc.)
      - Support for documents, videos, audio, images, and compressed files
      - 50MB file size limit
      - Public access to all learning materials

6.  **Points System:**
    *   Students earn points by completing tasks.
    *   Points are tracked per student per class, stored in a dedicated `user_points` table.
    *   Points are consumed when "feeding" pets.

7.  **Class Rankings:**
    *   Displays a leaderboard for student points within each class.
    *   Special visual treatment for top-ranked students.

8.  **UI/UX:**
    *   Custom TabBar component for navigation, dynamically adjusting based on user role (Teacher: Home, Materials, Tasks, Settings; Student: Home, Materials, Tasks, Pets, Settings).
    *   Responsive design for H5 and WeChat Mini Programs.

**System Design Choices:**

*   **Modular Architecture:** Clear separation of frontend, backend, and shared code.
*   **Database Schema:** Normalized design with clear relationships (`users`, `classes`, `class_members`, `learning_materials`, `pets`, `tasks`, `task_submissions`, `user_points`).
*   **API-driven:** RESTful API for all frontend-backend communication.
*   **Replit Integration:** Leverages Replit's native Object Storage and AI Integrations for key functionalities.

## External Dependencies

The project integrates with the following external services and APIs:

1.  **PostgreSQL (Neon):** Primary relational database for all application data.
2.  **Replit Object Storage (@replit/object-storage):** Used for storing all user-uploaded files, including learning materials, task attachments, and AI-generated pet images.
3.  **Replit AI Integrations (OpenAI):**
    *   **gpt-image-1:** For generating personalized pet images during the pet adoption process.
    *   **gpt-5:** (Planned for pet conversation features).

## Recent Changes

### 2025-11-12 - iOS Safari Video Playback Fix
**Issue:** Video files could not be played on iOS mobile browsers (Safari/Chrome), play button was unresponsive.
**Root Cause:** Missing `playsinline` attribute required by iOS Safari for inline video playback.
**Fix:** Added iOS-compatible Video component attributes:
- ✅ `playsinline` - Critical for iOS inline playback (prevents forced fullscreen)
- ✅ `preload="metadata"` - Preloads video metadata for better compatibility
- ✅ `objectFit="contain"` - Proper video scaling on mobile devices
- ✅ `enableProgressGesture` - Enables swipe gestures for progress control
- ✅ `showFullscreenBtn` - Allows fullscreen mode when needed

**Technical Details:**
- iOS Safari blocks videos without `playsinline` attribute
- Taro Video component updated in `src/pages/material-detail/index.tsx`
- Now fully compatible with iOS Safari, Chrome, and all mobile browsers

### 2025-11-12 - Deployment Configuration Fix
**Issue:** Deployment failed with Express route syntax errors and crash loops.
**Root Cause:** 
1. Express wildcard route `app.get("*", ...)` incompatible with newer path-to-regexp
2. Port configuration didn't match deployment requirements
**Fix:**
- Replaced wildcard route with middleware approach `app.use((req, res, next) => {...})`
- Auto-detect port: development (3001) vs production (5000)
- Production server serves both API and static H5 frontend
**Deployment Config:**
```
deploymentTarget = "autoscale"
build = ["npm", "run", "build:h5"]
run = ["npm", "start"]
```

### 2025-10-29 - Materials Management Complete Redesign v3.0.0
**Major Upgrade:** Transformed materials management into a full-featured table interface with comprehensive data management capabilities

**Frontend Enhancements:**

1. **Materials List Page (src/pages/materials/index.tsx)**
   - ✅ Full table layout replacing card-based interface
   - ✅ Columns: ID, Material Name, File Type (extension), Tags
   - ✅ Search functionality (by ID and name)
   - ✅ Tag filtering with dropdown
   - ✅ Column sorting (ID, Name, Type)
   - ✅ Pagination controls (10/20/50/100 rows per page)
   - ✅ Batch selection with checkboxes
   - ✅ Batch delete with confirmation dialog
   - ✅ Click row to navigate to detail page

2. **Upload Page (src/pages/material-upload/index.tsx)**
   - ✅ Drag-and-drop file upload (H5 environment)
   - ✅ Click to browse file upload
   - ✅ Tag input with Enter key to confirm
   - ✅ Colorful rounded tag badges (gradient purple)
   - ✅ Visual file type display with extension
   - ✅ Auto-fill material name from filename
   - ✅ File size limit (50MB)
   - ✅ Support for multiple file formats (documents, videos, audio, images, archives)

3. **Detail Page (src/pages/material-detail/index.tsx)**
   - ✅ Download functionality
   - ✅ Delete functionality (owner only)
   - Simple and clean interface

**Backend Updates:**

1. **Database Schema (shared/schema.ts)**
   - ✅ Added `fileExtension` field to `learning_materials` table
   - Stores file extension (e.g., .pdf, .mp4, .docx) for better categorization

2. **Materials API (server/routes/materials.ts)**
   - ✅ Batch delete endpoint: `DELETE /api/materials/batch/delete`
   - ✅ Route ordering fix: batch delete route now declared before `/:id` to prevent shadowing
   - ✅ Auto-extraction of file extension during upload
   - ✅ All endpoints return `fileExtension` field
   - ✅ Proper tags parsing (JSON string → array) in all responses

**Technical Improvements:**
- Fixed critical route shadowing bug (batch delete must be before /:id)
- Enhanced error handling and validation
- Improved data consistency between frontend and backend
- Better file type management with dedicated extension field

**Migration:**
- Run `npm run db:push` to apply schema changes (adds fileExtension column)

### 2025-10-27 - Object Storage Refactor v2.5.0
**Major Changes:** Migrated from @google-cloud/storage to @replit/object-storage

**Improvements:**
- ✅ Zero-config @replit/object-storage SDK integration
- ✅ Server-side multipart upload via multer (improved security)
- ✅ **ACL policies persisted in PostgreSQL** (object_acl_policies table)
- ✅ Public resources accessible without authentication
- ✅ Private resources use existing authMiddleware for compatibility
- ✅ Deleted deprecated server/objectAcl.ts and @google-cloud/storage package

**Technical Details:**
- New: POST /api/storage/upload (multipart/form-data)
- Removed: POST /api/storage/upload-url, POST /api/storage/confirm-upload
- ACL storage: PostgreSQL with upsert pattern (ON CONFLICT DO UPDATE)
- Conditional auth middleware: public files bypass auth, private files require JWT
- Database migration: `npm run db:push` applies schema changes

**Key Fixes:**
- Server restart no longer causes 403 errors (ACL now in database)
- Public pet images and materials accessible to all users
- Maintains backward compatibility with existing auth flows

### 2025-10-28 - Frontend Upload Fix
**Issue:** Material upload page failed with "请求失败" error
**Root Cause:** Frontend still used deprecated APIs (`/storage/upload-url`, `/storage/confirm-upload`)
**Fix:** Updated `src/pages/material-upload/index.tsx` to use new multipart upload API (`/api/storage/upload`)
**Changes:**
- H5 file upload now uses FormData with multipart/form-data
- Better error logging with console.error for debugging
- Improved error messages for users

### 2025-10-28 - Materials Tags Fix
**Issue:** Materials page crashed with "material.tags.map is not a function" error
**Root Cause:** Database stores tags as text (JSON string), but backend returned them as strings instead of arrays
**Fix:** Updated `server/routes/materials.ts` to parse tags JSON string to array before returning
**Changes:**
- All materials API endpoints now parse tags from JSON string to array
- Upload endpoint stores tags as JSON.stringify()
- Frontend now receives tags as proper array type
