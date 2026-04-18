# Frontend Style Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Context Reader frontend so core pages closely match `frontDesign` while preserving existing content, routes, state, and API behavior.

**Architecture:** Keep the current React/Vite/Tailwind structure. Apply shared visual rules through `src/index.css`, update the app shell in `AppLayout` and `TopNav`, then restyle page and reader components with focused class changes. Preserve existing test IDs and business logic.

**Tech Stack:** React 19, React Router, Vite, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Baseline Tests

**Files:**
- Read: `frontend/package.json`
- Run in: `frontend`

- [ ] **Step 1: Run current frontend tests**

Run:

```powershell
npm test
```

Expected: Existing tests pass before styling work begins. If they fail, record the failure and only continue if the failure is unrelated to style work.

- [ ] **Step 2: Run current frontend build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite build pass before styling work begins.

### Task 2: Shared Shell and Global Style

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/layout/AppLayout.tsx`
- Modify: `frontend/src/components/layout/TopNav.tsx`

- [ ] **Step 1: Update global CSS**

Set the global background to white or near-white, keep existing reader token behavior, and tune reader-specific colors to the quieter reference style. Keep all existing `.reader-*` class names.

- [ ] **Step 2: Update AppLayout**

Use a standard container around `max-w-[1200px] px-6 py-12` for non-reader pages and `max-w-[1400px] px-6 py-6` for reader pages. Keep rendering `TopNav` and `children`.

- [ ] **Step 3: Update TopNav**

Make the nav sticky with a white background and subtle border. Keep links and labels unchanged. Preserve logout behavior and nickname display.

- [ ] **Step 4: Verify layout tests still compile**

Run:

```powershell
npm test -- --run src/components/reader/ReaderLayout.test.tsx
```

Expected: Reader layout tests pass or fail only because of intentional accessible/class structure changes.

### Task 3: Core List and Form Pages

**Files:**
- Modify: `frontend/src/components/article/ArticleCard.tsx`
- Modify: `frontend/src/components/article/ArticleList.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/pages/ArticleListPage.tsx`
- Modify: `frontend/src/pages/FavoritesPage.tsx`
- Modify: `frontend/src/pages/ImportPage.tsx`

- [ ] **Step 1: Restyle ArticleCard and ArticleList**

Keep article metadata, title, created date, and reader link unchanged. Change the card to a compact bordered white card with subtle hover treatment.

- [ ] **Step 2: Restyle Dashboard**

Keep the existing hero copy, import entry, system sample article list, error message, and recent reading prompt. Restructure spacing and cards to match the reference dashboard rhythm.

- [ ] **Step 3: Restyle Articles**

Keep filters, sorting behavior, and error display unchanged. Convert controls to compact reference-style buttons/select and align with the shared card system.

- [ ] **Step 4: Restyle Favorites**

Keep filters, favorite list, and empty message unchanged. Use the same page header, filter row, and card system as Articles.

- [ ] **Step 5: Restyle Import**

Keep title field, textarea, word count, validation messages, loading messages, and submit/clear behavior unchanged. Update inputs and buttons to the shared reference style.

- [ ] **Step 6: Run targeted tests**

Run:

```powershell
npm test -- --run src/pages/ImportPage.test.tsx
```

Expected: Import page tests pass.

### Task 4: Reader and Review Pages

**Files:**
- Modify: `frontend/src/pages/ReaderPage.tsx`
- Modify: `frontend/src/components/reader/ReaderLayout.tsx`
- Modify: `frontend/src/components/reader/ParagraphBlock.tsx`
- Modify: `frontend/src/components/reader/SentenceBlock.tsx`
- Modify: `frontend/src/components/reader/ExplanationPanel.tsx`
- Modify: `frontend/src/components/reader/BreakdownPanel.tsx`
- Modify: `frontend/src/pages/ReviewPage.tsx`

- [ ] **Step 1: Restyle ReaderPage header**

Keep article metadata, status notices, review link, loading, and error states unchanged. Move the header toward the reference reader style.

- [ ] **Step 2: Restyle ReaderLayout**

Keep `data-testid="reader-layout"`, `data-testid="paragraph-nav"`, `data-testid="reading-canvas"`, and `data-testid="explanation-rail"`. Use the three-region reader layout with left paragraph navigation, center article, and right sticky explanation panel.

- [ ] **Step 3: Restyle reader interaction components**

Keep click/select behavior unchanged in paragraph, sentence, token, breakdown, and explanation components. Tune visual treatment only.

- [ ] **Step 4: Restyle ReviewPage**

Keep summary, key phrases, familiar words, long sentences, and return link unchanged. Update spacing and card styling to match the reference.

- [ ] **Step 5: Run reader tests**

Run:

```powershell
npm test -- --run src/components/reader
```

Expected: Reader tests pass.

### Task 5: Login and Register Basic Unification

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/pages/RegisterPage.tsx`

- [ ] **Step 1: Restyle auth pages**

Keep all fields, links, validation text, and submit behavior unchanged. Update page background, form panel, labels, inputs, and buttons to match the shared style.

- [ ] **Step 2: Run auth-sensitive tests if present**

Run:

```powershell
npm test -- --run src/pages
```

Expected: Page tests pass.

### Task 6: Final Verification

**Files:**
- Verify: `frontend/src/**/*`

- [ ] **Step 1: Run full frontend tests**

Run:

```powershell
npm test
```

Expected: All frontend tests pass.

- [ ] **Step 2: Run frontend build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Start dev server**

Run:

```powershell
npm run dev -- --host 127.0.0.1
```

Expected: Vite starts and prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 4: Manual smoke check**

Open the local URL and inspect:

- `/dashboard`
- `/articles`
- `/import`
- `/favorites`
- `/reader/1`
- `/review/1`
- `/login`
- `/register`

Expected: Pages render, layout resembles `frontDesign`, content remains unchanged, and no obvious overflow occurs.
