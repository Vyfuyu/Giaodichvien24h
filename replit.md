# GiaoDichVien24h Workspace

## Overview

Full-stack Vietnamese anti-scam and digital marketplace platform. Mobile-first SPA web app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/giaodichvien24h) — previewPath: /
- **API framework**: Express 5 (artifacts/api-server) — previewPath: /api
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Object Storage**: Google Cloud Storage (Replit App Storage) for avatar uploads
- **Build**: esbuild (CJS bundle)

## Features

- **Home**: Search scammers by phone/bank number, public stats, recent warnings
- **Market (Chợ)**: Buy/sell digital game items — posts require admin approval (PENDING → AVAILABLE)
- **Report (Tố Cáo)**: Submit scam reports with evidence images
- **Middlemen (DS GDV)**: View verified Giao Dịch Viên profiles
- **Account**: User profile with avatar upload, name change, UID display, reports/listings history
- **Admin Dashboard**: Full moderation suite (reports, market, users, GDVs)

## User Roles

- **MEMBER**: Can search, submit reports, post market items
- **GDV**: Verified middleman with public profile
- **ADMIN**: Full system control

## User Status & Badges

- **Status**: NORMAL / SCAM / TRUSTED (set by admin)
- **Badge**: NONE / TRUSTED_GDV / TRUSTED_SELLER (set by admin)

## Admin Credentials (Dev)

- Email: `admin@giaodichvien24h.vn`
- Password: `Admin@123`

## Admin Capabilities

- Add GDV with full profile (real name, insurance fund, services, social links)
- Remove GDV (revoke role, delete middleman profile)
- Approve/reject market listings (PENDING → AVAILABLE/REJECTED)
- Delete market listings
- Delete user accounts
- Set user role (MEMBER / GDV / ADMIN)
- Mark users as SCAM or TRUSTED
- Set user badges (GDV Uy Tín / Người Bán Uy Tín)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/giaodichvien24h run dev` — run frontend locally

## Database Schema

- **users**: id, uid (#000001), name, email, phone, password_hash, role (MEMBER/GDV/ADMIN), status (NORMAL/SCAM/TRUSTED), badge (NONE/TRUSTED_GDV/TRUSTED_SELLER), avatar
- **middleman_profiles**: user_id, real_name, services_offered[], insurance_fund, facebook/zalo/telegram links
- **scam_reports**: reporter_id, scammer info (phone/bank/social), amount_lost, evidence_images[], status (PENDING/APPROVED/REJECTED)
- **market_items**: seller_id, title, game_type, price, description, images[], status (PENDING/AVAILABLE/SOLD/REJECTED)
- **activity_log**: type, description (for admin dashboard feed)

## Auth

Session-based auth using in-memory token store. Token returned on login/register, passed as `Authorization: Bearer <token>` header.

## Object Storage

Avatar images are uploaded via presigned URLs to GCS. Flow:
1. Client requests presigned URL from `POST /api/storage/uploads/request-url`
2. Client uploads file directly to GCS via PUT
3. Client saves path via `PATCH /auth/profile`
4. Files served at `/api/storage/objects/<path>`
