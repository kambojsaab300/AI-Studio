# AI Studio: Documentation

AI Studio is an image and text generation system. Customers send a request, and the request is handled by
workers that call Gemini, check the result, and save it.

There are three documents:

| Document | For whom | What is in it |
|---|---|---|
| [README.md](README.md) | Everyone | This page: the parts of the system and the document list |
| [CLIENT_VIEW.md](CLIENT_VIEW.md) | Client, business people | What the system can do, in simple words |
| [DEVELOPER_VIEW.md](DEVELOPER_VIEW.md) | Developers | How it is built, the database, and how to add new features |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Anyone who hits an error | Error table: cause and fix, plus common SQL and console commands |

## The parts of the system

| Part | File | Who uses it | Job |
|---|---|---|---|
| Customer app | `AI Studio Customer.jsx` | Customers | Choose a feature, send photos and a prompt, see results |
| Admin app | `AI Studio Admin.jsx` | Admin | Create tasks, manage workers, tools, features, prompts, settings, alerts |
| Worker app | `AI Studio Worker.jsx` | Worker computers | Take tasks, call Gemini, check the face, compress, upload, save the result |
| Database | `ai_studio_setup.sql` | Everyone (through the apps) | Stores tasks, features, prompts, roles, settings, workers, and logs |

## Setup in short

1. Open Supabase, go to the SQL Editor.
2. Run the whole file `ai_studio_setup.sql` once, from top to bottom.
3. Enable `pg_cron` and `pg_net` in Database > Extensions (needed for email alerts).
4. Open the admin app, log in as an admin, and check the Tools and Settings screens.
5. Open the worker app on a worker computer, and check that it shows "live".
6. Open the customer app and send one small task.

## Important

- The code has been checked for syntax only. Run one full test (customer task, admin task, worker run) before real use.
- The worker app should be deployed once. Most new features need only database changes (see the developer guide).
- Public launch needs worker login and a locked-down database policy first (see the developer guide, "Security").
