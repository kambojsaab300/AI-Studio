// ============================================================
// AI Studio: Dedicated App-Level API Service
// Standardized client layer for Multi-App Task Processing
// Supports standalone apps, 3rd party clients, and SDK usage
// ============================================================

import { API, TABLES } from './config.js';

export class AppService {
    constructor(client) {
        this.client = client;
        this._appCache = new Map();
        this._toolsCache = new Map();
    }

    /**
     * List all registered and active client apps (e.g. weargen, ppp, etc.)
     */
    async listApps() {
        try {
            // First attempt: standard apps table
            const { data, error } = await this.client
                .from(TABLES.APPS)
                .select('*')
                .order('sort');

            if (!error && Array.isArray(data) && data.length > 0) {
                return { data, error: null };
            }

            // Fallback attempt: get_app_list RPC
            const rpcRes = await this.client.rpc(API.GET_APPS);
            if (!rpcRes.error && Array.isArray(rpcRes.data)) {
                return { data: rpcRes.data, error: null };
            }

            return { data: [], error: error || rpcRes.error };
        } catch (err) {
            return { data: [], error: { message: err.message } };
        }
    }

    /**
     * Get single App details along with assigned tool task_types
     */
    async getApp(appId) {
        if (!appId) {
            return { data: null, error: { message: 'appId parameter is required' } };
        }

        try {
            // Fetch app metadata and assigned tasks concurrently
            const [appRes, linksRes] = await Promise.all([
                this.client.from(TABLES.APPS).select('*').eq('app_id', appId).single(),
                this.client.from(TABLES.APP_TASKS).select('task_type').eq('app_id', appId)
            ]);

            if (appRes.error) {
                // If single fails, try listing all
                const { data: all } = await this.listApps();
                const found = all?.find(a => a.app_id === appId);
                if (found) {
                    const taskTypes = found.task_types || [];
                    const result = { ...found, task_types: taskTypes };
                    this._appCache.set(appId, result);
                    return { data: result, error: null };
                }
                return { data: null, error: appRes.error };
            }

            const taskTypes = linksRes.data ? linksRes.data.map(l => l.task_type) : [];
            const result = {
                ...appRes.data,
                task_types: taskTypes
            };

            this._appCache.set(appId, result);
            return { data: result, error: null };
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    }

    /**
     * Get only the Catalog tools assigned to this specific App
     */
    async getAppTools(appId) {
        try {
            const [appRes, catRes] = await Promise.all([
                this.getApp(appId),
                this.client.from(TABLES.CATALOG).select('*').order('sort')
            ]);

            if (appRes.error) return { data: [], error: appRes.error };
            if (catRes.error) return { data: [], error: catRes.error };

            const assignedSet = new Set(appRes.data.task_types || []);
            const assignedCatalog = (catRes.data || []).filter(item => 
                item.enabled && assignedSet.has(item.task_type)
            );

            this._toolsCache.set(appId, assignedCatalog);
            return { data: assignedCatalog, error: null };
        } catch (err) {
            return { data: [], error: { message: err.message } };
        }
    }

    /**
     * Strict API-Level Validation:
     * Checks if the app is active and if the requested tool is assigned to it
     */
    async validateTaskForApp(appId, taskType) {
        if (!appId) {
            return { valid: false, error: 'App ID is required' };
        }
        if (!taskType) {
            return { valid: false, error: 'Task type (AI tool) is required' };
        }

        const { data: app, error } = await this.getApp(appId);
        if (error || !app) {
            return { valid: false, error: `App "${appId}" not found in system` };
        }
        if (!app.enabled) {
            return { valid: false, error: `App "${app.label || appId}" is currently disabled by Admin` };
        }

        const allowed = Array.isArray(app.task_types) && app.task_types.includes(taskType);
        if (!allowed) {
            return { 
                valid: false, 
                error: `Tool "${taskType}" is not assigned to App "${app.label || appId}". Please assign it in Admin > Apps dashboard.` 
            };
        }

        return { valid: true, app };
    }

    /**
     * Core API: Submit Task for an App
     * Enforces app_id, validates permissions, and dispatches to queue
     */
    async createTask(appId, rawPayload) {
        try {
            const taskType = rawPayload?.task_type;

            // 1. Validate App & Tool assignment
            const check = await this.validateTaskForApp(appId, taskType);
            if (!check.valid) {
                return { success: false, taskId: null, error: { message: check.error } };
            }

            // 2. Prepare standardized payload with mandatory app_id tagging
            const payload = {
                ...rawPayload,
                app_id: appId,
                user_id: rawPayload.user_id || `${appId}_client_user`,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            // 3. Dispatch via RPC upload_ai_studio_task
            const { data, error } = await this.client.rpc(API.CREATE_TASK, { p_payload: payload });

            if (error) {
                // Fallback attempt: direct table insertion
                const { data: insData, error: insErr } = await this.client
                    .from(TABLES.TASKS)
                    .insert(payload);

                if (insErr) {
                    return { success: false, taskId: null, error: insErr };
                }

                const newId = Array.isArray(insData) && insData[0] ? insData[0].id : null;
                return { success: true, taskId: newId, error: null };
            }

            const taskId = typeof data === 'number' ? data : (data?.id || (Array.isArray(data) ? data[0]?.id : null));
            return { success: true, taskId, data, error: null };
        } catch (err) {
            return { success: false, taskId: null, error: { message: err.message } };
        }
    }

    /**
     * Fetch all tasks generated by this specific App
     */
    async listTasks(appId, { limit = 50, offset = 0, status = null } = {}) {
        if (!appId) {
            return { data: [], error: { message: 'appId parameter is required' } };
        }

        try {
            let query = this.client
                .from(TABLES.TASKS)
                .select('*')
                .eq('app_id', appId)
                .order('id', { ascending: false })
                .range(offset, offset + limit - 1);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error, count } = await query;
            return { data: data || [], error, count };
        } catch (err) {
            return { data: [], error: { message: err.message } };
        }
    }

    /**
     * Fetch a single task by ID, verifying app ownership
     */
    async getTask(appId, taskId, { columns = '*' } = {}) {
        if (!appId || !taskId) {
            return { data: null, error: { message: 'appId and taskId are required' } };
        }

        try {
            const { data, error } = await this.client
                .from(TABLES.TASKS)
                .select(columns)
                .eq('id', taskId)
                .eq('app_id', appId)
                .single();

            return { data, error };
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    }

    /**
     * Client Poller Helper (Optimized with lean column projection):
     * Polls only status, error, and output image to reduce network payload by 90%
     */
    async pollTaskUntilComplete(appId, taskId, { intervalMs = 2000, maxSeconds = 180, onProgress } = {}) {
        const start = Date.now();
        const timeoutMs = maxSeconds * 1000;
        const leanColumns = 'id,app_id,task_type,status,error,output_image_url,duration_ms,process_ms';

        while (Date.now() - start < timeoutMs) {
            const { data: task, error } = await this.getTask(appId, taskId, { columns: leanColumns });
            if (error || !task) {
                throw new Error(error?.message || 'Task not found');
            }

            if (typeof onProgress === 'function') {
                onProgress(task);
            }

            if (task.status === 'completed') {
                return task;
            }

            if (task.status === 'failed') {
                throw new Error(task.error || 'Task execution failed on worker');
            }

            await new Promise(r => setTimeout(r, intervalMs));
        }

        throw new Error(`Polling timed out after ${maxSeconds} seconds`);
    }

    /**
     * Generate ready-to-run API snippets for external apps (React, Node, Python, cURL)
     */
    getApiSnippets(appId, taskType = 'text_to_image', samplePayload = {}) {
        const apiUrl = this.client.apiUrl || 'https://aistudio.runasp.net';
        const token = 'YOUR_API_KEY_OR_TOKEN';

        const payloadObj = {
            app_id: appId,
            task_type: taskType,
            prompt: samplePayload.prompt || 'Professional studio photoshoot, sharp focus',
            model: samplePayload.model || 'gemini-2.5-flash-image',
            aspect_ratio: samplePayload.aspect_ratio || '1:1',
            input_image_url: samplePayload.input_image_url || null,
            user_id: `${appId}_user_1`,
            ...samplePayload
        };

        const jsonStr = JSON.stringify({ p_payload: payloadObj }, null, 2);

        return {
            curl: `curl -X POST "${apiUrl}/rest/v1/rpc/upload_ai_studio_task" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${jsonStr.replace(/'/g, "'\\''")}'`,

            javascript: `// External Web or Node.js Client
async function runStudioTask() {
  const response = await fetch("${apiUrl}/rest/v1/rpc/upload_ai_studio_task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer ${token}"
    },
    body: JSON.stringify({
      p_payload: ${JSON.stringify(payloadObj, null, 6)}
    })
  });

  const taskId = await response.json();
  console.log("Task Submitted! Task ID:", taskId);

  // Poll task status:
  const taskRes = await fetch("${apiUrl}/rest/v1/ai_studio_tasks?id=eq." + taskId + "&app_id=eq.${appId}");
  const taskData = await taskRes.json();
  console.log("Status:", taskData[0]?.status, "Result Image:", taskData[0]?.output_image_url);
}`,

            python: `import requests, time

API_URL = "${apiUrl}"
TOKEN = "${token}"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# 1. Create Task for App "${appId}"
payload = {
    "p_payload": ${JSON.stringify(payloadObj, null, 4).replace(/null/g, 'None')}
}

res = requests.post(f"{API_URL}/rest/v1/rpc/upload_ai_studio_task", json=payload, headers=HEADERS)
task_id = res.json()
print(f"Task Created! ID: {task_id}")

# 2. Poll until completed
for _ in range(30):
    time.sleep(2)
    poll_res = requests.get(f"{API_URL}/rest/v1/ai_studio_tasks?id=eq.{task_id}&app_id=eq.${appId}", headers=HEADERS)
    task = poll_res.json()[0]
    print(f"Task status: {task['status']}")
    if task['status'] == 'completed':
        print(f"Success! Output Image: {task['output_image_url']}")
        break
    elif task['status'] == 'failed':
        print(f"Failed: {task['error']}")
        break`
        };
    }
}

export function createAppService(client) {
    return new AppService(client);
}
export default AppService;
