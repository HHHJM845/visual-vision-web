# Targeted Notifications and Dashboard Todos Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add directed project notifications and role-specific dashboard todo cards for client and creator workflows.

**Architecture:** Keep notifications in `engagementService` with optional recipient metadata for backward compatibility. Add a pure `projectTodoService` that derives todos from commissions, applications, contracts, escrow bundles, project progress, and deliveries. Wire these derived todos into client and AIGCer dashboards without changing the existing project detail page layout beyond notification trigger payloads.

**Tech Stack:** React, TypeScript, TanStack Query, Vitest, localStorage demo services, Supabase schema placeholders.

---

### Task 1: Add Directed Notification Tests

**Files:**
- Modify: `src/test/services/engagementService.test.ts`
- Modify later: `src/services/engagementService.ts`

**Step 1: Write failing tests**

Add tests for:
- `createProjectNotification` accepts `recipientId`, `recipientRole`, `actionLabel`, `priority`.
- `listNotificationsForUser(user)` returns notices with matching `recipientId` and legacy notices without recipient.
- `markNotificationRead` still works for directed notifications.

**Step 2: Run failing test**

Run: `npm test -- src/test/services/engagementService.test.ts`

Expected: fail because `listNotificationsForUser` does not exist and notification fields are not typed.

**Step 3: Implement minimal service changes**

Update `NotificationItem`, `ProjectNotificationParams`, `createProjectNotification`, and export `listNotificationsForUser`.

**Step 4: Run passing test**

Run: `npm test -- src/test/services/engagementService.test.ts`

Expected: all engagement tests pass.

### Task 2: Add Project Todo Service Tests

**Files:**
- Create: `src/services/projectTodoService.ts`
- Create: `src/test/services/projectTodoService.test.ts`

**Step 1: Write failing tests**

Create tests for:
- Client todo: accepted project without contract creates “生成合同草稿”.
- Client todo: draft escrow creates “确认托管”.
- Client todo: `waiting_owner` progress creates “确认交付”.
- AIGCer todo: unsigned contract creates “确认签署合同”.
- AIGCer todo: `waiting_aigcer` progress creates “提交当前节点”.
- AIGCer todo: latest delivery with `changes_requested` creates “修改交付”.

**Step 2: Run failing test**

Run: `npm test -- src/test/services/projectTodoService.test.ts`

Expected: fail because service does not exist.

**Step 3: Implement minimal service**

Export:
- `ProjectTodo`
- `buildClientTodos(input)`
- `buildAigcerTodos(input)`

Todos should include `id`, `title`, `description`, `commissionTitle`, `targetPath`, `actionLabel`, `priority`.

**Step 4: Run passing test**

Run: `npm test -- src/test/services/projectTodoService.test.ts`

Expected: project todo tests pass.

### Task 3: Wire Directed Notifications Into Project Detail

**Files:**
- Modify: `src/pages/CommissionDetail.tsx`

**Step 1: Update notification calls**

Add `recipientId`, `recipientRole`, `actionLabel`, and `priority` to project notification calls:
- accepted applicant -> creator
- contract created -> creator
- client contract signed -> creator
- aigcer contract signed -> client
- delivery submitted -> client
- changes requested -> creator
- stage confirmed -> creator

**Step 2: Run service tests**

Run: `npm test -- src/test/services/engagementService.test.ts src/test/services/contractService.test.ts`

Expected: pass.

### Task 4: Add Dashboard Todo Cards

**Files:**
- Modify: `src/pages/DashboardClient.tsx`
- Modify: `src/pages/DashboardAigcer.tsx`

**Step 1: Load needed workflow state**

Use existing queries where possible. Add async loading for contract and escrow state for ongoing projects:
- `getContractByCommission`
- `getEscrowBundleByCommission`
- `getProjectDeliveries`

**Step 2: Render todo section**

Add compact “待办事项” section below stats:
- Show up to 3 todos.
- Button navigates to `targetPath`.
- Empty state is a small muted line.

**Step 3: Run build**

Run: `npm run build`

Expected: build succeeds.

### Task 5: Verification and Commit

**Files:**
- All changed files.

**Step 1: Run full tests**

Run: `npm test`

Expected: all non-skipped tests pass.

**Step 2: Run build**

Run: `npm run build`

Expected: build succeeds; existing chunk-size warning is acceptable.

**Step 3: Browser smoke test**

Open local dev server and verify:
- Client dashboard shows todo section.
- AIGCer dashboard shows todo section.
- Messages page filters user notifications.

**Step 4: Commit and push**

Run:

```bash
git add docs/plans/2026-06-04-targeted-notifications-todos-design.md docs/plans/2026-06-04-targeted-notifications-todos.md src
git commit -m "feat: add targeted notifications and dashboard todos"
git push
```
