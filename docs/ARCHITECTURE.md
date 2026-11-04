# AI Studio: System Architecture

## Overview
AI Studio is an enterprise AI image generation and photography transformation system powered by a high-performance **ASP.NET Core 8 Web API**, **Microsoft SQL Server**, and a modern **React (Tailwind CSS)** frontend with an autonomous **Dynamic Auto-Scaling Worker Engine**.

---

## 🏛️ High-Level System Architecture

```mermaid
graph TD
    subgraph Clients ["Frontend Client Applications (React + Tailwind)"]
        AdminUI["Admin Control Panel (/admin)"]
        CustomerUI["Customer Portals (/customer, /app/weargen, /app/ppp)"]
        WorkerUI["Worker Engine Preview & Monitor (/worker)"]
    end

    subgraph Backend [".NET 8.0 Web API (MonsterASP IIS)"]
        ApiGate["ASP.NET Core 8 Web API"]
        RestCtrl["REST Controller (/api/rest/{table})"]
        RpcCtrl["RPC Controller (/api/rpc/{procedure})"]
        AuthCtrl["Auth & JWT Controller (/api/auth)"]
        HealthCtrl["Health Endpoint (/health)"]
        DbService["ADO.NET Database Service (Dapper)"]
    end

    subgraph Storage ["Database & Cloud Assets"]
        MSSQL[("Microsoft SQL Server (MonsterASP db77541)")]
        Cloudinary["Cloudinary CDN (draaqjcre)"]
        ImgBB["ImgBB Image Host"]
    end

    subgraph AI ["Google Gemini AI"]
        GeminiFlash["Gemini 2.5 Flash / Flash Preview"]
        GeminiPro["Gemini Pro Vision / Imagen 3"]
    end

    Clients -->|HTTP / REST JSON| ApiGate
    ApiGate --> RestCtrl
    ApiGate --> RpcCtrl
    ApiGate --> AuthCtrl
    ApiGate --> HealthCtrl
    RestCtrl --> DbService
    RpcCtrl --> DbService
    AuthCtrl --> DbService
    DbService -->|High-Speed ADO.NET SQL| MSSQL

    WorkerUI -->|Claim Pending Tasks| ApiGate
    WorkerUI -->|REST POST Call| GeminiFlash
    WorkerUI -->|REST POST Call| GeminiPro
    WorkerUI -->|Upload Base64 Output| Cloudinary
    WorkerUI -->|Upload Base64 Output| ImgBB
    WorkerUI -->|Save Finished Task & Output URLs| ApiGate
```

---

## 🧩 Architectural Layers

### 1. Presentation Layer (Frontend Clients)
- **Admin Dashboard (`AI Studio Admin.jsx`)**: System monitoring, workers oversight, live task queue, tool catalog, app mappings, global settings, and audit logs.
- **Customer Portals (`AI Studio Customer.jsx`, `StandaloneAppPage.jsx`)**: Multi-app scoped interfaces for WearGen and PPP customers. Supports one-click photo creation, multi-pose batches, raw JSON inspector, and conversational chat.
- **Worker Engine UI (`AI Studio Worker.jsx`)**: Autonomous browser or server worker with live memory monitoring, queue claiming, Gemini dispatch, and Cloudinary uploads.

### 2. Application & API Layer (ASP.NET Core 8)
- **Host**: Windows Server IIS on MonsterASP (`https://aistudio.runasp.net`).
- **REST Controller**: Translates client queries (`select`, `eq`, `order`, `limit`, `offset`) into parameterized SQL queries on tables.
- **RPC Controller**: Direct execution of business procedures (`upload_ai_studio_task`, `get_pending_for_worker`, `claim_ai_studio_task`, `worker_complete_task`, `worker_heartbeat`, `get_task_catalog`, etc.).
- **ADO.NET & Dapper**: Direct, lightweight database interaction delivering sub-15ms response times.

### 3. Data & Storage Layer
- **Database**: Microsoft SQL Server (`db77541.public.databaseasp.net`).
- **Media Hosting**: Cloudinary CDN with preset `ml_default` for reliable, permanent public image delivery.
- **AI Processing**: Google Generative Language API (Gemini models) for multimodal image generation and analysis.
