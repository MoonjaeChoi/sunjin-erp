---
description: "Automated 3-step PRD review pipeline: Critiquer → Rebuttal → Mediator for sunjin-erp project"
---

# /prd-review-pipeline

## Purpose

**Automated PRD Review Pipeline** - Executes the complete PRD review workflow in 3 sequential steps:
1. `/prd-critiquer` - Critical review with discussion points
2. `/prd-rebuttal-agent` - Rebuttal and discussion topic extraction
3. `/prd-mediator` - Decision making and final PRD v2 generation

This pipeline automates the entire PRD review process, reducing manual file path management and ensuring consistent workflow execution.

## How It Works

```
┌────────────────────────────────────────────────────────────┐
│                   PRD Review Pipeline                      │
└────────────────────────────────────────────────────────────┘
                          │
                          ↓
        ┌─────────────────────────────────────┐
        │  Step 1: /prd-critiquer             │
        │  - Read original PRD                │
        │  - Generate critical review         │
        │  - Output: *_critical_review.md     │
        └─────────────┬───────────────────────┘
                      ↓
        ┌─────────────────────────────────────┐
        │  Step 2: /prd-rebuttal-agent        │
        │  - Read PRD + critical review       │
        │  - Generate rebuttal                │
        │  - Extract discussion topics        │
        │  - Output: *_discussion_topics.md   │
        └─────────────┬───────────────────────┘
                      ↓
        ┌─────────────────────────────────────┐
        │  Step 3: /prd-mediator              │
        │  - Mediate discussion topics        │
        │  - User/AI decision making          │
        │  - Generate final PRD v2            │
        │  - Output: *_v2.md, *_decisions.md  │
        └─────────────────────────────────────┘
```

## Input Requirements

- **`--prd` / `--prd-file`** (Required): Path to original PRD file
  - Example: `docs/prd/1020_기술지원_관리_prd.md`

- **`--mode` / `--decision-mode`** (Optional): Decision-making mode for Step 3
  - `user` (default): User makes all decisions interactively
  - `ai-assisted`: Claude suggests decisions with user confirmation (Recommended)
  - `auto`: Claude makes all decisions automatically

- **`--priority` / `--pri`** (Optional): Filter discussion items by priority in Step 3
  - `high`: HIGH priority items only (blockers)
  - `medium`: MEDIUM priority items only
  - `low`: LOW priority items only
  - `all` (default): All items regardless of priority

## Usage Examples

### Basic Usage - AI-Assisted Decision Making (Recommended)

```bash
/prd-review-pipeline --prd docs/prd/1020_기술지원_관리_prd.md --mode ai-assisted
```

**What Happens:**
1. **Step 1**: Generate critical review
   - Auto-generates: `1020_기술지원_관리_prd_critical_review.md`
2. **Step 2**: Generate rebuttal and discussion topics
   - Auto-generates: `1020_기술지원_관리_prd_discussion_topics.md`
3. **Step 3**: Mediate discussions with AI assistance
   - Claude suggests decisions with user confirmation
   - Auto-generates:
     - `1020_기술지원_관리_prd_decisions.md`
     - `1020_기술지원_관리_prd_v2.md`

### User-Driven Decision Making (Interactive)

```bash
/prd-review-pipeline --prd docs/prd/1020_기술지원_관리_prd.md --mode user
```

**Process:**
- Steps 1 & 2: Automatic (critical review → rebuttal → discussion topics)
- Step 3: Interactive user prompts for each decision point

### Fully Automated Pipeline (No User Interaction)

```bash
/prd-review-pipeline --prd docs/prd/1020_기술지원_관리_prd.md --mode auto
```

**Process:**
- All 3 steps execute automatically
- Claude makes all decisions based on sunjin-erp best practices
- Fastest workflow, minimal user input

### High Priority Items Only (Focus on Blockers)

```bash
/prd-review-pipeline --prd docs/prd/1020_기술지원_관리_prd.md --priority high --mode ai-assisted
```

**Process:**
- Steps 1 & 2: Full analysis
- Step 3: Only mediate HIGH priority discussion items
- MEDIUM/LOW items deferred

## Output Files

For input file: `docs/prd/1020_기술지원_관리_prd.md`

**Auto-generated outputs:**
1. `1020_기술지원_관리_prd_critical_review.md` (Step 1)
2. `1020_기술지원_관리_prd_discussion_topics.md` (Step 2)
3. `1020_기술지원_관리_prd_decisions.md` (Step 3)
4. `1020_기술지원_관리_prd_v2.md` (Step 3 - Final PRD)

## Process Details

### Step 1: Critical Review (`/prd-critiquer`)

**Execution:**
```bash
/prd-critiquer --prd {input_prd_path}
```

**Activities:**
- Read original PRD
- Perform multi-faceted critical analysis:
  - Clarity & Ambiguity
  - Completeness & Edge Cases
  - Architecture Compliance (Next.js App Router, Server/Client Components)
  - Database Design (Oracle XE 23, TypeORM, soft delete, ON DELETE RESTRICT)
  - Authentication & Authorization (NextAuth.js, RBAC)
  - ERP Module Dependencies (Phase 순서)
  - UI/UX & Responsive Design (shadcn/ui, Desktop-first)
  - Security Considerations
  - Performance & Scalability
- Generate prioritized discussion points (HIGH/MEDIUM/LOW)

**Output:**
- `{base_filename}_critical_review.md`

### Step 2: Rebuttal & Discussion Topics (`/prd-rebuttal-agent`)

**Execution:**
```bash
/prd-rebuttal-agent --prd {input_prd_path} --crv {critical_review_path} --dis
```

**Activities:**
- Read original PRD and critical review
- Generate rebuttal for critical points:
  - Counter-arguments
  - Alternative viewpoints
  - Acknowledgement of valid criticisms
  - sunjin-erp alignment verification
- Extract unresolved discussion topics
- Prioritize topics (HIGH/MEDIUM/LOW)

**Output:**
- `{base_filename}_rebuttal.md`
- `{base_filename}_v2.md`
- `{base_filename}_discussion_topics.md`

### Step 3: Mediation & Final PRD (`/prd-mediator`)

**Execution:**
```bash
/prd-mediator --dis {discussion_topics_path} --mode {mode} --priority {priority}
```

**Activities:**
- Parse discussion topics by priority
- Present options for each topic
- Decision making:
  - **User mode**: Interactive prompts for each decision
  - **AI-assisted mode**: Claude suggests + user confirms
  - **Auto mode**: Claude decides based on best practices
- Document decisions with rationale
- Update PRD v2 with finalized decisions

**Output:**
- `{base_filename}_decisions.md` - Decision record
- `{base_filename}_v2_updated.md` - Final PRD with all decisions applied

## Error Handling

**File Not Found:**
- If input PRD does not exist, pipeline stops immediately with clear error message

**Step Failure:**
- If Step 1 fails, pipeline stops (no critical review → no rebuttal)
- If Step 2 fails, pipeline stops (no discussion topics → no mediation)
- If Step 3 fails, previous outputs (critical review, discussion topics) are still available

## Benefits

- **Consistency**: All PRDs go through same rigorous review process
- **File Path Management**: Auto-generates correct file paths between steps
- **Flexible Decision Making**: Choose user-driven, AI-assisted, or fully automated
- **Priority Filtering**: Focus on high-priority items first
- **Traceability**: Complete audit trail (critical review → rebuttal → decisions → PRD v2)

## When to Use

**Use this pipeline when:**
- Starting a new feature PRD (complete review needed)
- Major PRD updates (re-validation required)
- High-quality PRD documentation required

**Don't use this pipeline when:**
- Minor PRD typo fixes
- PRD already reviewed and approved

## Architecture Compliance

This pipeline enforces sunjin-erp's architecture standards across all 3 steps:

- **Next.js App Router**: Server/Client Component 분리 검증
- **Oracle XE 23**: CASCADE DELETE 금지, soft delete 필수, ON DELETE RESTRICT
- **TypeORM**: Entity 설계 및 마이그레이션 전략 검증
- **NextAuth.js**: RBAC (ADMIN/MANAGER/USER) 권한 설계 검증
- **ERP Module**: Phase 순서에 따른 의존성 검증
- **shadcn/ui + Tailwind**: Desktop-first 반응형 설계 검증

## Related Commands

- `/prd-generator` - Generate initial PRD from requirements
- `/prd-critiquer` - Step 1 only (standalone critical review)
- `/prd-rebuttal-agent` - Step 2 only (standalone rebuttal)
- `/prd-mediator` - Step 3 only (standalone mediation)

## Language Usage

**Output Language:**
- Korean (한글) for documentation and discussion
- English for technical terms and technology names

**Example:**
- "Server Component에서 data fetching을 처리해야 한다"
- "TypeORM entity에 deleted_at column이 필수이다"

---

**Now proceed with the pipeline execution based on user input.**
