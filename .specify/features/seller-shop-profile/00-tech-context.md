# Tech Context for US-SELL-001 (seller-shop-profile)

Extracted from `docs/PRODUCT_BACKLOG_ROADMAP.md` YAML frontmatter (schema-version 1.3)

## Technology Stack

- **Language:** TypeScript
- **Backend:** NestJS + Mongoose ODM
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Zustand + TanStack Query + React Router v6 + Axios + Formik/Yup
- **Database:** MongoDB
- **Infrastructure:** Local dev (MongoDB local / Atlas) + Cloudinary + VNPay Sandbox
- **Testing:** Jest (unit) + Playwright (E2E)

## Git Mode

- Team mode with feature branches (`feat/*`)

## Project Structure Notes

- Monorepo with separate `frontend/` and `backend/` (NestJS) packages
- Uses `pnpm` as package manager
- API versioning: `/api/v1/...`
- DTO validation with `class-validator`
- Authentication: JWT (access 15m, refresh 7d) with bcrypt password hashing

## Design System Authority

- **Single Source of Truth:** `frontend/DESIGN.md`
- **Stitch MCP Project:** `projects/6249429078653284294` (Shopify Vietnam Marketplace Design System)
- **MCP Server:** `StitchMCP` / `stitch` (endpoint: `https://stitch.googleapis.com/mcp`)
- **Mandatory:** Query Stitch screens via `get_screen` before implementing any UI

## Key Conventions

- File < 300 lines, Function < 50 lines (per `07-tech-conventions.md`)
- No `any` types in TypeScript
- DTOs with full `class-validator` decorators
- Universal pill buttons: `rounded-full` only
- Two-canvas system: Cinematic dark (`#000000`) for marketing, Transactional light/cream (`#ffffff`/`#fbfbf5`) for commerce
- Typography: Neue Haas Grotesk Display (weights 330-500), Inter Variable (weights 420-550), global `ss03` OpenType feature
- 1px hairlines, Level 3 shadows for light cards
- Anti-AI-Slop: No generic purple/indigo gradients, no floating blurred orbs, no heavy glassmorphism