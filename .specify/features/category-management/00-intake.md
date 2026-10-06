# Intake: Quản lý Category (Admin CRUD) (US-CAT-001)

- **Date**: 2026-10-06
- **Requested by**: Product Owner (via PRODUCT_BACKLOG_ROADMAP.md)
- **Classification**: Bounded Task (matching roadmap Effort: M)
- **Classification signals**:
  - New/changed domain entities: 1 (Category: name, slug, description, imageUrl, isActive)
  - Existing DB schema change: Add Category collection / schema in MongoDB
  - Screens/flows touched: 2 (Admin Category Management: list/form, Public: CategoryNav/Sidebar)
  - User roles affected: 2 (Admin: CRUD, Public/User: View & Filter)
  - Cross-cutting impact: No (precursor to Product Management US-PRD-001)
  - Estimated code lines changed: 150–400 lines
  - Reversible without user impact: Yes
- **Protocol selected**: Bounded Task (Stages 1 → 2 (interactive interview 2–3 questions) → 4 (light) → 5 (light) → 6 (user stories) → 7 → 8)
- **Override**: None (matches roadmap Effort: M)

## One-line problem statement

Admin needs full CRUD capability over system-wide product categories with slug generation and deletion protection when referenced by products, while public users can browse active categories for navigation and filtering.
