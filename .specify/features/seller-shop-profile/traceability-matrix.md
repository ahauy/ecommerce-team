# Traceability Matrix: Profile & Thiết lập gian hàng (US-SELL-001)

| Business Goal | REQ | BR/ASM | User Story | AC Scenarios | Test Case (Phase 5) |
|---|---|---|---|---|---|
| Seller onboarding — user can verify profile & shop status | REQ-SELL-001 | BR-SELL-008, ASM-SELL-001/003 | US-SELL-001 | 3 (active, no shop, banned) | TC-SELL-001 to TC-SELL-003 |
| Profile maintenance — keep checkout/shop info current | REQ-SELL-002 | BR-SELL-004, ASM-SELL-002 | US-SELL-002 | 3 (valid, invalid phone, empty name) | TC-SELL-004 to TC-SELL-006 |
| Shop setup — enable product listing | REQ-SELL-003 | BR-SELL-001-005, ASM-SELL-001/004 | US-SELL-003 | 7 (valid, validations x4, slug collision, update) | TC-SELL-007 to TC-SELL-013 |
| Shop discovery — buyers browse seller shops | REQ-SELL-004 | BR-SELL-006/007/010, ASM-SELL-003/005 | US-SELL-004 | 4 (active, banned, no shop, count accuracy) | TC-SELL-014 to TC-SELL-017 |
| Moderation integrity — banned sellers hidden | REQ-SELL-005 | BR-SELL-010 | US-SELL-005 | 3 (cascade, restore, preserve other blocks) | TC-SELL-018 to TC-SELL-020 |

**Total**: 5 REQ → 5 US → 20 AC Scenarios → 20 Test Cases (planned)