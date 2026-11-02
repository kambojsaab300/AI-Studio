# AI Studio: Developer View

## 1. Architecture

```
 Customer app ──┐                   ┌── Worker app (browser tab on a worker PC)
 Admin app ─────┼──► Supabase DB ◄──┤      - calls Gemini
                │  (tables, RPC,    │      - checks face, masks, compresses
                │   triggers, RLS)  │      - uploads to Cloudinary / ImgBB
                └───────────────────┘      - saves result to DB
```

- The apps talk only to Supabase (`supabase-js`): tables, RPC functions, and realtime.
- The worker does the heavy work in the browser (canvas for masks and compression).
- Business rules live in the database. The apps show and send; the DB decides and checks.

## 2. Files

| File | Role |
|---|---|
| `AI Studio Customer.jsx` | Customer UI |
| `AI Studio Admin.jsx` | Admin UI |
| `AI Studio Worker.jsx` | Worker engine (final; changes are rare) |
| `ai_studio_setup.sql` | **All SQL in run order, one file** (generated from the parts below) |
| `ai_studio_tasks.sql` | Tasks table, upload function, pending list, views |
| `ai_studio_admin.sql` | Admin list, admin check function, admin RLS |
| `ai_studio_settings.sql` | Settings, secrets (ImgBB key), worker config (first version) |
| `ai_studio_customer.sql` | Customer create function, customer RLS |
| `ai_studio_ops.sql` | Workers (pause, drain, limit), budget, models, admin log, claim |
| `ai_studio_alerts.sql` | Email alerts (Brevo), checks every minute with pg_cron |
| `ai_studio_task_types.sql` | Old task type rules (superseded by the catalog) |
| `ai_studio_prompts.sql` | Prompts table, prompt rows, worker prompt function |
| `ai_studio_tools.sql` | Tools (chat, image), tool mapping, worker tools |
| `ai_studio_catalog.sql` | **Task catalog** (all task types), upload rules, per-photo |
| `ai_studio_family_roles.sql` | Family photo roles and task snapshot |
| `ai_studio_engine.sql` | Model capabilities, engine settings, worker config |
| `ai_studio_v2.sql` | Model list RPC, timers in settings, clean-up functions, worker config (latest version) |
| `docs/` | These documents |

**Run order:** tasks → admin → settings → customer → ops → alerts → task_types → prompts → tools → catalog → family_roles → engine.
Later files replace earlier functions (`create or replace`), so the final version is the one that stays.

## 3. Main tables

| Table | What it holds |
|---|---|
| `ai_studio_tasks` | Every task: type, prompt, photos, status, output, worker, tool, role snapshot |
| `ai_studio_task_catalog` | Every task type: label, customer label, hint, output, photo slots, flags, enabled, customer visible |
| `ai_studio_prompts` | Prompt per task type: system text, IMAGE rules, negative text, enabled, version |
| `ai_studio_tools` | Tools (chat, image, and future ones) |
| `ai_studio_tool_types` | Which tool each task type belongs to |
| `ai_studio_family_roles` | Family photo slots (key, labels, prompt text, order, enabled) |
| `ai_studio_workers` | Workers: last seen, paused, drain, limit, tools, task types |
| `ai_studio_models` | Gemini models: on/off, kind, label, aspect ratios, sizes |
| `ai_studio_settings` | One row: limits, budget, maintenance, alerts, face check, URLs, image size and quality |
| `ai_studio_secrets` | ImgBB key and Brevo key (admin only) |
| `ai_studio_usage` | Gemini calls per day per worker |
| `ai_studio_admin_log` | Every admin change |
| `ai_studio_alert_log` | Sent alerts (for the cooldown) |
| `ai_studio_admins` | Who is an admin |

## 4. Important functions (RPC)

| Function | Used by | Job |
|---|---|---|
| `upload_ai_studio_task` | Admin, customer (via create) | Checks a new task against the catalog, then saves it |
| `customer_create_task` | Customer | Customer-safe create: login, maintenance, daily limit, visible types only |
| `get_task_catalog` | Customer, worker, admin | Returns the enabled task types |
| `get_task_prompts` | Worker | Returns prompts (worker must be registered) |
| `get_family_roles` | Customer, worker | Returns enabled family roles in order |
| `get_worker_config` | Worker | Limits, budget, keys, model list, engine settings |
| `get_pending_for_worker` | Worker | Pending tasks for this worker's tools and task types |
| `claim_ai_studio_task` | Worker | Takes one task (only one worker gets it) |
| `worker_complete_task` | Worker | Saves the result (or the failure) |
| `worker_heartbeat` | Worker | "I am alive"; returns paused or not |
| `get_model_list` | Customer | Image and text models (kind, label, aspect ratios, sizes, enabled) |
| `ai_studio_release_tasks` | Admin | Processing tasks back to pending (one worker or all) |
| `ai_studio_clear_failed` | Admin | Deletes failed tasks (one worker or all) |
| `ai_studio_set_worker_tools` | Admin | Sets a worker's tools |
| `ai_studio_set_worker_task_types` | Admin | Sets a worker's task types (NULL = all) |
| `is_ai_studio_admin` | Everyone | Is this user an admin |

## 5. Triggers (automatic rules on insert or update)

| Trigger | Table | Rule |
|---|---|---|
| `ai_studio_require_prompt` | tasks (insert) | A task type needs an enabled prompt |
| `ai_studio_set_tool` | tasks (insert) | Sets the tool from the mapping; refuses a disabled type or tool |
| `ai_studio_check_per_photo` | tasks (insert) | Per-photo tasks: 1 to 10 photos |
| `ai_studio_family_snapshot` | tasks (insert) | Family tasks: one photo per enabled role; saves the role keys |
| `ai_studio_check_worker_tool` | tasks (update) | A worker can only take a task of its own tools |

## 6. How a task runs (worker)

1. Worker loads the catalog, the prompts, the family roles and the config.
2. It asks `get_pending_for_worker` for tasks of its tools and types.
3. It claims one task (`claim_ai_studio_task`). Only one worker can get it.
4. It builds the request: prompt + IMAGE rules + negative text + photos.
5. It calls Gemini (with the daily budget check).
6. Post-steps by flag: face check (retry), mask compositing (for brush edits), white to transparent (logo, remove background), smaller photo.
7. It uploads to Cloudinary and/or ImgBB and saves the result.
8. On failure: retry later (up to the limit), or mark as failed. Bad key or 5 failures in a row: the worker pauses itself.

## 7. How to add a new feature

First decide what kind of feature it is. Most features need **only database rows**.

### Level A: new task type that uses existing building blocks (no code)

Existing building blocks: photo slots (face, style, input), optional slots, prompt, brush mask, transparent output, angles, per-photo, family, face check, text output.

Steps (run in Supabase SQL Editor, in this order):

```sql
-- 1. The task type (catalog)
insert into public.ai_studio_task_catalog
  (task_type, label, customer_label, hint, output, inputs, optional, labels, customer_labels,
   extras, prompt_required, face_check, edit, transparent, angles, family, customer_visible, per_photo, sort)
values
  ('my_new_type', 'My new type', 'Mera naya kaam', 'Photo do aur batao kya chahiye.',
   'image', array['face']::text[], '{}'::text[], '{"face":"Photo"}'::jsonb, '{"face":"Photo"}'::jsonb,
   false, true, false, false, false, null, false, true, false, 200);

-- 2. The tool (chat or image, or your own tool)
insert into public.ai_studio_tool_types (task_type, tool) values ('my_new_type', 'image');

-- 3. The prompt (required for every type except chat and photo read)
insert into public.ai_studio_prompts (task_type, system_text, role_text, negative_text, prompt_version)
values ('my_new_type', 'What to create and what must stay the same.', 'IMAGE 1 = the photo.',
        'changed face:3.0, watermark, text:1.5', 1);
```

Then in the admin app: Tools screen > Kaam list > check "Chalu" and "Customer ko dikhe".
Then give the workers the type (Tools screen > Worker ke kaam), or set "Sab kaam".

**Columns of the catalog row:**

| Column | Meaning |
|---|---|
| `output` | `image` or `text` |
| `inputs` | Photo slots used: `face`, `style`, `input` |
| `optional` | Slots that may be empty |
| `labels` | Admin names of the slots (jsonb) |
| `customer_labels` | Customer names of the slots (jsonb) |
| `extras` | Allows extra photos (list of links) |
| `prompt_required` | The prompt must be filled |
| `face_check` | Compare the face with IMAGE 1 and retry if weak |
| `edit` | Brush mask: only the painted area changes |
| `transparent` | Output is a transparent PNG |
| `angles` | Text list; each photo of a batch gets the next angle |
| `family` | Family photo rules (one slot per role) |
| `per_photo` | One result for each photo (1 to 10) |
| `customer_visible` | Shown in the customer app |
| `enabled` | Off = nobody can create it |
| `sort` | Order on screen |

### Level B: new family role (no code)

Admin app > Tools > "Parivar ke roles" > type a key (small letters, `_`), admin label, customer label, prompt text > "Role banao".
Turn a role off with its checkbox. Old tasks keep their old roles.

### Level C: new AI model (no code, with a limit)

Add a row in `ai_studio_models` (model_id, kind, label, aspects, sizes), then turn it on in the admin app.
The worker reads the model list from `get_worker_config`.
Note: the model must be a model that the Gemini API accepts for that kind of call.

### Level D: new tool (for example "video")

1. Admin app > Tools > "Naya tool key" and label > "Tool banao".
2. Map the task types to the new tool (Tools > "Task type kis tool mein jayega").
3. Give workers the new tool (Tools > "Worker aur unke tools").
4. The worker must know how to run that kind of task. If it is a new kind of work, see Level E.

### Level E: new kind of processing (code needed, rare)

Needed when the worker must do something it cannot do yet, for example:
- a new AI service (not Gemini), such as a video API
- a new image operation (not mask, not white-to-transparent, not compression)
- several Gemini calls in a chain

Steps:
1. Add a new flag to the catalog (for example `video boolean`).
2. Add the new code path in `AI Studio Worker.jsx` next to the existing flags (`edit`, `transparent`, `perPhoto`, `family`).
3. Deploy the worker once. After that, new types that use this flag need only the database rows (Level A).

### Level F: change the customer or admin screen

- New field on the form: edit `AI Studio Customer.jsx` or `AI Studio Admin.jsx`.
- Labels and hints: change them in the catalog (no code).

## 8. Engine values (no code needed)

| Setting | Where |
|---|---|
| Face check threshold and retries | Admin > Settings (ops section) |
| Photo max size and quality | Admin > Settings |
| Stale task time | Admin > Settings |
| Gemini URL, face model, ImgBB URL | `ai_studio_settings` (SQL) |
| Model list | `ai_studio_models` |

Heartbeat (default 20 s) and fallback refresh (default 60 s) are also in Settings. The worker reads them with the config and uses the new value on the next run (no restart).

**Model list:** admin and customer apps read the models from `get_model_list` (customer) and `ai_studio_models` (admin). No model list is written in the code any more.

**Clean-up (admin, Workers screen):**

| Button | What it does |
|---|---|
| Sab atke tasks wapas pending | Tasks that a worker holds (processing) go back to pending |
| Sab failed tasks delete | Failed tasks are deleted |
| Atke tasks wapas (per worker) | Same, for one worker only |
| Failed hatao (per worker) | Same, for one worker only |

Each click asks for confirmation and is written to the admin log.

## 9. Testing checklist

1. Run `ai_studio_setup.sql` in Supabase. No errors.
2. Enable `pg_cron` and `pg_net`.
3. Open the worker app, add a Gemini key, check it shows "live" and that the model list is loaded.
4. Admin: create a chat task; check it runs.
5. Customer: send an image task (for example prompt to photo); check the result.
6. Customer: send a brush edit (paint an area); check only that area changed.
7. Customer: send a family photo with 2 photos.
8. Admin: turn one feature off; check the customer cannot send it.
9. Admin: send a test mail (Email alerts section).

## 10. Known limits

- Worker app runs in a browser tab. It must stay open.
- Only tasks with a matching worker tool and type are picked up.
- Pending list only looks at the first 200 pending tasks.
- Fair share is not per tool yet (chat and image count together).
- Each photo in a per-photo task is one Gemini call (budget and time).
- Supabase URL and anon key are still in the apps (needed to connect).

## 11. Security (before public launch)

- Worker login is not done. The anon key can read tasks, and `get_worker_config` gives the ImgBB key to anyone who knows a registered worker id.
- Plan: worker accounts with login, RPC-only access for workers, and removing the key from the config for workers (upload through a server function).
- Keep the app private until this is done.
