# AI Studio: Handoff (continue this project anywhere)

Use this file to continue the project in another tool, another PC, or a cloud session.
Read this file first, then `docs/DEVELOPER_VIEW.md` for the technical details.

---

## 1. What the project is

AI Studio is an AI image and text generation system with three apps and one Supabase database.

- **Customer app** (`AI Studio Customer.jsx`): customers choose a feature, send photos and a prompt, see results.
- **Admin app** (`AI Studio Admin.jsx`): admin creates tasks, manages workers, tools, features (task types),
  family roles, prompts, model on/off, settings, email alerts, and the action log.
- **Worker app** (`AI Studio Worker.jsx`): runs in a browser tab on a worker PC. It takes tasks, calls Gemini,
  checks the face, makes masks and transparent PNGs, compresses, uploads (Cloudinary / ImgBB), and saves results.
  **This file is final. Almost all new features need only database rows, not worker code.**
- **Database**: Supabase (Postgres). One setup file: `ai_studio_setup.sql`.

Project folder: `E:\Mohit\photo tool\AI Studio\`

**Folder layout (moved on this date):**

| Folder | What is inside |
|---|---|
| `app\` | The three apps: `AI Studio Customer.jsx`, `AI Studio Admin.jsx`, `AI Studio Worker.jsx` |
| `db\` | All SQL: `ai_studio_setup.sql` (combined, run this) and the parts (`ai_studio_tasks.sql` ... `ai_studio_engine.sql`) |
| `docs\` | `HANDOFF.md`, `README.md`, `FLOW.md`, `DEVELOPER_VIEW.md`, `CLIENT_VIEW.md`, `CHAT_EXPORT.md` |

When regenerating `db\ai_studio_setup.sql`, read the parts from `db\` (the header lists them in run order).
Other files in `E:\Mohit\photo tool\` (old experiments, not part of AI Studio): `photo_tool.jsx`,
`Gif AI Promt Upload new.jsx`, `weargen automatic.jsx`, `Photo Blog Tool Generation.css` (really JSX).

---

## 2. File list

| File | What it is |
|---|---|
| `AI Studio Customer.jsx` | Customer app (React) |
| `AI Studio Admin.jsx` | Admin app (React) |
| `AI Studio Worker.jsx` | Worker app (React), final engine |
| `ai_studio_setup.sql` | **All SQL in one file, run order inside. Run this in Supabase SQL Editor.** Generated from the parts below. |
| `ai_studio_tasks.sql` | Tasks table, first upload function, pending list, views |
| `ai_studio_admin.sql` | Admin list, `is_ai_studio_admin()`, admin RLS |
| `ai_studio_settings.sql` | Settings, secrets (ImgBB key), first worker config |
| `ai_studio_customer.sql` | Customer create function, customer RLS |
| `ai_studio_ops.sql` | Workers (pause, drain, limit), budget, models, admin log, claim |
| `ai_studio_alerts.sql` | Email alerts (Brevo) with pg_cron every minute |
| `ai_studio_task_types.sql` | Older task type rules (superseded by catalog) |
| `ai_studio_prompts.sql` | Prompts table and prompt rows (with version), worker prompt function |
| `ai_studio_tools.sql` | Tools (chat, image), task type to tool mapping, worker tools |
| `ai_studio_catalog.sql` | **Task catalog** (all task types), upload rules, per-photo, prompt FK |
| `ai_studio_family_roles.sql` | Family roles table and task snapshot trigger |
| `ai_studio_engine.sql` | Model capabilities, engine settings, `get_worker_config` |
| `ai_studio_v2.sql` | Model list RPC, heartbeat and fallback settings, clean-up functions, latest `get_worker_config` |
| `ai_studio_apps.sql` | Multi-app: apps (WearGen, PPP), feature per app, `app_id` on tasks, app-aware customer create |
| `ai_studio_image_sizes.sql` | 1K, 2K, 4K for the 3.1 Flash image model |
| `ai_studio_size_05k.sql` | Size 0.5K allowed in the upload checks |
| `ai_studio_task_time.sql` | Task time columns and trigger (`finished_at`, `duration_ms`, `process_ms`) |
| `ai_studio_fallback.sql` | `fallback_sec` set to 120 (run last) |
| `docs/README.md` | Documentation index |
| `docs/CLIENT_VIEW.md` | Client-friendly feature list |
| `docs/DEVELOPER_VIEW.md` | Developer guide (architecture, tables, how to add features) |
| `HANDOFF.md` | This file |

**Run order (SQL):** tasks → admin → settings → customer → ops → alerts → task_types → prompts → tools → catalog → family_roles → engine.
Later files replace earlier functions (`create or replace`). `ai_studio_setup.sql` already has this order.

**Regenerate the combined file after editing any part:** rebuild `ai_studio_setup.sql` by concatenating the parts in run order, each with a `-- ### FROM <file>.sql ###` header.

---

## 3. Status

| Area | Status |
|---|---|
| All three apps written | Done. Syntax checked with `@babel/parser` (JSX parses). |
| SQL written | Done. **Never run against a live Supabase yet.** |
| Live test (customer, admin, worker) | **Not done.** First thing to do. |
| Worker engine constants moved to DB | Done (`get_worker_config` gives model list, face check, URLs, stale time, image size and quality). |
| Task catalog (all task types in DB) | Done (43 seed types + `per_photo_prompt`). |
| Prompts in DB (versioned) | Done. |
| Tools (chat / image) and worker assignment | Done. |
| Family roles in DB, task snapshot | Done. |
| Email alerts (Brevo) | Written. Needs pg_cron and pg_net enabled, and Brevo sender verified. |
| Security (worker login, RPC-only access) | **Not done. Must be done before public launch.** |
| Customer login for workers | Not done (see security). |
| Credits, result review, video | Planned, not started. |

---

## 4. Main decisions (and why)

1. **Three apps, one database.** Apps are separate because they run in different places. The database is one.
2. **Business rules in the database.** Task rules (photo slots, prompt, flags, enabled, customer visible) are in
   `ai_studio_task_catalog`. Prompts are in `ai_studio_prompts`. Upload checks and triggers enforce them even if an app is wrong.
3. **Worker is generic.** It reads task types, prompts, roles, models and settings from the database. Processing
   steps are fixed flags: photo slots, face check, brush mask compositing, transparent PNG (white knock-out),
   angles, per-photo, family order, compression.
4. **Tools.** `chat` (text) and `image` tools. Each worker has tools and optional task types (NULL = all).
   The server refuses a claim if the worker lacks the tool.
5. **Prompts are versioned.** The seed rewrites a prompt only when its `prompt_version` goes up, so admin edits survive reruns.
6. **Family snapshot.** A family task stores its role keys when made, so changing roles later does not break queued tasks.
7. **Photos are compressed** before upload (max 2048 px, JPEG 0.85 by default; both are settings). Transparent PNG is kept as PNG.
8. **Face check** compares the face with IMAGE 1 and retries up to `match_retries` times if below `match_threshold`.
   Features with two people (couple, family) have no face check (only the prompt controls identity).

---

## 5. Secrets (do not put them in files or chats)

- Supabase URL and publishable key (`sb_publishable_...`): hardcoded in all three apps (`SUPABASE_URL`, `SUPABASE_KEY`). Project: kdwkdhjtcebrhtokhirg. This key is public-safe; the database rules protect the data.
- Gemini API key: entered in the worker app (per worker).
- Brevo API key: `ai_studio_secrets.brevo_api_key` (admin-only table). Entered from the admin Settings screen.
- ImgBB API key: `ai_studio_secrets.imgbb_api_key` (admin-only). **Known risk**: `get_worker_config` returns it to any registered worker id.
- Cloudinary: cloud name and unsigned upload preset (not secret, but set in the DB settings).

If a key was ever pasted in a chat, rotate it.

---

## 6. Known issues and limits

- Nothing has been run live. Expect small SQL or runtime errors on first run. Fix and note them here.
- Worker app must stay open in a browser tab. Heartbeat and fallback are in Settings now (`heartbeat_sec` default 30 s, `fallback_sec` default 120 s). The worker also wakes on realtime INSERT of a new task.
- Pending list only looks at the first 200 pending tasks, then filters by the worker's tools and types.
- Fair share is across all tools together (not per tool).
- Per-photo tasks: one Gemini call per photo (uses budget fast).
- (Fixed in v2) Model list is read from the database by the admin and customer apps.
- Admin Tools screen can now change a task type's names and photo slots (click "Naam aur slots badlo"). A wrong slot setting can break the form, so check the prompt after changing it.
- Catalog and roles seed only inserts missing rows. Later label changes in code do not reach the database; change rows in the admin Tools screen or with SQL.
- Pose change and brush edits depend on the model; check results.
- ImgBB key exposure (above).

---

## 7. Next steps (in order)

1. **Run `ai_studio_setup.sql`** in Supabase SQL Editor. Fix any error and record it in section 6.
2. Enable `pg_cron` and `pg_net` (Supabase Database > Extensions).
3. Open the worker app, enter a Gemini key, check it shows "live" and that the model list loads.
4. Admin: check Tools screen (tools, catalog, worker tools, family roles) and Settings.
5. Test: customer chat; customer prompt-to-photo; customer brush edit (only painted area changes);
   customer family photo with 2 photos; customer per-photo with 2 photos; admin test mail.
6. Security: worker accounts with login; RPC-only access for workers; move ImgBB upload to a server function
   so the key is not sent to workers.
7. Then: credits, result review, video (separate model and API).

---

## 8. How to add a new feature (short)

- **New task type using existing building blocks:** insert one row in `ai_studio_task_catalog`, one in
  `ai_studio_tool_types`, one in `ai_studio_prompts` (in that order). Enable it in the admin Tools screen.
  Full SQL template is in `docs/DEVELOPER_VIEW.md`, section 7.
- **New family role:** admin Tools screen > Parivar ke roles.
- **New Gemini model:** row in `ai_studio_models` (kind, label, aspects, sizes), then turn it on.
- **New kind of processing** (new API, new image operation): needs worker code (add a flag and a code path), then deploy once.

---

## 9. How to continue in a new session (instructions for the next AI)

- Language: the user writes in Hinglish (Hindi in English letters). Reply in simple Hinglish. Code comments in English, plain.
- Keep the user's style: short text, tables, easy words.
- Do not change the worker engine unless a new processing step is needed.
- For a new feature, prefer database rows. Only add code when no row can express it.
- After any change to a part of the SQL, regenerate `ai_studio_setup.sql` in run order.
- Verify JSX with a parser (`@babel/parser` with `jsx` plugin). Verify SQL only by reading, unless a live database is available.
- Do not invent test results. Say what was run and what was not.
- Do not write keys into files.
