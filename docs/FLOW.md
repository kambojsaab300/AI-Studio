# AI Studio: Flow

This file shows how the system works, step by step, with diagrams.
Read it after `HANDOFF.md`. For tables and SQL details, see `docs/DEVELOPER_VIEW.md`.

Diagrams use Mermaid syntax. They show in GitHub, VS Code (Mermaid preview), and many Markdown viewers.

---

## 1. Big picture

```mermaid
flowchart LR
    C[Customer app] -->|create task| DB[(Supabase DB)]
    A[Admin app] -->|create task / manage| DB
    DB -->|pending tasks| W[Worker app in browser]
    W -->|Gemini call| G[(Gemini API)]
    W -->|upload photo| U[(Cloudinary / ImgBB)]
    W -->|save result| DB
    DB -->|result| C
    DB -->|live status| A
```

**In one line:** the customer or admin creates a task in the database. A worker picks it up, makes the photo or text,
uploads the photo, and saves the result. The customer sees the result.

---

## 2. Who does what

| Actor | Does | Does not do |
|---|---|---|
| Customer | Picks a feature, uploads photos, writes a prompt, sees own results | Set prices, change prompts, see other customers |
| Admin | Turns features on or off, sets tools and worker jobs, edits prompts, roles, models, settings, alerts | Make photos directly |
| Worker (browser tab) | Takes tasks, calls Gemini, checks face, cuts or edits, compresses, uploads, saves | Decide business rules (the DB decides) |
| Database | Stores everything, checks rules, gives the right tasks to the right worker | Call Gemini or upload photos |

---

## 3. Customer flow

```mermaid
flowchart TD
    A[Open customer app] --> B[Load feature list from DB]
    B --> C[Choose a feature]
    C --> D[Upload photos or paste links]
    D --> E{Brush feature?}
    E -- yes --> F[Paint the area on the photo]
    F --> G[Save area: mask is uploaded]
    E -- no --> H[Write prompt if needed]
    G --> H
    H --> I[Press send]
    I --> J[customer_create_task in DB]
    J --> K{DB accepts?}
    K -- no --> L[Show error message]
    K -- yes --> M[Task is pending]
    M --> N[Customer sees status in My results]
    N --> O{Done?}
    O -- yes --> P[See photo or text, download]
    O -- failed --> Q[Show failed, try again or change prompt]
```

**What the DB checks when the customer presses send:**
1. Customer is logged in.
2. Maintenance mode is off.
3. The feature is enabled and visible to customers.
4. The model is enabled.
5. Daily task limit is not reached.
6. Photos match the feature (how many, which slots, family 2 to 6, per-photo 1 to 10).
7. Prompt is filled when the feature needs one.
8. No identical task is already pending or running.

---

## 4. Admin flow

```mermaid
flowchart TD
    A[Log in as admin] --> B{Which screen?}
    B --> T[Task banao: create a task]
    B --> W[Workers: live list, pause, drain, limit, priority]
    W --> WC[Clean-up: stuck tasks back to pending, failed tasks deleted, per worker or all]
    B --> TL[Tools: tools, features, worker jobs, family roles]
    B --> F[Features: list of everything]
    B --> P[Prompts: edit text per feature]
    B --> S[Settings: limits, budget, alerts, face check, image size]
    T --> T1[Pick feature, add photos and prompt]
    T1 --> T2[Problems shown in red? fix them]
    T2 --> T3[Send: task is pending]
    TL --> TL1[Turn feature on or off]
    TL --> TL2[Set which tool a feature uses]
    TL --> TL3[Set which features each worker runs]
    TL --> TL4[Add or switch off family roles]
    S --> S1[Save: workers read new values soon]
    P --> P1[Save: prompt version]
```

**Admin alerts (automatic, by the DB every minute):**
- All workers offline and tasks pending: email.
- Queue is full: email.
- A worker paused itself: email.
- Same alert is not sent again within the cooldown time.

---

## 5. Worker flow (what the browser tab does)

```mermaid
flowchart TD
    A[Open worker app, enter Gemini key] --> B[Register worker id]
    B --> C[Load config, task types, prompts, roles, models]
    C --> D[Heartbeat (time from settings, default 20 s): I am alive]
    D --> E{Paused or drained or no budget?}
    E -- yes --> D
    E -- no --> F[Ask DB for pending tasks for my tools and types]
    F --> G{Any task?}
    G -- no --> D
    G -- yes --> H[Claim one task: DB gives it only to me]
    H --> I{Claim OK?}
    I -- no --> F
    I -- yes --> J[Run the task]
    J --> K{Success?}
    K -- yes --> L[Save result: photo links or text]
    K -- no --> M{Attempts left?}
    M -- yes --> N[Set to retry later]
    M -- no --> O[Mark failed, save error]
    N --> D
    O --> D
    L --> D
```

### 5.1 What "run the task" does (photo tasks)

```mermaid
flowchart TD
    A[Task] --> B{Kind of task}
    B -- text --> T1[Send prompt + photo to text model] --> T2[Save text]
    B -- photo, per-photo --> P1[For each photo, max 10] --> P2[Same prompt on each photo]
    B -- photo, batch --> Q1[Make batch_count photos in parallel]
    B -- photo, family --> F1[Photos in role order, empty slots skipped]
    P2 --> M
    Q1 --> M
    F1 --> M
    M[Gemini call] --> X{Brush edit?}
    X -- yes --> Y[Keep original pixels outside the mask]
    X -- no --> Z{Transparent PNG?}
    Y --> Z
    Z -- yes --> W[White becomes transparent]
    Z -- no --> FC{Face check on?}
    W --> FC
    FC -- yes --> FS[Compare face with IMAGE 1]
    FS --> FR{Score >= threshold?}
    FR -- no and retries left --> M
    FR -- yes or no retries --> CP[Make smaller: max side and quality]
    FC -- no --> CP
    CP --> UP[Upload to Cloudinary and/or ImgBB]
    UP --> SV[Save links in DB]
```

**Rules that always apply:**
- A worker can only take tasks of its own tools and task types (checked in the DB).
- One task is given to one worker only (claim).
- A worker stops taking new tasks when paused, drained, out of budget, or when the model list is not loaded yet.

---

## 6. Database flow (automatic rules)

### 6.1 When a task is created

```mermaid
flowchart TD
    A[New task row] --> B[Trigger: check prompt required]
    B --> C[Trigger: check per-photo count 1-10]
    C --> D[Trigger: check family snapshot, save role keys]
    D --> E[Trigger: set tool from mapping, refuse if off]
    E --> F[Row saved as pending]
```

### 6.2 When a worker takes a task

```mermaid
flowchart TD
    A[Worker asks to claim task] --> B[Trigger: is this worker allowed this tool?]
    B -- no --> X[Refused]
    B -- yes --> C[Task gets worker id, status processing]
```

### 6.3 Upload check (before saving a task)

```mermaid
flowchart TD
    A[Task data from app] --> B[Load catalog row for this task type]
    B --> C{Type enabled?}
    C -- no --> X1[Refused]
    C -- yes --> D[Model fits output: image or text?]
    D --> E{Prompt needed and given?}
    E -- no --> X2[Refused]
    E -- yes --> F{Required photo slots filled?}
    F -- no --> X3[Refused]
    F -- yes --> G{Family: at least 2 photos? Per-photo: 1 to 10?}
    G -- no --> X4[Refused]
    G -- yes --> H{Same task already pending?}
    H -- yes --> X5[Refused]
    H -- no --> I[Saved]
```

---

## 7. Adding a new feature (flow)

```mermaid
flowchart TD
    A[New idea] --> B{Can existing building blocks do it?}
    B -- yes --> C[Add catalog row + tool mapping + prompt row]
    C --> D[Enable in admin Tools screen]
    D --> E[Give it to workers: Sab kaam or pick]
    E --> F[Test: customer sends, worker runs]
    B -- no --> G{What is missing?}
    G -- new flag on existing processing --> H[Add flag in SQL + small code in worker, deploy worker once]
    H --> C
    G -- new AI provider or new kind of work --> I[New code path in worker and maybe apps]
    I --> C
```

**Building blocks (what catalog rows can use):**
- Photo slots: face, style, input; optional slots; labels.
- Prompt, IMAGE rules, negative text.
- Brush mask (edit), transparent PNG, product angles, per-photo (1-10), family roles.
- Face check (for single person features).
- Text output (for chat and text tools).

---

## 8. Family photo flow (example of the family roles)

```mermaid
flowchart LR
    A[Admin adds or switches off a role] --> B[(Roles table)]
    B --> C[Customer form shows enabled roles in order]
    C --> D[Customer fills slots, empty ones allowed, at least 2]
    D --> E[Upload check: count = enabled roles]
    E -- no --> X[Refused: page refresh]
    E -- yes --> F[Task saved with role keys snapshot]
    F --> G[Worker: order line built from the snapshot]
    G --> H[Gemini call with photo order]
```

**Why the snapshot:** if roles change later, old tasks still use the roles they were made with.

---

## 9. Email alert flow (Brevo)

```mermaid
flowchart TD
    A[pg_cron: every minute] --> B[Check settings: alerts on?]
    B -- no --> Z[Stop]
    B -- yes --> C[Count pending tasks, live workers, queue size, paused workers]
    C --> D{Problem found?}
    D -- no --> Z
    D -- yes --> E{Same alert in cooldown?}
    E -- yes --> Z
    E -- no --> F[Log alert]
    F --> G[Send mail through Brevo API]
```

---

## 10. Settings flow (who changes what, and when it takes effect)

```mermaid
flowchart LR
    A[Admin Settings or Tools screen] --> B[(Database row)]
    B --> C[Worker reads config on connect and every 60 s]
    B --> D[Customer reads features on load]
    B --> E[DB rules apply immediately to new tasks]
```

| Change | Where | Takes effect |
|---|---|---|
| Feature on or off | Tools screen | New tasks, next customer page load |
| Prompt text | Prompts | New tasks use the new version |
| Family role | Tools screen | Next family task |
| Worker jobs | Tools screen | Next time the worker asks for tasks |
| Face threshold, image size | Settings | Next worker config refresh |
| Model on or off | Models | Next worker config refresh |

---

## 11. Failure flow

```mermaid
flowchart TD
    A[Something fails in a task] --> B{Where?}
    B -- Gemini error or timeout --> C[Retry later, up to max attempts]
    B -- upload fails --> D[Try other service if on, else retry]
    B -- bad key --> E[Worker pauses itself at once]
    B -- 5 failures in a row --> E
    B -- DB refuses the task --> F[Customer sees the reason message]
    C --> G{Attempts left?}
    G -- no --> H[Failed, error saved]
```

---

## 12. Glossary (short)

| Word | Meaning |
|---|---|
| Feature / task type | One kind of work the customer can ask for (for example "hair change") |
| Catalog | The table of all features and their rules |
| Tool | A group of work (chat or image). Workers have tools. |
| Slot | A photo place in a form (face, style, input, or a family role) |
| Prompt | The instruction text for Gemini, stored in the DB |
| Mask (brush) | The painted area; only this area changes |
| Claim | A worker taking one task. Only one worker can claim a task. |
| Snapshot | A copy of rules or roles saved with the task |
| Per-photo | One result for each photo, same prompt |
| Heartbeat | "I am alive" signal from a worker, every 20 s |
