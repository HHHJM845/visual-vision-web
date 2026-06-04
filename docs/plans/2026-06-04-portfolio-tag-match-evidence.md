# Portfolio Tag Match Evidence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add portfolio-derived creator tags and show matched portfolio evidence in smart applicant recommendations.

**Architecture:** Add a pure tagging service that derives tags from creator profiles and portfolio metadata. Extend `aiService.matchApplicants` and `useSmartMatch` to carry portfolio data and evidence fields while preserving score-only callers. Update `CommissionDetail` to display matched tags and matched portfolio items in the smart recommendation card and explanation dialog.

**Tech Stack:** React, TypeScript, Vitest, localStorage/mock demo data, DeepSeek fallback service.

---

### Task 1: Creator Tagging Service

**Files:**
- Create: `src/services/creatorTaggingService.ts`
- Create: `src/test/services/creatorTaggingService.test.ts`

**Step 1: Write failing tests**

Test:
- Portfolio item title/description produces tags such as `科幻`, `赛博朋克`, `短片`.
- Creator profile merges `styles`, `tools`, `bio`, and portfolio tags.
- Tags are deduped and limited.

**Step 2: Run failing test**

Run: `npm test -- src/test/services/creatorTaggingService.test.ts`

Expected: fail because service does not exist.

**Step 3: Implement minimal service**

Export:
- `PortfolioTagResult`
- `CreatorCapabilityProfile`
- `tagPortfolioItem`
- `buildCreatorCapabilityProfile`

**Step 4: Run passing test**

Run: `npm test -- src/test/services/creatorTaggingService.test.ts`

Expected: pass.

### Task 2: Match Evidence in AI Service

**Files:**
- Modify: `src/services/aiService.ts`
- Modify: `src/services/aiService.test.ts`

**Step 1: Write failing tests**

Add tests that:
- `matchApplicants` fallback returns `matchedTags`, `matchedPortfolioIds`, and `reasons`.
- Portfolio match contributes to score.
- Existing JSON score-only DeepSeek response remains accepted.

**Step 2: Run failing test**

Run: `npm test -- src/services/aiService.test.ts`

Expected: fail because match results lack evidence fields.

**Step 3: Implement minimal changes**

Update:
- `ApplicantInput` to include optional `portfolio`.
- `MatchResult` type.
- fallback scorer to use `buildCreatorCapabilityProfile`.
- AI parser to normalize missing evidence fields.

**Step 4: Run passing test**

Run: `npm test -- src/services/aiService.test.ts`

Expected: pass.

### Task 3: Hook Data Flow

**Files:**
- Modify: `src/hooks/useSmartMatch.ts`
- Modify: `src/hooks/useSmartMatch.test.ts`
- Modify: `src/services/commissionService.ts`

**Step 1: Write failing tests**

Update hook test so applicant portfolio is passed into `matchApplicants`, and returned evidence is available in `scores`.

**Step 2: Run failing test**

Run: `npm test -- src/hooks/useSmartMatch.test.ts`

Expected: fail because hook only passes `bio`, `styles`, `tools`.

**Step 3: Implement data flow**

Add optional `portfolio` to `ApplicantWithProfile`, populate it from demo users and Supabase profile rows where available, and pass it through `useSmartMatch`.

**Step 4: Run passing test**

Run: `npm test -- src/hooks/useSmartMatch.test.ts`

Expected: pass.

### Task 4: Commission Detail UI Evidence

**Files:**
- Modify: `src/pages/CommissionDetail.tsx`

**Step 1: Render matched tags on cards**

Show up to 3 matched tags in smart recommendation applicant cards.

**Step 2: Render matched portfolio in dialog**

In the smart recommendation explanation dialog, add a matched portfolio section when the selected applicant has matched portfolio IDs.

**Step 3: Build verification**

Run: `npm run build`

Expected: build succeeds.

### Task 5: Final Verification and Push

**Files:**
- All changed files.

**Step 1: Run tests**

Run: `npm test`

Expected: all non-skipped tests pass.

**Step 2: Run build**

Run: `npm run build`

Expected: build succeeds; existing chunk-size warning is acceptable.

**Step 3: Browser smoke test**

Open local project detail page, run smart recommendation, verify:
- cards show matched tags,
- dialog shows matched portfolio items.

**Step 4: Commit and push**

Run:

```bash
git add docs/plans/2026-06-04-portfolio-tag-match-evidence-design.md docs/plans/2026-06-04-portfolio-tag-match-evidence.md src
git commit -m "feat: add portfolio tag match evidence"
git push
```
