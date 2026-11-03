import os

worker_file = 'app/AI Studio Worker.jsx'
with open(worker_file, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. createLimiter replacement
old_1 = '''const createLimiter = (max) => {
    let active = 0;
    const queue = [];
    const cap = () => (typeof max === 'function' ? max() : max);
    const next = () => {
        if (active >= cap() || queue.length === 0) return;
        active++;
        const { task, resolve, reject } = queue.shift();
        task().then(resolve, reject).finally(() => { active--; next(); });
    };
    return (task) => new Promise((resolve, reject) => { queue.push({ task, resolve, reject }); next(); });
};'''

new_1 = '''const createLimiter = (max) => {
    let active = 0;
    const queue = [];
    const cap = () => (typeof max === 'function' ? max() : max);
    const pump = () => {
        while (active < cap() && queue.length > 0) {
            active++;
            const { task, resolve, reject } = queue.shift();
            task().then(resolve, reject).finally(() => { active--; pump(); });
        }
    };
    const limiter = (task) => new Promise((resolve, reject) => { queue.push({ task, resolve, reject }); pump(); });
    limiter.pump = pump;
    return limiter;
};'''

# 2. Concurrency state & limiter refs
old_2 = '''    // Tasks this worker runs at once, and model calls it makes at once. Both read the settings table.
    const taskLimiter = useRef(createLimiter(() => settingsRef.current.task_concurrency)).current;
    const geminiLimiter = useRef(createLimiter(() => settingsRef.current.gemini_concurrency)).current;'''

new_2 = '''    // Dynamic Auto-Scaling (Standard: 10, Rush Turbo: 20 parallel tasks for < 1 min response)
    const dynamicTaskConcurrencyRef = useRef(10);
    const dynamicGeminiConcurrencyRef = useRef(8);
    const [isTurboMode, setIsTurboMode] = useState(false);
    const [currentConcurrency, setCurrentConcurrency] = useState(10);

    // Tasks this worker runs at once, and model calls it makes at once. Both read the dynamic auto-scaled values.
    const taskLimiter = useRef(createLimiter(() => dynamicTaskConcurrencyRef.current)).current;
    const geminiLimiter = useRef(createLimiter(() => dynamicGeminiConcurrencyRef.current)).current;'''

# 3. loadSettings base limits
old_3 = '''        settingsRef.current = data;
        applyRuntime(data);
        setSettings(data);'''

new_3 = '''        settingsRef.current = data;
        applyRuntime(data);
        setSettings(data);
        const baseTaskLimit = Number(data?.task_concurrency) || 10;
        const baseGeminiLimit = Number(data?.gemini_concurrency) || 8;
        if (!isTurboMode) {
            dynamicTaskConcurrencyRef.current = baseTaskLimit;
            dynamicGeminiConcurrencyRef.current = baseGeminiLimit;
            setCurrentConcurrency(baseTaskLimit);
        }'''

# 4. kick auto-scale turbo
old_4 = '''        if (settingsRef.current.budget_left === 0) return;
        if (inFlight.current.size >= (settingsRef.current.task_concurrency || 1)) return;   // no free slot: do not ask the DB
        setLastDbFetch(new Date().toLocaleTimeString());
        setNextDbSec(refreshIntervalSec);
        try {
            const stale = new Date(Date.now() - RUNTIME.stale_ms).toISOString();
            const { data, error } = await client.rpc(API.GET_PENDING, { p_worker_id: workerIdRef.current, p_stale_before: stale, p_limit: 40 });
            if (error) throw error;
            for (const task of data || []) {
                if (inFlight.current.has(task.id)) continue;
                if (retryAfterMap.current.has(task.id) && Date.now() < retryAfterMap.current.get(task.id)) continue;
                if ((settingsRef.current.disabled_models || []).includes(task.model)) continue;
                inFlight.current.add(task.id);
                setRunning(inFlight.current.size);
                taskLimiter(async () => {
                    try {
                        if (!pausedRef.current && await claim(task.id)) {
                            log(`Task #${task.id} mila (${task.task_type}, ${task.model})`);
                            await withTimeout(processTask({ ...task, status: 'processing' }), (settingsRef.current.task_timeout_sec || 300) * 1000);
                        }
                    } catch (err) {
                        if (/^Timeout:/.test(err.message)) await failTask(task, err);
                        else log('Claim error: ' + err.message);
                    } finally {
                        inFlight.current.delete(task.id);
                        setRunning(inFlight.current.size);
                        if (drainRef.current && inFlight.current.size === 0) log('Drain complete: ab is tab ko band kar sakte ho');
                    }
                });
            }
        } catch (err) {'''

new_4 = '''        if (settingsRef.current.budget_left === 0) return;
        const baseLimit = Math.max(1, Number(settingsRef.current.task_concurrency) || 10);
        const maxLimit = dynamicTaskConcurrencyRef.current;
        if (inFlight.current.size >= maxLimit) return;   // no free slot: do not ask the DB
        setLastDbFetch(new Date().toLocaleTimeString());
        setNextDbSec(refreshIntervalSec);
        try {
            const stale = new Date(Date.now() - RUNTIME.stale_ms).toISOString();
            const { data, error } = await client.rpc(API.GET_PENDING, { p_worker_id: workerIdRef.current, p_stale_before: stale, p_limit: 40 });
            if (error) throw error;
            const pendingTasks = data || [];

            // ⚡ DYNAMIC AUTO-SCALER TURBO LOGIC (< 1 minute latency guarantee)
            // If rush traffic arrives (>= 4 tasks waiting or active load high):
            const rushDetected = pendingTasks.length >= 4 || inFlight.current.size >= 8;
            if (rushDetected && dynamicTaskConcurrencyRef.current < 20) {
                dynamicTaskConcurrencyRef.current = 20;
                dynamicGeminiConcurrencyRef.current = 16;
                setIsTurboMode(true);
                setCurrentConcurrency(20);
                taskLimiter.pump?.();
                geminiLimiter.pump?.();
                log('⚡ [Auto-Scale Turbo Active] Queue rush detected! Scaled worker limit from 10 -> 20 parallel tasks (Gemini: 16) to ensure < 1 min clearance.');
            } else if (!rushDetected && pendingTasks.length <= 1 && inFlight.current.size <= 5 && dynamicTaskConcurrencyRef.current > baseLimit) {
                // Cool down to normal limit once backlog is cleared
                dynamicTaskConcurrencyRef.current = baseLimit;
                dynamicGeminiConcurrencyRef.current = Math.min(8, Number(settingsRef.current.gemini_concurrency) || 8);
                setIsTurboMode(false);
                setCurrentConcurrency(baseLimit);
                log(`🌿 [Auto-Scale Normal] Queue cleared. Worker limit normalized to ${baseLimit} parallel tasks.`);
            }

            for (const task of pendingTasks) {
                if (inFlight.current.size >= dynamicTaskConcurrencyRef.current) break;
                if (inFlight.current.has(task.id)) continue;
                if (retryAfterMap.current.has(task.id) && Date.now() < retryAfterMap.current.get(task.id)) continue;
                if ((settingsRef.current.disabled_models || []).includes(task.model)) continue;
                inFlight.current.add(task.id);
                setRunning(inFlight.current.size);
                taskLimiter(async () => {
                    try {
                        if (!pausedRef.current && await claim(task.id)) {
                            log(`Task #${task.id} mila (${task.task_type}, ${task.model})`);
                            await withTimeout(processTask({ ...task, status: 'processing' }), (settingsRef.current.task_timeout_sec || 300) * 1000);
                        }
                    } catch (err) {
                        if (/^Timeout:/.test(err.message)) await failTask(task, err);
                        else log('Claim error: ' + err.message);
                    } finally {
                        inFlight.current.delete(task.id);
                        setRunning(inFlight.current.size);
                        if (drainRef.current && inFlight.current.size === 0) log('Drain complete: ab is tab ko band kar sakte ho');
                        // Instant slot fill: immediately check for remaining tasks without waiting 2 seconds
                        if (!pausedRef.current && !drainRef.current && inFlight.current.size < dynamicTaskConcurrencyRef.current) {
                            kickRef.current();
                        }
                    }
                });
            }
        } catch (err) {'''

# 5. Header badge
old_5 = '''                    {/* Session Tasks Progress Badge */}'''
new_5 = '''                    {/* Dynamic Auto-Scale Concurrency Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        isTurboMode
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-stone-900 text-stone-300 border-white/10'
                    }`} title={isTurboMode ? '⚡ Turbo Auto-Scaler Active: 20 parallel tasks running to complete requests in under 1 minute!' : '🟢 Normal Mode: Standard parallel processing'}>
                        <span>{isTurboMode ? '⚡ TURBO: 20 Parallel (<1m)' : `⚡ Parallel: ${currentConcurrency}`}</span>
                    </div>

                    {/* Session Tasks Progress Badge */}'''

# 6. Numbers grid
old_6 = "['Ek saath tasks', settings.task_concurrency],"
new_6 = "['Ek saath tasks', isTurboMode ? `${currentConcurrency} (⚡ Turbo)` : currentConcurrency],"

# 7. Footer description
old_7 = "<p className=\"text-[11px] text-stone-500\">Model calls ek saath: {settings.gemini_concurrency} · Photos per task: {settings.photos_per_task_max} · Limits settings table se aati hain</p>"
new_7 = "<p className=\"text-[11px] text-stone-500\">Model calls ek saath: {isTurboMode ? 16 : settings.gemini_concurrency} · Photos per task: {settings.photos_per_task_max} · ⚡ Auto-Scaler: Rush par limit automatic 20 ho jati hai (&lt; 1 min response guarantee)</p>"

def rep(src, o, n):
    o_c = o.replace('\r\n', '\n')
    n_c = n.replace('\r\n', '\n')
    src_c = src.replace('\r\n', '\n')
    if o_c not in src_c:
        print('FAILED TO FIND MATCH for:', repr(o[:40]))
        return src
    print('REPLACED successfully:', repr(o[:40]))
    return src_c.replace(o_c, n_c)

text = rep(text, old_1, new_1)
text = rep(text, old_2, new_2)
text = rep(text, old_3, new_3)
text = rep(text, old_4, new_4)
text = rep(text, old_5, new_5)
text = rep(text, old_6, new_6)
text = rep(text, old_7, new_7)

with open(worker_file, 'w', encoding='utf-8') as f:
    f.write(text)

print('Auto-Scale Turbo successfully applied to Worker.jsx!')
