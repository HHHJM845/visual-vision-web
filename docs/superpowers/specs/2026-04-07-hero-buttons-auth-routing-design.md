# Hero Section Buttons Auth-Aware Routing

**Date:** 2026-04-07
**Status:** Approved

## Overview

The two hero section buttons ("我是需求方" / "我是创作者") currently have no click handlers. This spec defines auth-aware routing logic for both buttons.

## Button Routing Logic

| Scenario | 我是需求方 | 我是创作者 |
|----------|-----------|-----------|
| Not logged in | Navigate to `/register?role=client` | Navigate to `/register?role=aigcer` |
| Logged in, role matches | Navigate to `/commissions/new` | Navigate to `/commissions` |
| Logged in, role mismatch | Toast: "您已是创作者账号，无法切换角色" | Toast: "您已是需求方账号，无法切换角色" |

## Files to Modify

### 1. `src/components/HeroSection.tsx`
- Import `useNavigate` from `react-router-dom`
- Import `useAuth` from `@/contexts/AuthContext`
- Import `toast` from `sonner`
- Add `handleClient()` and `handleAigcer()` click handlers implementing the table above
- Attach handlers to the respective buttons

### 2. `src/pages/Register.tsx`
- Import `useSearchParams` from `react-router-dom`
- Read `?role=client|aigcer` query param on mount
- Use it as the initial value of the `role` state (fallback to `'aigcer'` if absent or invalid)

## Out of Scope
- No role switching / account type changing
- No changes to login flow
- No new routes needed
