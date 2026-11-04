# AI Studio: .NET Core Web API Reference

Base Production URL: `https://aistudio.runasp.net`  
Framework: **ASP.NET Core 8.0 on Windows Server IIS**  
Database Engine: **Microsoft SQL Server (ADO.NET + Dapper)**

---

## 1. REST Endpoints (`/api/rest/{table}`)

Supports querying, filtering, ordering, limiting, inserting, and patching database tables.

### Supported Query Parameters
| Parameter | Description | Example |
|---|---|---|
| `select` | Comma-separated list of columns to return | `select=id,task_type,status,output_image_url` |
| `{column}=eq.{val}` | Exact match filter | `status=eq.pending` or `app_id=eq.weargen` |
| `order` | Column sort order (`asc` or `desc`) | `order=created_at.desc` |
| `limit` | Max rows to return | `limit=10` |
| `offset` | Pagination skip offset | `offset=20` |
| `count` | Returns exact row count in response header | `count=exact` |

### Supported Methods
- `GET /api/rest/{table}`: Retrieve rows with filtering and pagination.
- `POST /api/rest/{table}`: Insert a new record.
- `PATCH /api/rest/{table}?{filter}`: Update existing record(s).
- `DELETE /api/rest/{table}?{filter}`: Delete record(s).

---

## 2. RPC Endpoints (`/api/rpc/{procedure}`)

High-performance remote procedure calls for core business logic.

### Task Management RPCs
- **`POST /api/rpc/upload_ai_studio_task`** (or `customer_create_task`):
  - Submits a new generation task into the queue.
  - Body: `{ task_type, model, prompt, app_id, user_id, input_image_url, batch_count, ... }`
  - Returns: `Task ID (int64)`

- **`POST /api/rpc/get_pending_for_worker`** (or `get_pending_ai_studio_tasks`):
  - Fetches pending tasks ready for claiming.
  - Body: `{ p_worker_id, p_limit, p_stale_before }`
  - Returns: Array of task records.

- **`POST /api/rpc/claim_ai_studio_task`**:
  - Atomically claims a task for a worker.
  - Body: `{ p_id, p_worker_id }`
  - Returns: `[{ id: 123 }]` if successfully claimed, or `[]` if already taken.

- **`POST /api/rpc/worker_complete_task`** (or `complete_ai_studio_task`):
  - Finalizes task execution with generated images or error context.
  - Body: `{ p_id, p_worker_id, p_patch: { status: "completed", output_image_url, process_ms } }`
  - Returns: `true` / `false`

### Worker & System Health RPCs
- **`POST /api/rpc/register_ai_studio_worker`**:
  - Registers a new worker node and returns an assigned ID (`worker_1`, `worker_2`).
- **`POST /api/rpc/worker_heartbeat`**:
  - Updates worker timestamp and retrieves administrative pause / drain signals.
- **`POST /api/rpc/get_task_catalog`**:
  - Returns the list of active tools, input requirements, and app associations.
- **`POST /api/rpc/get_task_prompts`**:
  - Returns system and role prompts configured for each task type.
- **`POST /api/rpc/get_app_list`**:
  - Returns all registered multi-tenant apps (`weargen`, `ppp`).

---

## 3. Health & Diagnostic Endpoints
- **`GET /health`**: Returns system uptime, database connectivity status, and server time.
- **`GET /`**: Returns API root welcome and system version badge.
