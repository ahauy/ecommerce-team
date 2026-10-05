# Intake: Profile & Thiết lập gian hàng (US-SELL-001)

- **Date**: 2026-10-05
- **Requested by**: Product Owner (via PRODUCT_BACKLOG_ROADMAP.md)
- **Classification**: Micro-Task / Fast-Track (overridden from roadmap Effort: S)
- **Classification signals**:
  - New/changed domain entities: 1 (User profile + Shop sub-document)
  - Existing DB schema change: Maybe (additive — shopName, pickupAddress fields)
  - Screens/flows touched: 2 (ProfilePage, ShopSetupPage)
  - User roles affected: 1 (Customer/User)
  - Cross-cutting impact: No
  - Estimated code lines changed: 30–200 lines
  - Reversible without user impact: Yes
- **Protocol selected**: Fast-Track (2–3 questions via elicitation-interview, skip gap-analysis, then domain-modeling (light), risk-contradiction-scanner (light), spec-writer (user-stories only), spec-validator, handover)
- **Override**: Classified as Micro-Task per roadmap Effort: S override (intake-classifier signals suggest Bounded Task, but roadmap takes precedence)

## One-line problem statement
Logged-in users need a profile page to manage personal info and a shop setup page to configure `shopName` and `pickupAddress` before they can list products, with a public shop view for buyers.