import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Globe, ShieldCheck, Play, ArrowRight } from 'lucide-react';
import { API_URL, API_KEY } from '../../api/config';

export function AppApiModal({ isOpen, onClose, appId, appLabel, selectedTool, samplePayload }) {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('curl'); // 'curl' | 'js' | 'python' | 'json'
    const [copied, setCopied] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);

    const taskType = selectedTool?.task_type || 'text_to_image';
    const toolLabel = selectedTool?.label || 'Text to Image';

    const payloadObj = {
        app_id: appId,
        task_type: taskType,
        prompt: samplePayload?.prompt || 'Professional fashion studio photoshoot, ultra realistic, 4k',
        model: samplePayload?.model || 'gemini-2.5-flash-image',
        aspect_ratio: samplePayload?.aspect_ratio || '1:1',
        image_size: samplePayload?.image_size || '1K',
        input_image_url: samplePayload?.input_image_url || null,
        face_image_url: samplePayload?.face_image_url || null,
        extra_image_urls: samplePayload?.extra_image_urls || null,
        user_id: `${appId}_api_user`,
        batch_count: 1
    };

    const endpointUrl = `${API_URL}/rest/v1/rpc/upload_ai_studio_task`;
    const tasksUrl = `${API_URL}/rest/v1/ai_studio_tasks?id=eq.{TASK_ID}&app_id=eq.${appId}`;

    const snippets = {
        curl: `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${API_KEY}" \\
  -d '${JSON.stringify({ p_payload: payloadObj }, null, 2)}'`,

        js: `// ⚡ Universal JavaScript / Node.js / React Client
async function generateWithApp() {
  const API_URL = "${API_URL}";
  const API_KEY = "${API_KEY}";

  // 1. Submit AI Generation Task for App: "${appId}"
  const res = await fetch(\`\${API_URL}/rest/v1/rpc/upload_ai_studio_task\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${API_KEY}\`
    },
    body: JSON.stringify({
      p_payload: ${JSON.stringify(payloadObj, null, 6)}
    })
  });

  const taskId = await res.json();
  console.log("⚡ Task Created Successfully! Task ID:", taskId);

  // 2. Poll Task Status until Worker completes it
  const checkStatus = async () => {
    const poll = await fetch(\`\${API_URL}/rest/v1/ai_studio_tasks?id=eq.\${taskId}&app_id=eq.${appId}\`, {
      headers: { "Authorization": \`Bearer \${API_KEY}\` }
    });
    const tasks = await poll.json();
    const task = tasks[0];

    if (task?.status === "completed") {
      console.log("🎉 Result Image URL:", task.output_image_url);
      return task.output_image_url;
    } else if (task?.status === "failed") {
      console.error("❌ Generation Failed:", task.error);
      return null;
    } else {
      console.log("⏳ Processing... status:", task?.status);
      setTimeout(checkStatus, 2000);
    }
  };

  checkStatus();
}`,

        python: `import requests, time

API_URL = "${API_URL}"
API_KEY = "${API_KEY}"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 1. Dispatch Task to App "${appId}"
payload = {
    "p_payload": ${JSON.stringify(payloadObj, null, 4).replace(/null/g, 'None')}
}

print("Submitting task to ${appLabel} API...")
response = requests.post(f"{API_URL}/rest/v1/rpc/upload_ai_studio_task", json=payload, headers=HEADERS)
task_id = response.json()
print(f"Task dispatched successfully! ID: {task_id}")

# 2. Poll result
for i in range(60):
    time.sleep(2)
    poll = requests.get(f"{API_URL}/rest/v1/ai_studio_tasks?id=eq.{task_id}&app_id=eq.${appId}", headers=HEADERS)
    tasks = poll.json()
    if tasks:
        task = tasks[0]
        status = task.get("status")
        print(f"Status check #{i+1}: {status}")
        if status == "completed":
            print(f"Result Image: {task.get('output_image_url')}")
            break
        elif status == "failed":
            print(f"Failed: {task.get('error')}")
            break`,

        json: JSON.stringify({
            endpoint: endpointUrl,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            payload: {
                p_payload: payloadObj
            }
        }, null, 2)
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(snippets[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTestPing = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch(`${API_URL}/rest/v1/ai_studio_apps?app_id=eq.${appId}&select=*`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const data = await res.json();
            if (res.ok && data.length > 0) {
                setTestResult({
                    success: true,
                    message: `✅ API Connected! App "${data[0].label}" is active and ready on MonsterASP.`
                });
            } else {
                setTestResult({
                    success: false,
                    message: `⚠️ API Connected but App "${appId}" returned: ${JSON.stringify(data)}`
                });
            }
        } catch (err) {
            setTestResult({ success: false, message: `❌ Connection error: ${err.message}` });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#0e1320] border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#080b12]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-extrabold text-white">
                                    {appLabel} • API Integration & Developer SDK
                                </h3>
                                <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                    app_id: {appId}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Is API endpoint ko aap kisi bhi external app, mobile app, website ya backend script se directly call kar sakte hain.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* API Info Badges */}
                <div className="px-5 py-3 bg-[#0a0d17] border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span className="bg-slate-900 text-slate-300 px-2 py-1 rounded-lg border border-slate-800">
                            POST /rest/v1/rpc/upload_ai_studio_task
                        </span>
                        <span className="bg-amber-400/10 text-amber-300 px-2 py-1 rounded-lg border border-amber-400/20">
                            Active Tool: {toolLabel}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleTestPing}
                        disabled={testing}
                        className="h-7 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-slate-800 transition-colors disabled:opacity-50"
                    >
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>{testing ? 'Testing...' : 'Test API Ping'}</span>
                    </button>
                </div>

                {/* Test Result Message */}
                {testResult && (
                    <div className={`px-5 py-2.5 text-xs font-mono border-b ${
                        testResult.success 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    }`}>
                        {testResult.message}
                    </div>
                )}

                {/* Code Snippet Tabs */}
                <div className="flex items-center justify-between px-5 pt-4 bg-[#0e1320]">
                    <div className="flex items-center gap-1 bg-[#080b12] p-1 rounded-xl border border-slate-800 text-xs font-bold">
                        {[
                            { id: 'curl', label: 'cURL' },
                            { id: 'js', label: 'JavaScript / Node' },
                            { id: 'python', label: 'Python (requests)' },
                            { id: 'json', label: 'REST Schema' }
                        ].map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    activeTab === t.id 
                                        ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm' 
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-800 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Code</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Code View Body */}
                <div className="p-5 flex-1 overflow-y-auto">
                    <pre className="bg-[#05070c] border border-slate-800/90 rounded-2xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-amber-400 selection:text-black">
                        {snippets[activeTab]}
                    </pre>

                    {/* How it works guidance */}
                    <div className="mt-4 bg-[#080b12] border border-slate-800/70 rounded-2xl p-4 space-y-2 text-xs">
                        <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span>API Level Security & Validation</span>
                        </h4>
                        <ul className="text-slate-400 space-y-1 list-disc list-inside leading-relaxed text-[11px]">
                            <li>
                                Har request me <code className="text-amber-300">app_id: "{appId}"</code> mandatory hai.
                            </li>
                            <li>
                                API backend verify karta hai ki <code className="text-amber-300">{taskType}</code> tool is app ko assigned hai ya nahi.
                            </li>
                            <li>
                                Task generate hone ke baad real-time status check karne ke liye: <code className="text-slate-300">GET /rest/v1/ai_studio_tasks?id=eq.&#123;id&#125;&app_id=eq.{appId}</code>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-[#080b12] flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                        Host: {API_URL}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AppApiModal;
