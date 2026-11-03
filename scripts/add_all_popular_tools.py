import pyodbc
import json

conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=db77541.public.databaseasp.net;DATABASE=db77541;UID=db77541;PWD=e_5Y@4Cw7r!K'
conn = pyodbc.connect(conn_str, timeout=20)
cursor = conn.cursor()

tools = [
    # 1. Saree & Lehenga Studio
    {
        "task_type": "saree_lehenga_studio",
        "label": "Saree & Lehenga Draping Studio",
        "customer_label": "Saree & Lehenga Draping Studio",
        "hint": "Saree ya Lehenga ki photo upload karein aur Model chun kar traditional/bridal photoshoot banwayein.",
        "output": "image",
        "inputs": ["face", "style"],
        "labels": {"face": "Model ki photo", "style": "Saree / Lehenga ki photo"},
        "customer_labels": {"face": "Model Photo", "style": "Saree / Lehenga Photo"},
        "angles": [
            "front standing pose with elegant pleated pallu",
            "side profile pose showing saree drape and pleats",
            "back view showing designer blouse and flowing pallu",
            "close-up macro shot of zari border and heavy embroidery"
        ],
        "system_prompt": "You are a world-class Indian ethnic bridal and commercial couture fashion photographer.",
        "role_prompt": "IMAGE 1 = the fashion model. Faithfully retain the model's exact facial features, skin tone, hair, age and identity. IMAGE 2 = the saree / lehenga. Drape and fit this exact garment onto the model with natural royal fabric folds, majestic pallu flow, and authentic Indian wedding drape. Precisely reproduce the garment's exact color shades, zari work, embroidery, silk sheen, border motifs and embellishments. Clean royal palace or high-end studio lighting.",
        "neg_prompt": "changed face:3.0, altered identity:3.0, wrong saree color:3.0, wrong embroidery:3.0, distorted border, deformed hands, extra fingers, cartoon, 3D CGI, blurry fabric, watermark, signature:2.0",
        "sort": 26
    },
    # 2. Jewellery Virtual Try-On
    {
        "task_type": "jewellery_tryon",
        "label": "Jewellery Virtual Try-On",
        "customer_label": "Jewellery Virtual Try-On (Necklace, Earrings, Rings)",
        "hint": "Har, earrings, kangan ya jewellery ki photo upload karein aur model ke gale/kaano me pehna kar photo ready karein.",
        "output": "image",
        "inputs": ["face", "style"],
        "labels": {"face": "Model / Customer ki photo", "style": "Jewellery ki photo"},
        "customer_labels": {"face": "Person / Model Photo", "style": "Jewellery Photo"},
        "angles": [
            "front portrait focus on necklace and matching earrings",
            "side neck angle showing earring dangle and shine",
            "macro close-up on gemstone craftsmanship, gold luster and diamonds"
        ],
        "system_prompt": "You are an elite commercial luxury jewellery catalog photographer and lighting expert.",
        "role_prompt": "IMAGE 1 = the customer / model. Preserve the exact face, skin tone, neck, ear anatomy and identity. IMAGE 2 = the piece of jewellery (necklace, earrings, maang tikka, ring). Naturally fit and position the jewellery on the model's body with authentic weight, skin contact shadows, metal reflections, and diamond/gemstone sparkle. Maintain the exact jewelry design, gemstones, gold/silver color and craft.",
        "neg_prompt": "changed face:3.0, altered identity:3.0, wrong jewellery design:3.0, missing stones:2.5, floating jewellery:2.5, blurry gold, distorted ears, bad anatomy, cartoon, watermark, signature:2.0",
        "sort": 27
    },
    # 3. Footwear & Shoes Studio
    {
        "task_type": "footwear_studio",
        "label": "Footwear & Shoes Studio",
        "customer_label": "Footwear & Shoes Studio (Sneakers, Heels, Formal)",
        "hint": "Jooto ya footwear ki photo upload karein aur model ke pairo me alag-alag angles se photo payein.",
        "output": "image",
        "inputs": ["face", "style"],
        "labels": {"face": "Model ki photo", "style": "Footwear / Shoe ki photo"},
        "customer_labels": {"face": "Model Photo", "style": "Shoes Photo"},
        "angles": [
            "front standing angle showing footwear fitting",
            "side walking profile view highlighting shoe silhouette",
            "top-down 45 degree fashion feet pose",
            "macro close-up of shoe material, stitching, laces and sole"
        ],
        "system_prompt": "You are a high-end commercial footwear and sneaker catalog photographer.",
        "role_prompt": "IMAGE 1 = the fashion model. Keep the model's identity, legs, posture and outfit. IMAGE 2 = the footwear (sneakers, heels, formal shoes, boots). Fit the exact shoes onto the model's feet naturally, faithfully reproducing the exact colorway, leather/canvas texture, brand details, laces, sole profile and silhouette in professional commercial footwear photography.",
        "neg_prompt": "wrong shoe color:3.0, distorted shoes:3.0, wrong sole:2.5, deformed feet, extra toes, missing shoe details, cartoon, CGI, blurry sole, watermark, signature:2.0",
        "sort": 28
    },
    # 4. Ghost Mannequin 3D Hollow
    {
        "task_type": "ghost_mannequin",
        "label": "Ghost Mannequin / 3D Hollow Apparel",
        "customer_label": "Ghost Mannequin / 3D Hollow Apparel Effect",
        "hint": "Kapde ki photo do. Dummy/hanger gayab karke 3D floating hollow mannequin catalog look banayega.",
        "output": "image",
        "inputs": ["face"],
        "labels": {"face": "Garment on hanger/mannequin photo"},
        "customer_labels": {"face": "Garment Photo"},
        "angles": [
            "front 3D hollow mannequin floating view",
            "back 3D hollow view showing rear tailoring",
            "macro close-up of neckline, collar tag and inner lining"
        ],
        "system_prompt": "You are a professional e-commerce product catalog retoucher specializing in ghost mannequin 3D apparel photography.",
        "role_prompt": "IMAGE 1 = the garment on a mannequin, hanger or flat surface. Remove the mannequin, hanger and background completely. Create a realistic 3D hollow invisible ghost mannequin effect showing the inner back collar, inner lining, and natural 3D volume as if an invisible person is wearing it. Pure crisp white or clean studio background with realistic drop shadow.",
        "neg_prompt": "visible mannequin:3.0, visible hanger:3.0, flat 2D garment:2.5, altered garment color:3.0, changed design, distorted collar, blurry fabric, low resolution, watermark, signature:2.0",
        "sort": 29
    },
    # 5. Watch & Sunglasses Try-On
    {
        "task_type": "watch_sunglasses_tryon",
        "label": "Luxury Watch & Sunglasses Try-On",
        "customer_label": "Watch & Sunglasses Try-On Studio",
        "hint": "Ghadi ya chashme ki photo do aur model ke chehre/haath par realistic try-on photo banwayein.",
        "output": "image",
        "inputs": ["face", "style"],
        "labels": {"face": "Model ki photo", "style": "Watch / Sunglasses ki photo"},
        "customer_labels": {"face": "Model Photo", "style": "Watch / Sunglasses Photo"},
        "angles": [
            "front portrait wearing luxury sunglasses with natural lens reflection",
            "lifestyle wrist shot wearing luxury watch with formal sleeve",
            "macro close-up on watch dial, bezel, crown and strap texture"
        ],
        "system_prompt": "You are a luxury accessories and horology commercial photographer.",
        "role_prompt": "IMAGE 1 = the model / person. Preserve the model's exact face, eyes, skin tone and identity. IMAGE 2 = the luxury watch or sunglasses. Naturally fit and position the item on the model (sunglasses on bridge of nose with authentic lens tint and reflections, or watch on wrist with perfect strap wrap and bezel shine). Match the exact product design, dial markings, frame shape and materials.",
        "neg_prompt": "changed face:3.0, altered identity:3.0, wrong watch dial:3.0, wrong glasses frame:3.0, crooked sunglasses, deformed wrist, cartoon, watermark, signature:2.0",
        "sort": 30
    },
    # 6. Pre-Wedding & Couple Fantasy
    {
        "task_type": "prewedding_studio",
        "label": "Pre-Wedding & Couple Fantasy Studio",
        "customer_label": "Pre-Wedding & Couple Fantasy Studio (Palace / Swiss / Beach)",
        "hint": "Couple ki photo upload karein aur Udaipur Palace, Swiss Alps, ya Beach sunset me cinematic photoshoot payein.",
        "output": "image",
        "inputs": ["face", "style"],
        "labels": {"face": "Couple / Boy & Girl ki photo", "style": "Location / Scene photo (Optional)"},
        "customer_labels": {"face": "Couple Photo", "style": "Dream Location Photo"},
        "angles": [
            "wide cinematic couple portrait in royal palace courtyard",
            "romantic intimate close-up golden hour sunset shot",
            "dramatic fairy-tale landscape shot in snow-capped mountains",
            "beach sunset silhouette walking hand in hand"
        ],
        "system_prompt": "You are a celebrity wedding and pre-wedding cinematic destination photographer.",
        "role_prompt": "IMAGE 1 = the couple. Maintain the exact facial features, smile, skin tone, hair and facial identity of both individuals with 100% fidelity. Place them into a breathtaking, high-end pre-wedding photoshoot scene (royal heritage palace, romantic European street, or scenic golden sunset). Dress them in coordinated elegant formal wedding couture with dramatic cinematic lighting, gentle breeze and romantic gaze.",
        "neg_prompt": "changed faces:3.0, altered identity:3.0, face swap failure:3.0, plastic skin:2.0, deformed limbs, extra arms, bad anatomy, ugly hands, cartoon, CGI, blurry, text, watermark, signature:2.0",
        "sort": 31
    },
    # 7. Passport & Visa Photo Maker
    {
        "task_type": "passport_visa_photo",
        "label": "Passport & Visa Official Photo",
        "customer_label": "Passport & Visa Official Photo Maker",
        "hint": "Selfie ya aam photo upload karein. White/Blue background aur formal coat/shirt ke sath official passport photo banayein.",
        "output": "image",
        "inputs": ["face"],
        "labels": {"face": "Apni aam photo / selfie"},
        "customer_labels": {"face": "Your Photo / Selfie"},
        "angles": [
            "official biometric frontal passport photo with plain white background",
            "official biometric frontal passport photo with light blue background"
        ],
        "system_prompt": "You are an official biometric passport and government visa photography specialist.",
        "role_prompt": "IMAGE 1 = the person. Keep the person's exact face, eyes, ears, facial structure, skin tone, age and identity completely unaltered. Dress the person in a crisp, sharp formal dark business suit, white collared shirt and tie. Place against a solid, seamless plain white or light blue biometric passport background with even, shadow-free studio portrait lighting. Direct eye contact, neutral pleasant expression.",
        "neg_prompt": "changed face:3.0, altered identity:3.0, heavy beauty filters, smooth plastic skin, tilted head, harsh shadows, casual clothes, messy background, cartoon, blurry, watermark:2.0",
        "sort": 32
    },
    # 8. Ultra HD Photo Restoration & Colorizer
    {
        "task_type": "photo_restore_hd",
        "label": "Old Photo Restoration & 4K Colorizer",
        "customer_label": "Old Photo Restoration & 4K Colorizer",
        "hint": "Purani, black & white, dhundhli ya phati hui photo upload karein. Ultra HD crystal clear color photo banayein.",
        "output": "image",
        "inputs": ["input"],
        "labels": {"input": "Purani / B&W / Damaged photo"},
        "customer_labels": {"input": "Old / Damaged Photo"},
        "angles": [
            "full restored crystal-clear 4K colorized portrait with authentic historical colors"
        ],
        "system_prompt": "You are a master historical photo restoration and archival colorization expert.",
        "role_prompt": "IMAGE 1 = the historical, vintage, damaged or black-and-white photo. Carefully restore all scratched, cracked, torn, noisy and faded areas. Enhance facial sharpness, eyes, skin texture and hair to ultra-high-definition 4K clarity. Add realistic, historically accurate, warm and natural color tones. Do not change the original identity, facial structure, expression or historical authenticity.",
        "neg_prompt": "altered facial structure:3.0, changed identity:3.0, oversaturated neon colors, fake smooth plastic skin, AI hallucinated artifacts, cartoon, blur, watermark, text:2.0",
        "sort": 33
    },
    # 9. Kids & Baby Milestone Studio
    {
        "task_type": "kids_milestone_studio",
        "label": "Kids & Baby Milestone Studio",
        "customer_label": "Kids & Baby Milestone Studio (Prince, Krishna, Birthday)",
        "hint": "Bacche ki photo upload karein aur Little Krishna, Prince, Birthday theme photoshoot payein.",
        "output": "image",
        "inputs": ["face"],
        "labels": {"face": "Bacche ki photo"},
        "customer_labels": {"face": "Baby / Kid Photo"},
        "angles": [
            "little prince/princess royal theme portrait with crown and luxury backdrop",
            "traditional bal krishna theme with peacock feather and butter pot",
            "festive 1st birthday milestone celebration with cake and balloons"
        ],
        "system_prompt": "You are an award-winning creative baby and kids milestone studio photographer.",
        "role_prompt": "IMAGE 1 = the baby / child. Faithfully maintain the child's exact cute face, chubby cheeks, eyes, smile and identity without altering age or features. Dress the child in a chosen milestone fantasy theme (Royal Prince/Princess with velvet attire, Bal Krishna ethnic avatar with mor pankh, or Birthday celebration). Soft, warm, whimsical and dreamy studio lighting with premium baby-safe props.",
        "neg_prompt": "changed face:3.0, altered identity:3.0, wrong child age, adult proportions, scary faces, deformed hands, extra limbs, plastic skin, cartoon, watermark, signature:2.0",
        "sort": 34
    },
    # 10. Luxury Product Podium Ads
    {
        "task_type": "luxury_product_podium",
        "label": "Luxury Product Podium & Commercial Ads",
        "customer_label": "Luxury Product Podium & Commercial Ads",
        "hint": "Product ki photo do (perfume, bottle, cosmetic). Marble podium, water splash, aur luxury studio lighting me ad banwayein.",
        "output": "image",
        "inputs": ["face"],
        "labels": {"face": "Product ki photo"},
        "customer_labels": {"face": "Product Photo"},
        "angles": [
            "front hero shot on luxury marble podium with botanical shadows",
            "dramatic studio shot with crystal clear water splash and backlight",
            "neon cyberpunk futuristic pedestal with moody rim lighting",
            "minimalist warm beige stone pedestal with soft morning sunlight"
        ],
        "system_prompt": "You are a world-class luxury commercial advertising and product campaign photographer.",
        "role_prompt": "IMAGE 1 = the product (cosmetic bottle, perfume, watch, packaged food, electronic gadget). Keep the exact product design, label typography, bottle shape, brand colors and proportions 100% accurate. Place the product on a luxury architectural podium (italian marble, polished travertine, or water reflection) surrounded by tasteful natural elements and dramatic commercial studio rim lighting.",
        "neg_prompt": "distorted product:3.0, wrong brand logo:3.0, misspelled text:3.0, altered packaging, blurry label, low quality, cheap props, dirty background, watermark, signature:2.0",
        "sort": 35
    },
    # 11. Food & Restaurant Commercial Studio
    {
        "task_type": "food_photography_studio",
        "label": "Food & Restaurant Commercial Studio",
        "customer_label": "Food & Restaurant Commercial Studio (Menu Photos)",
        "hint": "Khane ki aam photo upload karein aur 5-star restaurant style steaming hot commercial food poster banwayein.",
        "output": "image",
        "inputs": ["input"],
        "labels": {"input": "Khane / Dish ki photo"},
        "customer_labels": {"input": "Food / Dish Photo"},
        "angles": [
            "top-down flat-lay food table spread with gourmet garnish",
            "45 degree restaurant dining angle with shallow depth of field",
            "steaming hot macro close-up of dish texture and melted toppings"
        ],
        "system_prompt": "You are a Michelin-star culinary photographer and food stylist.",
        "role_prompt": "IMAGE 1 = the food dish. Enhance and present the dish with mouthwatering commercial restaurant presentation: fresh herbs garnish, glistening sauce, realistic rising steam, and vibrant fresh ingredients. Set on a rustic dark wooden table or luxury slate dining plate with gourmet styling and warm ambient bistro lighting that stimulates appetite.",
        "neg_prompt": "unappetizing food:3.0, fake plastic food, cold looking, dirty plate, blurry garnish, dull colors, cartoon, CGI, messy table, watermark, signature:2.0",
        "sort": 36
    },
    # 12. Festival & Sale Banner Generator
    {
        "task_type": "festival_sale_banner",
        "label": "Festive & Mega Sale Banner Generator",
        "customer_label": "Festival & Mega Sale Banner Generator (Diwali, Eid, Big Sale)",
        "hint": "Product ki photo do aur Diwali, Eid, Big Sale, 50% Off ke stylish branded banners banwayein.",
        "output": "image",
        "inputs": ["face"],
        "labels": {"face": "Product / Brand item photo"},
        "customer_labels": {"face": "Product Photo"},
        "angles": [
            "Diwali festive banner layout with golden glowing diyas and royal lights",
            "Eid celebration banner with golden crescent moon and lantern motifs",
            "Mega Sale e-commerce banner with bold dynamic 3D podium and neon badges"
        ],
        "system_prompt": "You are a top commercial e-commerce advertising and festive campaign designer.",
        "role_prompt": "IMAGE 1 = the product. Feature the exact product prominently at center stage on a sleek promotional podium. Surround with celebratory festive elements (golden Diwali diyas, marigold garlands, Eid brass lanterns, or bold modern sale graphics). Luxurious festive lighting with bokeh glows and rich colors suitable for premium social media ads and website hero banners.",
        "neg_prompt": "distorted product:3.0, altered product shape:3.0, messy text, illegible letters, cheap clip art, dark dull lighting, cartoon, low quality:2.0",
        "sort": 37
    },
    # 13. Hair Salon & Color Studio
    {
        "task_type": "hair_salon_studio",
        "label": "Hair Color & Hairstyle Try-On",
        "customer_label": "Hair Color & Hairstyle Try-On Studio",
        "hint": "Apni photo upload karein aur Fade, Bob, Balayage, Blonde, Burgundy hair colors try karein bina baal kaate.",
        "output": "image",
        "inputs": ["face"],
        "labels": {"face": "Apni photo (face and hair visible)"},
        "customer_labels": {"face": "Your Photo"},
        "angles": [
            "front face hair makeover portrait with glossy highlights",
            "side profile showing hair gradient, fade and sleek silhouette",
            "back view showing rich multi-tonal hair color and layers"
        ],
        "system_prompt": "You are an elite master hair stylist and salon commercial beauty photographer.",
        "role_prompt": "IMAGE 1 = the client / person. Keep the person's exact face, facial structure, skin tone, eyes and facial expression 100% identical. Style the hair into a luxurious, salon-fresh professional haircut (such as modern layers, chic bob, curtain bangs, or sleek fade) with vibrant, glossy hair color (such as chocolate balayage, honey blonde, burgundy wine, or rich mocha). Natural hair strands, silky shine and realistic root gradient.",
        "neg_prompt": "changed face:3.0, altered facial identity:3.0, synthetic plastic wig look:2.5, helmet hair, bald patches, deformed ears, cartoon, CGI, blurry hair, watermark:2.0",
        "sort": 38
    },
    # 14. Bridal Makeup & Beauty Studio
    {
        "task_type": "bridal_makeup_studio",
        "label": "Bridal Makeup & HD Beauty Look",
        "customer_label": "Bridal Makeup & HD Beauty Look Preview",
        "hint": "Dulhan ya client ki photo upload karein aur HD Bridal Makeup, Smoky Eyes aur Glow Look preview karein.",
        "output": "image",
        "inputs": ["face"],
        "labels": {"face": "Apni photo (clear face selfie)"},
        "customer_labels": {"face": "Your Photo"},
        "angles": [
            "full frontal bridal portrait with luminous HD glass skin and statement lip",
            "side profile showing winged eyeliner, cheek contour and bridal nose pin",
            "cinematic bridal veil portrait with romantic soft-focus glow"
        ],
        "system_prompt": "You are an internationally acclaimed celebrity bridal makeup artist and beauty photographer.",
        "role_prompt": "IMAGE 1 = the bride / woman. Preserve the woman's true facial bones, eye shape, nose, lips and facial identity with precision. Apply exquisite, flawless HD bridal makeup: radiant dewy skin texture with pore definition, blended smoky eyes, defined lashes, sculpted cheekbones, and rich royal lip color. Adorned with delicate bridal bindi and sheer embroidered dupatta draped over hair.",
        "neg_prompt": "changed face:3.0, altered identity:3.0, cakey makeup, over-smoothed plastic skin filter:2.5, distorted eyes, asymmetrical lips, deformed hands, cartoon, CGI, blur:2.0",
        "sort": 39
    },
    # 15. Room & Interior Redesign Studio
    {
        "task_type": "room_interior_redesign",
        "label": "Room & Interior Redesign Studio",
        "customer_label": "Room & Interior Redesign Studio (Luxury Bedroom, Living)",
        "hint": "Khali ya purane kamre ki photo upload karein aur Luxury Modern Interior design me badlein.",
        "output": "image",
        "inputs": ["input"],
        "labels": {"input": "Kamre ki photo (bedroom, living, kitchen)"},
        "customer_labels": {"input": "Room Photo"},
        "angles": [
            "wide architectural shot of luxury modern master bedroom with warm ambient lights",
            "cozy contemporary living room with accent wooden wall and plush modular sofa",
            "sleek minimalist modular kitchen with marble island and pendant lighting"
        ],
        "system_prompt": "You are an Architectural Digest featured luxury interior architect and spatial designer.",
        "role_prompt": "IMAGE 1 = the existing room or space. Retain the room's core architectural layout (walls, windows, door placement and ceiling height). Completely redesign the space with ultra-luxury modern interior aesthetics: premium hardwood or polished marble flooring, designer false ceiling with concealed warm LED strip lighting, high-end bespoke furniture, textured accent wall, and elegant designer curtains. Architectural Digest quality.",
        "neg_prompt": "unrealistic layout:3.0, warped walls:2.5, floating furniture:2.5, distorted perspective, cheap materials, cartoon, CGI render artifacts, cluttered, dark, blurry:2.0",
        "sort": 40
    },
    # 16. House Exterior Paint Visualizer
    {
        "task_type": "house_exterior_paint",
        "label": "House Exterior & Architecture Paint",
        "customer_label": "House Exterior & Architecture Paint Visualizer",
        "hint": "Ghar ki bahar ki photo upload karein aur modern elevation color combinations preview karein.",
        "output": "image",
        "inputs": ["input"],
        "labels": {"input": "Ghar ki bahar ki photo (front elevation)"},
        "customer_labels": {"input": "House Exterior Photo"},
        "angles": [
            "bright daylight architectural facade shot with modern stone and wood textures",
            "dramatic warm twilight elevation shot with architectural spot lighting and lush lawn"
        ],
        "system_prompt": "You are a master exterior building architect and color consultant.",
        "role_prompt": "IMAGE 1 = the house or building exterior. Preserve the building's exact structural frame, roofline, windows, pillars and elevation lines. Re-paint and upgrade the exterior facade with sophisticated modern color palettes (such as warm charcoal grey, warm beige stone, accented with natural teak wood louvers and textured concrete). Clean landscaped front garden, paved driveway and crisp architectural lighting.",
        "neg_prompt": "changed building structure:3.0, distorted pillars:2.5, melted windows, crooked roofline, unnatural neon paint, cartoon, low resolution, blurry:2.0",
        "sort": 41
    }
]

print(f"Adding {len(tools)} tools into database...")

for t in tools:
    angles_json = json.dumps(t["angles"])
    labels_json = json.dumps(t["labels"])
    cust_labels_json = json.dumps(t["customer_labels"])
    inputs_json = json.dumps(t["inputs"])

    # 1. Upsert into ai_studio_task_catalog
    cursor.execute('''
    IF EXISTS (SELECT 1 FROM ai_studio_task_catalog WHERE task_type = ?)
    BEGIN
        UPDATE ai_studio_task_catalog
        SET label = ?, customer_label = ?, hint = ?, output = ?, inputs = ?, labels = ?, customer_labels = ?,
            angles = ?, face_check = 1, customer_visible = 1, enabled = 1, sort = ?, updated_at = SYSDATETIMEOFFSET()
        WHERE task_type = ?;
    END
    ELSE
    BEGIN
        INSERT INTO ai_studio_task_catalog (task_type, label, customer_label, hint, output, inputs, optional, labels, customer_labels, extras, prompt_required, face_check, [edit], [transparent], angles, family, per_photo, customer_visible, enabled, sort, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?, 0, 0, 1, 0, 0, ?, 0, 0, 1, 1, ?, SYSDATETIMEOFFSET());
    END
    ''', t["task_type"], t["label"], t["customer_label"], t["hint"], t["output"], inputs_json, labels_json, cust_labels_json, angles_json, t["sort"], t["task_type"],
         t["task_type"], t["label"], t["customer_label"], t["hint"], t["output"], inputs_json, labels_json, cust_labels_json, angles_json, t["sort"])

    # 2. Upsert into ai_studio_prompts
    cursor.execute('''
    IF EXISTS (SELECT 1 FROM ai_studio_prompts WHERE task_type = ?)
    BEGIN
        UPDATE ai_studio_prompts
        SET system_text = ?, role_text = ?, negative_text = ?, enabled = 1, updated_at = SYSDATETIMEOFFSET()
        WHERE task_type = ?;
    END
    ELSE
    BEGIN
        INSERT INTO ai_studio_prompts (task_type, system_text, role_text, negative_text, enabled, prompt_version, updated_at)
        VALUES (?, ?, ?, ?, 1, 1, SYSDATETIMEOFFSET());
    END
    ''', t["task_type"], t["system_prompt"], t["role_prompt"], t["neg_prompt"], t["task_type"],
         t["task_type"], t["system_prompt"], t["role_prompt"], t["neg_prompt"])

    # 3. Link to apps (ppp, weargen)
    for app in ['ppp', 'weargen']:
        cursor.execute('''
        IF NOT EXISTS (SELECT 1 FROM ai_studio_app_tasks WHERE app_id = ? AND task_type = ? AND task_type IS NOT NULL)
        BEGIN
            INSERT INTO ai_studio_app_tasks (app_id, task_type) VALUES (?, ?);
        END
        ''', app, t["task_type"], app, t["task_type"])

    print(f" -> Added: {t['task_type']} ({t['label']})")

conn.commit()
print("\nAll 16 tools added and committed to Microsoft SQL Server successfully!")
