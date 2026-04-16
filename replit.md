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
- **Build**: esbuild (CJS bundle)

## Features

- **Home**: Search scammers by phone/bank number, public stats (total scammers, money lost), recent warnings
- **Market (Chợ)**: Buy/sell digital game items (LMHT, Free Fire, Steam, etc.)
- **Report (Tố Cáo)**: Submit scam reports (bank scam or social media scam) with multi-tab form
- **Middlemen (DS GDV)**: View verified Giao Dịch Viên profiles with insurance funds and contacts
- **Account**: User profile, submitted reports history, market listings
- **Admin Dashboard**: Moderation queue, market management, user management, Promote-to-GDV flow

## User Roles

- **MEMBER**: Can search, submit reports, post market items
- **GDV**: Verified middleman with public profile
- **ADMIN**: Full system control — approve/reject reports, manage users, add GDVs

## Admin Credentials (Dev)

- Email: `admin@giaodichvien24h.vn`
- Password: `Admin@123`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/giaodichvien24h run dev` — run frontend locally

## Database Schema

- **users**: id, name, email, phone, password_hash, role (MEMBER/GDV/ADMIN), avatar
- **middleman_profiles**: user_id, real_name, services_offered[], insurance_fund, facebook/zalo/telegram links
- **scam_reports**: reporter_id, scammer info (phone/bank/social), amount_lost, evidence_images[], status (PENDING/APPROVED/REJECTED)
- **market_items**: seller_id, title, game_type, price, description, images[], status (AVAILABLE/SOLD)
- **activity_log**: type, description (for admin dashboard feed)

## Auth

Session-based auth using in-memory token store. Token returned on login/register, passed as `Authorization: Bearer <token>` header.
