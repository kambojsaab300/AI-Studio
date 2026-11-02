# AI Studio: Troubleshooting (error ka karan aur fix)

Jab koi error aaye, pehle table mein symptom dhoondhein. Wahan karan aur fix likha hai.
Pura system kaise chalta hai, ye `FLOW.md` mein hai. Setup ke liye `HANDOFF.md` padhein.

---

## 1. Worker (browser ya Canvas) se related

| Symptom | Karan | Fix |
|---|---|---|
| Worker "Offline" dikhata hai | Worker tab khula nahi, ya connect nahi hua | Worker page khulne par apne aap connect hota hai. Connect button header mein hai. Log panel dekhein. |
| `Method doesn't allow unregistered callers ... Please use API Key` | Gemini ko key nahi mili (`GEMINI_API_KEY` khaali hai) | Canvas mein chalayein (wahan key milti hai), ya key localStorage mein daalein (`gemini_api_key`), ya code mein hardcode karein |
| Worker paused ho gaya, Resume nahi hota | `failTask` ne key ki error ko "key problem" maana aur `autoPause` chala | Admin Workers screen par "Resume" dabayein. Key theek karein. |
| `Image model nahi hai: gemini-3.1-flash-image-preview` | Task purane model se bana, ye model ab database mein image model nahi hai | Naya task `gemini-2.5-flash-image-preview` se banayein. Purane failed tasks delete karein. |
| Task "pending" hi rehta hai, worker nahi uthata | Worker ke browser mein kick nahi chal raha (key, catalog ya config load nahi), ya realtime band hai aur fallback timer lamba hai | Worker tab reload karein. Log dekhein. Admin Settings mein `fallback_sec` 30 rakhein. |
| `Realtime band hai, timer se chalega: WebSocket not available ... not allowed in Canvas` | Canvas (preview) WebSocket block karta hai | Ye normal hai. Worker timers se chalta hai. Normal browser (localhost) mein realtime chalega. |
| `Objects are not valid as a React child` | Ek React element ko text ki jagah render kiya gaya | Abhi tak exact line nahi mili. Error kis screen par aaya, ye batayein. |
| Worker page khaali ya `Images` export error | lucide-react mein `Images` icon nahi hai | Worker mein `ImageIcon` use karein (fix ho chuka hai) |
| `Cannot access 'loadTasks' before initialization` | Effect function se pehle use ho raha tha | Effect `loadTasks` ke neeche rakhein (fix ho chuka hai) |
| `Cannot read properties` / kuch fail bina error ke | Log panel mein dekhein | Log ka text bhejein |

## 2. Admin app se related

| Symptom | Karan | Fix |
|---|---|---|
| Admin screen blank | React error (kisi variable ka pehle use) | Browser console (F12) ka pehla error dekhein |
| Refresh par logout ho jata hai | Admin page khulne par connect nahi hota tha | Ab page khulte hi connect hota hai (fix ho chuka hai). Login ek baar karein. |
| "Ye account admin nahi hai" | Login user `ai_studio_admins` mein nahi hai | SQL chalayein (neeche "Admin banana") |
| Login ke baad kuch nahi dikhta | Session ya admin role ka issue | Refresh button dabayein, phir console dekhein |
| Results list khaali | Tasks abhi nahi bane ya worker ne process nahi kiya | Worker online hai ya nahi, dekhein |

## 3. Customer app se related

| Symptom | Karan | Fix |
|---|---|---|
| "Account banao" mein `Email address is invalid` | Supabase auth settings ya domain block | Supabase dashboard > Authentication > Users > Add user se user banayein |
| Task banane par "Ye kaam is app se nahi banaya ja sakta" | Task type catalog mein customer ko nahi dikhta ya band hai | Admin Tools screen > Kaam list mein "Chalu" aur "Customer ko dikhe" check karein |
| "Pehle login karo" | Login nahi hua | Login karein |
| "Aaj ka limit khatam" | Customer ka daily limit | Admin Settings mein limit badlein |
| "Maintenance" message | Maintenance mode on hai | Admin Settings mein maintenance off karein |

## 4. Database (SQL) se related

| Symptom | Karan | Fix |
|---|---|---|
| `cannot drop columns from view` (setup run mein) | Views ka column list badla | Setup file mein views pehle drop hote hain (fix ho chuka hai) |
| `cannot change return type of existing function` | Function ka return type badla | Setup mein function pehle drop hota hai (fix ho chuka hai) |
| `violates check constraint ai_studio_prompts_task_type_check` | Naya prompt row purane fixed list ke saath | Constraint pehle hat chuka hai, prompts ab catalog se linked hain (fix ho chuka hai) |
| Email alerts nahi aate | pg_cron ya pg_net on nahi, ya Brevo key/sender galat | Database > Extensions mein pg_cron, pg_net on karein. Admin Settings mein Brevo key aur sender check karein. |

---

## 5. Common fixes (ek jagah)

### Admin banana (existing user ko)
```sql
insert into public.ai_studio_admins (user_id)
select id from auth.users where email = 'mohit@gmail.com'
on conflict (user_id) do nothing;
```
User pehle Supabase dashboard > Authentication > Users > Add user se banaya hona chahiye.

### Worker ke tasks saaf karna
Admin Workers screen par:
- "Sab atke tasks wapas pending": stuck tasks pending mein.
- "Sab failed tasks delete": failed tasks hatane ke liye.
- Har worker ke liye bhi buttons hain.

### Gemini key browser mein daalna (worker ya Gif AI file)
Browser ke F12 > Console mein:
```js
localStorage.setItem('gemini_api_key', 'AIza...apni-key...')
```
Ye sirf us address par save hoti hai jahan page chal raha hai.

### Model list dekhna
```sql
select model_id, kind, enabled from ai_studio_models where kind is not null;
```

### Worker online hai ya nahi
```sql
select worker_id, now() - last_seen as age, paused, tools from ai_studio_workers order by last_seen desc;
```
`age` 60 sec se kam ho to worker live hai.

### Tasks ki state dekhna
```sql
select id, status, task_type, model, worker_id, error, created_at
from ai_studio_tasks order by id desc limit 10;
```

---

## 6. Ab tak kya badla (short history)

- **Database:** `db\ai_studio_setup.sql` ek file mein sab parts ke saath. Catalog, prompts, roles, tools, engine, aur v2 (model list, timers, clean-up, key column ke bina config).
- **Worker:** Canvas artifact ke roop mein publish (`preview\worker-artifact.html`). Key `GEMINI_API_KEY` constant hai, khaali. Canvas wahan key deta hai.
- **Admin:** Task banao, Workers, Tools, Features, prompts, settings, results list, Refresh button. Page khulte hi connect.
- **Customer:** brush edit, face swap, family, couple, per-photo, product, poses, OCR, poster, logo, etc. Model list database se.
- **Gif AI Promt Upload new.jsx:** Gemini key localStorage se, field optional, use se pehle check.
- **Preview:** `preview\` folder mein Vite config aur teeno pages (customer, admin, worker). Command `E:\Mohit\photo tool\AI Studio\preview` se.

Naya error aaye to uska message aur kaunsa page (worker, admin, customer) bhej dein.
