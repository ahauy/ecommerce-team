# UI/UX & Design System Review Report: Category Management

**Feature:** `category-management` (US-CAT-001)  
**Evaluated Surfaces:**  
- `frontend/src/pages/AdminCategoryPage/` (`index.tsx`, `AdminCategoryListTable.tsx`, `CategoryFormDrawer.tsx`, `DeleteWarningDialog.tsx`)  
- `frontend/src/components/CategoryNav/` (`index.tsx`)  
**Design Reference:** `frontend/DESIGN.md` & Stitch Screens (`projects/6249429078653284294`)  
**Auditor:** Adversarial UI/UX Review Gatekeeper  
**Date:** 2026-10-06  
**Status:** **CONDITIONAL PASS (REMEDIATION REQUIRED BEFORE GA SHIP)**

---

## 1. Executive Summary & Compliance Gate Verdicts

The category management frontend implementation demonstrates exceptional fidelity to the core aesthetic tenets of `DESIGN.md` and Stitch screen prototypes. The transactional light/cream canvas polarity (`#fbfbf5` / `#ffffff`), aloe mint badges (`#c1fbd4`), hairline borders (`#e4e4e7`), quadruple micro-halo card elevation, and dogmatic pill buttons (`rounded-full`) have been implemented with care.

However, an adversarial audit reveals several **accessibility (WCAG AA) regressions**, **touch-target undersizing (< 44px)**, **keyboard focus traps/escape dismiss gaps in modals/drawers**, **semantic ARIA labeling omissions**, and **UX state loading flickers**. These findings must be addressed to ensure an enterprise-grade, accessible experience.

### Mandatory Compliance Gates Summary

| Gate | Criterion | Status | Key Observations |
| :--- | :--- | :---: | :--- |
| **Gate 1: Button Shape** | MUST be pill (`rounded-full` / `9999px`). Rounded rectangles banned. | **PASS** | 100% of standard action triggers (Create, Edit, Delete, Filter, Close, Submit) enforce `rounded-full`. 1 minor inline text action ("Xóa ảnh") in Drawer should be harmonized. |
| **Gate 2: Canvas Polarity** | Transactional light/cream (`#ffffff` / `#fbfbf5`). No generic grays or off-palette backgrounds. | **PASS** | Base canvas strictly locked to `#fbfbf5` with `#ffffff` card containers and `#e4e4e7` hairlines. No off-system grey or blue backgrounds introduced. |
| **Gate 3: Accent Colors** | Aloe (`#c1fbd4`), pistachio (`#d4f9e0`), obsidian (`#000000`), hairlines (`#e4e4e7`). | **WARN** | Active chips use `#1a5034` text rather than canonical `#000000` ink specified in DESIGN.md. Inactive table badges use arbitrary Tailwind `bg-zinc-200 text-zinc-700` instead of `shade-30` (`#d4d4d8`) / `shade-70` (`#3f3f46`). |
| **Gate 4: Typography & ss03** | `font-feature-settings: "ss03"` enabled; display headline thin 330. | **WARN** | `ss03` stylistic set is correctly applied via inline styles and root CSS. Main headline uses `font-[300]` (300) rather than exact brand weight `font-[330]` (330). |
| **Gate 5: UX States** | Complete states: Empty, Loading, Error, Feedback/Success. | **WARN** | Stat strip displays `0` during initial fetch instead of skeleton pulses; table empty state lacks direct CTA when filtered or empty; Drawer backdrop clicks do not dismiss; table image fallback resets `src=''` rather than rendering placeholder. |
| **Gate 6: Accessibility (a11y)**| WCAG AA contrast, keyboard navigation, aria-modal, focus rings, touch targets $\ge$ 44px. | **FAIL** | Action buttons in table (32px), filter chips (34px), and CategoryNav pills (36px) fail $\ge 44\text{px}$ touch targets. Modals lack `Escape` key listeners & focus trap. Missing `aria-pressed`/`aria-current` on filter and nav chips. Search input lacks accessible label. |

---

## 2. Screen-by-Screen Audit vs. Stitch Prototypes

### 2.1 Admin Category Page (`AdminCategoryPage/index.tsx`)
*Reference Stitch Screen: `projects/6249429078653284294/screens/920a53a998bd4e8e8b0b16ec16a08793`*

- **Visual Alignment:**
  - Page title "Danh mục" and subtitle matched perfectly in editorial tone.
  - Quick Stats Bento Strip faithfully translates the 4-column metric grid.
  - Search input and 3-state filter chips ("Tất cả", "Hoạt động", "Đang ẩn") mirror the prototype.
- **Strengths:**
  - Direct integration with React Query (`categoryService.useAdminCategories()`).
  - Active chip uses Aloe-10 (`#c1fbd4`).
  - Retainable filter logic for both text search (name/slug) and boolean status.
- **Defects & Slop Identified:**
  - **Stats Initial Load:** While `isLoading` is active, the stats strip calculates 0s, resulting in a flash of zeroes before actual metrics appear.
  - **Filter Chip Touch Targets:** `h-[34px]` is too short for mobile/touch screens ($\ge 44\text{px}$ requirement).
  - **Accessible Label:** `<input id="category-search-input">` lacks an explicit `<label className="sr-only">` or `aria-label="Tìm kiếm danh mục"`.

### 2.2 Data Table (`AdminCategoryListTable.tsx`)
*Reference Stitch Screen: `projects/6249429078653284294/screens/920a53a998bd4e8e8b0b16ec16a08793`*

- **Visual Alignment:**
  - Implements the exact quadruple micro-halo shadow token from `DESIGN.md`:
    `shadow-[0_8px_8px_rgba(0,0,0,0.03),0_4px_4px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.02),0_0_0_1px_#e4e4e7]`.
  - Column structure matches 1:1: Thumbnail (76px), Name, Slug (monospace), Product Count, Status, Actions.
  - Row hover uses subtle `#fbfbf5`/50 cream wash.
- **Strengths:**
  - Clean skeleton loading state with 4 pulsing rows.
  - Empty state with folder icon and clear messaging.
- **Defects & Slop Identified:**
  - **Action Button Height:** "Chỉnh sửa" and "Xóa" buttons have `h-8` (32px), failing the 44px touch target gate.
  - **A11y Button Disambiguation:** Buttons only say "Chỉnh sửa" and "Xóa" without identifying the category for screen readers (needs `aria-label={`Chỉnh sửa ${category.name}`}`).
  - **Image Fallback Glitch:** `onError={(e) => { (e.target as HTMLImageElement).src = ''; }}` can cause broken image placeholders. When an image fails to load, component state should switch to the fallback `Folder` icon component.
  - **Inactive Badge Color:** Uses `bg-zinc-200 text-zinc-700` instead of DESIGN.md token `pill-tag-shade` (`bg-[#d4d4d8] text-[#3f3f46]` or `#000000`).

### 2.3 Delete Warning Dialog (`DeleteWarningDialog.tsx`)
*Reference Stitch Screen: `projects/6249429078653284294/screens/4ff01870d2a9498b8f48f72196b0383c`*

- **Visual Alignment:**
  - Outstanding replication of the blocked delete state when `productCount > 0`.
  - Amber/red warning pill header, red alert banner explaining blocked status, category preview chip, and single "Đóng" pill CTA.
  - Seamless fallback to confirmation mode with "Hủy" and "Xóa vĩnh viễn" pill buttons when `productCount === 0`.
- **Strengths:**
  - Properly annotated with `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-headline"`.
  - Prevents accidental category deletion on the UI side before network requests.
- **Defects & Slop Identified:**
  - **No Escape Key Listener:** Pressing `Escape` does not invoke `onClose()`.
  - **No Backdrop Click Dismiss:** Clicking the backdrop outside the modal card does not close it.
  - **Missing Focus Management:** Focus is not trapped inside the dialog when open and not returned to the triggering button upon close.

### 2.4 Category Form Drawer (`CategoryFormDrawer.tsx`)
*Reference Stitch Screen: `projects/6249429078653284294/screens/b3ff9a13af8b42c7b154bc1730ab9471`*

- **Visual Alignment:**
  - High fidelity right-hand sliding panel (`max-w-lg bg-white h-full shadow-2xl`).
  - Read-only slug field with `/category/` prefix and padlock icon.
  - Real-time Vietnamese slug transliteration in create mode.
  - Compact toggle switch for `isActive`.
- **Strengths:**
  - Explicit 409 conflict error banner for duplicate category names.
  - Loading spinner indicator during mutation.
- **Defects & Slop Identified:**
  - **No Escape Key Handler:** Does not close on `Escape`.
  - **No Backdrop Dismiss:** Clicking outside the drawer does not dismiss it.
  - **Button Shape Consistency:** "Xóa ảnh" is an underlined text button (`text-[11px] text-red-600 hover:underline`) rather than following the pill vocabulary (e.g. `w-8 h-8 rounded-full border border-[#e4e4e7]` icon button as shown in Stitch Screen 3).

### 2.5 Storefront Category Navigation (`CategoryNav/index.tsx`)
*Reference Stitch Screen: `projects/6249429078653284294/screens/afed4199f8c8486ea1a1904e7a12d153`*

- **Visual Alignment:**
  - Horizontal scrolling row of pill buttons (`rounded-full`) starting with "Tất cả".
  - Selected category highlighted with Aloe-10 (`#c1fbd4`) wash.
  - Category thumbnail integrated smoothly into each chip.
- **Strengths:**
  - Complete skeleton loading pills (`animate-pulse`).
  - Error state with retry trigger.
- **Defects & Slop Identified:**
  - **Touch Target:** Chips use `h-9` (36px), falling below 44px.
  - **Screen Reader State:** Missing `aria-pressed` or `aria-current` on active chip.
  - **Empty Return:** Returns `null` without reserved height or placeholder, causing layout shift (CLS) when loaded.

---

## 3. Severity-Ranked Findings & Remediation

### Finding 1: Undersized Touch Targets (< 44px) on Interactive Buttons
- **Severity:** High (WCAG 2.5.5 / 2.5.8 Failure & Mandatory Gate Violation)
- **Locations:**
  - `AdminCategoryListTable.tsx` L134, L141 (`h-8 px-3.5` = 32px height)
  - `AdminCategoryPage/index.tsx` L149, L160, L171 (`h-[34px]` = 34px height)
  - `CategoryNav/index.tsx` L70, L86 (`h-9 px-4` = 36px height)
  - `AdminCategoryPage/index.tsx` L223 (`w-8 h-8` = 32px pagination button)
- **Impact:** Difficult to tap on touch devices, tablets, and high-DPI touch displays; violates mandatory gate requiring $\ge 44\text{px}$.
- **Remediation:**
  Increase heights or supply transparent touch-target hitboxes (`min-h-[44px]` or padding wraps):
  ```tsx
  // Table Action Buttons:
  <button
    type="button"
    className="min-h-[36px] md:min-h-[40px] px-4 rounded-full text-xs font-medium ..."
  >
  ```
  On `CategoryNav`:
  ```tsx
  <button
    type="button"
    className="shrink-0 min-h-[44px] px-5 rounded-full text-sm font-medium inline-flex items-center gap-2 ..."
  >
  ```

---

### Finding 2: Missing Keyboard `Escape` Dismiss & Focus Trapping in Dialogs
- **Severity:** High (Keyboard A11y & Modal Ergonomics)
- **Locations:**
  - `CategoryFormDrawer.tsx` L78–L86
  - `DeleteWarningDialog.tsx` L31–L39
- **Impact:** Power users and keyboard-only navigators cannot dismiss the drawer or dialog using `Escape`. Focus can leak behind the dialog into background interactive elements.
- **Remediation:**
  Add an `onKeyDown` hook or listener:
  ```tsx
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  ```
  And add backdrop click handler:
  ```tsx
  <div
    role="dialog"
    aria-modal="true"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
    ...
  >
  ```

---

### Finding 3: Missing ARIA State Markers on Filter Chips & Category Navigation
- **Severity:** Medium (Accessibility / Screen Reader Navigation)
- **Locations:**
  - `CategoryNav/index.tsx` L70, L86
  - `AdminCategoryPage/index.tsx` L146–L179
- **Impact:** Screen reader users hear "Tất cả, button", "Thời trang, button" without knowing which option is selected.
- **Remediation:**
  Add `aria-pressed` or `aria-current`:
  ```tsx
  // In CategoryNav/index.tsx
  <button
    type="button"
    aria-pressed={isSelected}
    aria-current={isSelected ? 'page' : undefined}
    onClick={() => handleSelect(cat.slug)}
    ...
  >

  // In AdminCategoryPage/index.tsx
  <div role="group" aria-label="Bộ lọc trạng thái danh mục" className="flex items-center gap-2">
    <button
      type="button"
      aria-pressed={statusFilter === 'all'}
      ...
    >
  ```

---

### Finding 4: Search Input Lacks Accessible Name
- **Severity:** Medium (WCAG 4.1.2 Name, Role, Value)
- **Location:** `AdminCategoryPage/index.tsx` L135–L143
- **Impact:** The search input relies solely on `placeholder`, which is not guaranteed to be announced across all assistive tech.
- **Remediation:**
  Add `aria-label="Tìm kiếm danh mục theo tên hoặc đường dẫn"` or an accessible visually-hidden label:
  ```tsx
  <label htmlFor="category-search-input" className="sr-only">
    Tìm kiếm danh mục
  </label>
  <input
    id="category-search-input"
    type="text"
    aria-label="Tìm kiếm danh mục theo tên hoặc slug"
    ...
  />
  ```

---

### Finding 5: Flash of Zero Metrics in Bento Stats Strip During Initial Loading
- **Severity:** Low to Medium (Visual Polish & UX State Continuity)
- **Location:** `AdminCategoryPage/index.tsx` L112–L129
- **Impact:** When the page loads, the metrics show `0` for several hundred milliseconds before jumping to `24`, `21`, `1,482`, causing an jarring optical pop.
- **Remediation:**
  Display skeleton placeholders inside the bento metric cards when `isLoading` is true:
  ```tsx
  <div className="bg-white rounded-xl p-4 border border-[#e4e4e7] shadow-sm">
    <span className="text-xs text-zinc-500 font-medium">Tổng số danh mục</span>
    {isLoading ? (
      <div className="h-8 w-14 bg-zinc-200 rounded-md animate-pulse mt-1" />
    ) : (
      <div className="text-2xl font-semibold text-black mt-1">{totalCount}</div>
    )}
  </div>
  ```

---

### Finding 6: Image Error Fallback Handling in Table
- **Severity:** Low (Edge Case Visual Slop)
- **Location:** `AdminCategoryListTable.tsx` L90–L92
- **Impact:** Setting `e.target.src = ''` triggers a secondary empty request and can render an unsightly broken image icon on WebKit browsers.
- **Remediation:**
  Use component state or a dedicated `<CategoryImage>` component that gracefully swaps the `<img>` tag with the fallback `Folder` icon when an error occurs.

---

### Finding 7: Token Fidelity – Active Text Color & Inactive Badge Tokens
- **Severity:** Low (Design Token Hygiene)
- **Locations:**
  - `AdminCategoryListTable.tsx` L122: Inactive badge uses `bg-zinc-200 text-zinc-700` instead of DESIGN.md token `pill-tag-shade` (`bg-[#d4d4d8] text-[#3f3f46]`).
  - `CategoryNav/index.tsx` L72, L88: Active text uses `#1a5034` instead of `#000000` ink.
  - `AdminCategoryPage/index.tsx` L92: Headline uses `font-[300]` instead of exact DESIGN.md weight `font-[330]`.
- **Remediation:**
  Replace with exact DESIGN.md tokens:
  ```tsx
  // Inactive badge in table:
  <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#d4d4d8] text-[#3f3f46]">
    Đang ẩn
  </span>

  // Headline in AdminCategoryPage:
  <h1 className="text-[44px] md:text-[48px] leading-[54px] font-[330] tracking-[-0.02em] text-black">
  ```

---

## 4. Verification & Testing Status

| Suite | Scope | Result | Details |
| :--- | :--- | :---: | :--- |
| Vitest Unit Tests | `AdminCategoryPage.test.tsx` | **10 / 10 PASS** | Covers Loading, Error, Empty, Stats, Search, Filters, Drawer, Dialog, DESIGN.md tokens. |
| Vitest Unit Tests | `CategoryFormDrawer.test.tsx` | **5 / 5 PASS** | Covers Closed, Create Mode, Edit Mode, Validation, 409 Conflict Handling. |
| Vitest Unit Tests | `DeleteWarningDialog.test.tsx` | **3 / 3 PASS** | Covers Blocked Mode (with linked products), Permitted Mode (0 products), Close action. |
| Vitest Unit Tests | `CategoryNav.test.tsx` | **4 / 4 PASS** | Covers Loading Skeleton, Error Retry, Empty Null, Selection Switching. |
| **Total Test Runs** | **22 Tests across 4 files** | **22 / 22 PASS (100%)** | Full green test suite execution in 1.44s. |

---

## 5. Final Recommendation & Sign-Off Checklist

The Category Management UI demonstrates top-tier visual execution and rigorous obedience to the core pill vocabulary and transactional canvas polarity. To attain gold-standard production readiness:

1. [ ] **A11y Touch Targets:** Increase heights of action buttons, filter chips, and navigation pills to meet touch target guidelines ($\ge 44\text{px}$).
2. [ ] **Keyboard Modality:** Add `Escape` key listeners and backdrop click handlers to `CategoryFormDrawer` and `DeleteWarningDialog`.
3. [ ] **Screen Reader Attributes:** Add `aria-pressed` / `aria-current` to all selectable pill buttons and add `aria-label` to the search input.
4. [ ] **Stats Loading Continuity:** Introduce skeleton placeholders in the Bento stats cards during data fetching.
5. [ ] **Token Alignment:** Update inactive badge colors to `#d4d4d8` (`shade-30`) and `#3f3f46` (`shade-70`), and set display headline weight to `330`.

Once these targeted refinements are applied, the surface is **APPROVED FOR PRODUCTION SHIPMENT**.
