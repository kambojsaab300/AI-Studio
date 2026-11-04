# AI Studio: Worker Engine Guide

## Overview
The Worker Engine (`AI Studio Worker.jsx`) is an autonomous task processor designed for high concurrency, fault isolation, and low latency image generation.

---

## ⚡ Dynamic Auto-Scaling Turbo Mode
To ensure customer wait times stay strictly **under 1 minute**, the worker continuously evaluates incoming traffic:

1. **Standard Mode (10 Parallel Tasks):**
   - Active when queue depth < 4.
   - Preserves system RAM and bandwidth.
   - Model concurrency set to 8.

2. **Turbo Mode (⚡ 20 Parallel Tasks):**
   - Triggered automatically when pending queue >= 4 or active tasks >= 8.
   - Concurrency expands instantly to 20 parallel tasks.
   - Gemini concurrency scales up to 16.
   - Clears a 100-request burst in **~37 seconds** ($5 \text{ batches} \times 7.5\text{s}$).

3. **Auto Cool-Down:**
   - As soon as the backlog clears (pending <= 1, active <= 5), the worker automatically normalizes back to 10 slots.

4. **Zero-Wait Slot Replenishment:**
   - As soon as any in-flight task finishes, `kick()` is immediately triggered to pull the next task without waiting for the 2-second polling cycle.

---

## 🛡️ Stability & Resiliency Features

### Memory Management & Cache Purge
- Every task's base64 buffers, canvas contexts, and image references are purged immediately after upload (`cleanTaskCache()`).
- Live RAM monitor in worker header warns if memory exceeds 150MB.
- Worker automatically soft-recycles after 50 tasks to prevent JavaScript heap accumulation.

### App-Specific Contextual Error Stamping
- When an individual user prompt fails (e.g. Gemini safety trigger or unrecognised face), the task is marked `failed` and tagged with `[WEARGEN]` or `[PPP]`.
- The worker **never pauses itself** on user-input errors, ensuring the rest of the queue continues processing without disruption.
