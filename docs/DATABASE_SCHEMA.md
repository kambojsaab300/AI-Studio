# AI Studio: Microsoft SQL Server Database Schema

Host Server: `db77541.public.databaseasp.net`  
Database Name: `db77541`  
ORM / Query Layer: **Dapper + ADO.NET (C#)**

---

## 🗄️ Tables Specification

### 1. `ai_studio_tasks` (Primary Work Queue)
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `BIGINT IDENTITY(1,1)` | No | Auto-increment primary key |
| `task_type` | `NVARCHAR(100)` | No | Tool identifier (e.g., `model_photoshoot`, `man_suit`) |
| `model` | `NVARCHAR(100)` | No | Gemini model identifier |
| `prompt` | `NVARCHAR(MAX)` | Yes | User prompt / instructions |
| `app_id` | `NVARCHAR(100)` | No | Tenant identifier (`weargen`, `ppp`) |
| `user_id` | `NVARCHAR(100)` | No | Originating customer / user identifier |
| `status` | `NVARCHAR(50)` | No | `pending`, `processing`, `completed`, `failed` |
| `input_image_url` | `NVARCHAR(MAX)` | Yes | Main input photo |
| `face_image_url` | `NVARCHAR(MAX)` | Yes | Reference face photo |
| `output_image_url`| `NVARCHAR(MAX)` | Yes | Primary generated photo URL |
| `output_image_urls`| `NVARCHAR(MAX)` | Yes | JSON array of all batch generated photos |
| `output_text` | `NVARCHAR(MAX)` | Yes | Generated conversational text / explanation |
| `face_match_score`| `DECIMAL(5,2)` | Yes | Face similarity percentage (0-100) |
| `error` | `NVARCHAR(MAX)` | Yes | Contextual error string tagged with `[APP_ID]` |
| `worker_id` | `NVARCHAR(100)` | Yes | ID of claiming worker |
| `batch_count` | `INT` | No | Number of photos requested (Default: 1) |
| `priority` | `INT` | No | Priority weight (Default: 0) |
| `created_at` | `DATETIMEOFFSET` | No | Task creation timestamp |
| `finished_at` | `DATETIMEOFFSET` | Yes | Task completion timestamp |

### 2. `ai_studio_apps` (Multi-Tenant Applications)
| Column | Type | Nullable | Description |
|---|---|---|---|
| `app_id` | `NVARCHAR(100)` | No | Unique app key (`weargen`, `ppp`) |
| `name` | `NVARCHAR(255)` | No | Brand display name |
| `theme_color` | `NVARCHAR(50)` | No | UI primary theme accent |
| `enabled` | `BIT` | No | Active status toggle |

### 3. `ai_studio_app_tasks` (App Tool Mappings)
| Column | Type | Nullable | Description |
|---|---|---|---|
| `app_id` | `NVARCHAR(100)` | No | Composite Primary Key |
| `task_type` | `NVARCHAR(100)` | No | Composite Primary Key |

### 4. `ai_studio_task_catalog` (Tool Registry)
Contains all 30+ tools with inputs, validation rules, hint texts, and display order.

### 5. `ai_studio_prompts` (Prompt Management)
Stores system and role prompts for each tool with versioning.

### 6. `ai_studio_workers` (Worker Fleet)
Tracks live worker instances, last heartbeat, memory limits, and administrative pause states.

### 7. `ai_studio_settings` (Global Configuration)
Singleton table containing concurrency limits, Gemini timeouts, and upload service toggles.

---

## ⚡ Non-Clustered Indexes
- **`IX_ai_studio_tasks_pending_claim`**: `(status, priority DESC, created_at ASC)` for fast queue polling.
- **`IX_ai_studio_tasks_app_user_history`**: `(app_id, user_id, created_at DESC)` for customer history isolation.
- **`IX_ai_studio_tasks_worker_status`**: `(worker_id, status)` for in-flight tracking.
- **`IX_ai_studio_app_tasks_lookup`**: `(app_id, task_type)` for sub-millisecond tool catalog lookups.
