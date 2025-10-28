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

5.  **Learning Materials Management:**
    *   Teachers can upload learning materials (with attachments and tags).
    *   Materials are searchable and filterable by tags.

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