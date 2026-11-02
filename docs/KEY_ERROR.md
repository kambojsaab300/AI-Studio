# Gemini key error: karan aur fix

## Error ka message

Ye messages key ki problem batate hain:
- `Method doesn't allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API.`
- `API key not valid. Please pass a valid API key.`
- Koi bhi error jisme `API key`, `API_KEY`, `PERMISSION_DENIED`, ya HTTP 400/401/403 likha ho.

## Karan

Gemini har request mein ek key maangta hai (`?key=...` URL mein). Ye key khaali hai, ya galat hai, ya browser mein nahi hai, isliye Gemini request reject karta hai.

Worker mein key kahan se aati hai, ye code ke hisaab se alag hai:
- **Canvas (artifact) wala worker:** `GEMINI_API_KEY = ""`. Key Canvas khud deta hai. Aapke PC par ye khaali rehti hai.
- **Localhost worker (aapke PC par):** key browser ke `localStorage` mein `gemini_api_key` naam se honi chahiye.

## Fix: ek option chunein

### Option 1: Canvas mein chalayein (abhi ka setup)
- Worker artifact kholein: https://claude.ai/artifact/QgZ5KTC13n2r3D2oyrd6Hp
- Key Canvas khud deta hai, aur aapko kuch nahi daalna.
- Shart: artifact tab khula rahe.

### Option 2: Apne PC par localStorage se
Worker page (http://localhost:5173/worker.html) ke F12 > Console mein:

```js
localStorage.setItem('gemini_api_key', 'AIza...apni-key...')
```

Phir page reload karein. Worker ke form mein bhi key daal kar **Save Configuration** dabaya ja sakta hai.

### Option 3: Code mein hardcode
`app\AI Studio Worker.jsx` mein:

```js
const GEMINI_API_KEY = "AIza...apni-key...";
```

Ye key file mein dikhegi, isliye sirf apni machine par rakhein.

## Key sahi hai ya nahi: check

Key ka format: `AIza` se shuru hoti hai, aur uske baad lambi string hoti hai.

Browser console mein:

```js
localStorage.getItem('gemini_api_key')
```

- `null` aaye: key set nahi hai. Option 2 karein.
- Kuch aaye: key set hai. Phir bhi error aaye, to key galat ho sakti hai ya Google AI Studio mein billing ya permission check karein.

## Worker pause ho gaya?

Key error par worker khud pause ho jata hai (ye safety ke liye hai). Admin app ke Workers screen par **Resume** dabayein, key theek karne ke baad.

## Ek zaroori baat

Key kisi chat, file, ya screenshot mein share na karein. Agar kabhi share ho gayi, to Google AI Studio mein usse rotate (naya key banayein) kar dein.
