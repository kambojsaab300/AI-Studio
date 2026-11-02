# AI Studio: Client View

## What is AI Studio?

AI Studio makes photos and text with AI. The customer chooses what they want,
uploads photos, writes a short prompt, and gets the result. The admin controls
what is available, who works on what, and the daily limits.

**Apps:** one AI Studio serves several apps (for example WearGen and PPP). The customer picks the app first; the list of features then shows only that app's features. Every result shows which app it came from.

## What the customer can do

**Image size (for models that support it):** 0.5K, 1K, 2K or 4K. The admin decides which sizes each model supports.

### Photos (image)

| Feature | What it does | Photos needed |
|---|---|---|
| Prompt to photo | Makes a photo from a written description | None |
| Photo + prompt | Makes a new photo from your photo and your prompt | 1 |
| Face + style photo | Puts your face on a style or outfit photo | 2 |
| Face + style + prompt | Same, with your own instructions | 2 |
| Outfit change | Changes the clothes of a person | 2 |
| Outfit change with face | Keeps your face, changes the outfit | 3 |
| Background change | Changes the background, the person stays the same | 2 |
| Virtual try-on | Shows a product (dress, jewellery, bag) on a person | 2 |
| Product scene | Puts a product in a place (cafe, beach, studio) | 1 to 2 |
| Product catalog | Clean studio photo of a product | 1 |
| Project image | New visual from a design photo | 1 to 2 |
| Face swap | Puts your face on another photo, pose and clothes stay | 2 |
| Couple photo | One photo of a girl and a boy together | 2 |
| Family photo | One photo of family members (man, woman, baby, grandparents) | 2 to 6 |
| Photo edit (brush) | You paint the area to change, only that area changes | 1 |
| Hair change (brush) | Changes hair in the painted area | 1 |
| Shirt change (brush) | Changes the shirt in the painted area | 1 |
| Suit change (brush) | Changes the outfit into a suit | 1 |
| Background change (brush) | Changes only the painted background | 1 |
| Woman: earrings, nose pin, shoes, glasses (brush) | Adds or changes these in the painted area | 1 |
| Man: glasses, suit, shirt, jeans, shorts, shoes (brush) | Adds or changes these in the painted area | 1 |
| Pose change | Front, back, side, walking or sitting pose | 1 |
| Poster or banner | Makes a poster with the text you write | 0 to 1 |
| Logo or sticker | Makes a logo with a transparent background | 0 |
| Background remove | Cuts out the subject, transparent PNG | 1 |
| Photo restore | Makes an old or blurry photo clearer | 1 |
| Aspect extend | Makes a photo wider or taller without cutting it | 1 |
| Style transfer | Turns a photo into sketch, painting or cartoon | 1 |
| Mockup | Puts your design on a t-shirt, mug or bag | 2 |
| Product angles | Front, side, back, three-quarter and top views of one product | 1 |
| Same prompt on many photos | Up to 10 photos, the same prompt on each, one result per photo | 1 to 10 |

### Text

| Feature | What it does |
|---|---|
| Chat | Ask questions. Use the same chat name to continue a conversation. |
| Read a photo | Tells you what is in a photo |
| Read text (OCR) | Reads the text in a photo (bill, label, card) |
| Product tags | Gives colour, material, category and a short title for a product |
| Photo check | Says if a photo is blurred, too dark, or has unsuitable content |

## What the admin can do

| Area | What the admin controls |
|---|---|
| Tasks | Create a task (choose app, feature, photos, size). The new task appears at the bottom of a live list, with its status and how many seconds it took. "Dekho" opens the full detail. Results can be filtered by Pending, Processing, Completed and Failed, 10 per page. |
| Workers | See which workers are active (Active, Offline, or all), pause, resume, drain, set a limit per worker. A worker can also pause itself from its own screen. Only the admin can resume it. |
| Clean-up | Put stuck tasks back to pending, or delete failed tasks: for one worker or for all. Each step asks for confirmation. |
| Tools | Chat and image are separate tools. Each worker has its own tools. The admin can also change a feature's names and photo slots. |
| Worker work | Choose which features each worker runs |
| Features | Turn a feature on or off, show it to customers or hide it, and choose which app (WearGen, PPP, or both) shows it |
| Apps | Each app's feature list is set by the admin. A new app can be added in the database, with no new app code. |
| Family roles | Turn family roles on or off, add a new role (for example "uncle") |
| Prompts | Edit the instructions for each feature, and turn a feature's prompt off |
| Models | Turn each AI model on or off, and tick the image sizes (0.5K, 1K, 2K, 4K) and aspect ratios it supports. The model list is kept in the database, so a new model can be added without a new app. |
| Settings | Worker settings: limits, daily budget, customer daily limit, maintenance mode, face check level, photo size and quality, and how often the worker checks for work (fallback) and how often it reports it is alive (heartbeat) |
| Email alerts | Get an email when all workers are offline, the queue is full, or a worker pauses itself |
| Action log | A record of every change the admin makes |

## Safety and limits

- **Face check:** for face features, the result is checked. A weak match is made again.
- **Photo size:** photos are made smaller before they are stored, to save space.
- **Daily limits:** each customer can have a daily task limit. The Gemini budget can also be set for each day.
- **Maintenance mode:** the admin can stop new tasks and show a message to customers.
- **Brush edits:** only the area you paint changes. The rest of the photo stays the same.

## Things to know

- Results depend on the AI model. Check each result before you use it, especially for text in posters, shoes, glasses and multi-photo results.
- Some tasks take longer when many photos are sent together.
- The system is ready for testing. Full testing is needed before real customers use it.

## Coming next (planned)

- Customer login for workers (so only approved workers can work)
- Credits system for customers
- Result review (accept or reject before the customer sees it)
- Video (needs a separate video model)
