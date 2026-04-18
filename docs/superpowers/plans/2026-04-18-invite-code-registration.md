# Invite Code Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require invite code `sywww` for registration and limit it to five accounts.

**Architecture:** Store the accepted invite code on `users.invite_code`, validate the register payload in `auth_service`, and pass the invite code through the existing React register form, store, and service. Keep the feature intentionally static for the private beta.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, pytest, React, Zustand, Vitest, Testing Library.

---

### Task 1: Backend Invite Code Enforcement

**Files:**
- Modify: `backend/tests/test_auth.py`
- Modify: `backend/app/schemas/auth.py`
- Modify: `backend/app/models/user.py`
- Modify: `backend/app/services/auth_service.py`
- Create: `backend/alembic/versions/20260418_0003_user_invite_code.py`

- [ ] **Step 1: Write failing backend tests**

Add tests for invalid invite code rejection, successful registration with `sywww`, and sixth registration rejection.

- [ ] **Step 2: Run backend invite tests and verify RED**

Run: `.\.venv\Scripts\python.exe -m pytest tests\test_auth.py -q`

Expected: failures caused by missing `inviteCode` support and absent limit enforcement.

- [ ] **Step 3: Implement minimal backend code**

Add `invite_code` to the user model, request schema, migration, and registration service.

- [ ] **Step 4: Run backend tests and verify GREEN**

Run: `.\.venv\Scripts\python.exe -m pytest tests\test_auth.py -q`

Expected: all auth tests pass.

### Task 2: Frontend Invite Code Form

**Files:**
- Create: `frontend/src/pages/RegisterPage.test.tsx`
- Modify: `frontend/src/pages/RegisterPage.tsx`
- Modify: `frontend/src/stores/authStore.ts`
- Modify: `frontend/src/services/authService.ts`

- [ ] **Step 1: Write failing frontend tests**

Mock the auth store registration function and verify the page sends the invite code and shows failed registration messages.

- [ ] **Step 2: Run frontend register tests and verify RED**

Run: `npm test -- RegisterPage.test.tsx`

Expected: failures caused by the missing invite code field.

- [ ] **Step 3: Implement minimal frontend code**

Add invite code state/input and pass it through register store and service.

- [ ] **Step 4: Run frontend register tests and verify GREEN**

Run: `npm test -- RegisterPage.test.tsx`

Expected: register page tests pass.

### Task 3: Full Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run backend test suite**

Run: `.\.venv\Scripts\python.exe -m pytest`

Expected: all backend tests pass.

- [ ] **Step 2: Run frontend test suite**

Run: `npm test`

Expected: all frontend tests pass.

- [ ] **Step 3: Run frontend production build**

Run: `npm run build`

Expected: TypeScript and Vite build succeed.
