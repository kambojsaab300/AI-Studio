-- ============================================================
-- AI Studio: TASK PROMPTS in the database. Run LAST (after ai_studio_task_types.sql).
-- Safe to run again.
--
-- Every image task type has one row here. The final text sent to Gemini is:
--   [system_text]                      what to create, what must stay the same
--   [role_text]                        IMAGE 1 / IMAGE 2 rules
--   Prompt: "..."                      the customer's / admin's own words
--   [NEGATIVE CONSTRAINTS]: negative_text
--   enabled                            off = the worker refuses these tasks and the database refuses new ones
--
-- prompt_version: when this file raises the number below, the seed rewrites the row.
-- Admin edits stay until the next version bump (then the seed text wins again).
-- ============================================================

-- 1. Table
create table if not exists public.ai_studio_prompts (
  task_type     text primary key
                check (task_type in (
                  'text_to_image', 'image_prompt', 'image_to_image', 'image_to_image_prompt',
                  'outfit_change', 'background_change', 'virtual_tryon', 'product_scene', 'product_catalog', 'project_image',
                  'image_edit', 'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'couple_photo', 'family_photo', 'outfit_change_ref',
                  'ocr_text', 'product_tag', 'moderation_check',
                  'poster_text', 'sticker_logo', 'remove_bg', 'restore_photo', 'outpaint', 'style_transfer', 'mockup', 'product_angles',
                  'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
                  'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes',
                  'pose_change'
                )),
  system_text   text not null check (btrim(system_text) <> ''),
  role_text     text not null default '',
  negative_text text not null default '',
  enabled       boolean not null default true,
  prompt_version int not null default 1,
  updated_at    timestamptz not null default now()
);

-- Existing databases: add the new columns if the table was made before
alter table public.ai_studio_prompts add column if not exists negative_text text not null default '';
alter table public.ai_studio_prompts add column if not exists prompt_version int not null default 1;

alter table public.ai_studio_prompts enable row level security;
drop policy if exists "ai_studio_prompts admin" on public.ai_studio_prompts;
create policy "ai_studio_prompts admin" on public.ai_studio_prompts for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

-- 2. Seed. Version 2 = this set. A row is rewritten only when its stored version is lower.
insert into public.ai_studio_prompts (task_type, system_text, role_text, negative_text, prompt_version) values

  ('text_to_image',
   $s$Create one photorealistic image that matches the user's prompt exactly. Natural lighting, real textures, realistic proportions.$s$,
   '',
   $n$CGI, 3D render, cartoon, anime, painting, illustration, deformed anatomy, extra limbs, distorted hands, text, watermark, signature:1.5$n$, 2),

  ('image_prompt',
   $s$Create a new photo based on IMAGE 1 and the user's prompt. Keep the main subject of IMAGE 1 recognisable and realistic.$s$,
   $r$IMAGE 1 = the input photo. Use its subject, composition and colours as the base of the new photo.$r$,
   $n$CGI, 3D render, cartoon, painting, deformed anatomy, extra limbs, distorted hands, text, watermark, signature:1.5$n$, 2),

  ('image_to_image',
   $s$Keep 100% facial identity from the reference face. Output one realistic photo.$s$,
   $r$IMAGE 1 = face identity to keep exactly. IMAGE 2 = outfit, style and scene to copy.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, face swap:3.0, modified facial features:3.0, new identity:3.0, smooth skin filter:2.0, plastic skin:2.0, beauty filter:2.0, wearing clothes from face reference:2.0, CGI, 3D render, cartoon, anime, deformed face, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('image_to_image_prompt',
   $s$Keep 100% facial identity from the reference face. Output one realistic photo that follows the user's prompt.$s$,
   $r$IMAGE 1 = face identity to keep exactly. IMAGE 2 = outfit, style and scene to copy.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, face swap:3.0, modified facial features:3.0, new identity:3.0, smooth skin filter:2.0, plastic skin:2.0, beauty filter:2.0, wearing clothes from face reference:2.0, CGI, 3D render, cartoon, anime, deformed face, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('outfit_change',
   $s$Dress the person from IMAGE 1 in the outfit from IMAGE 2. The person must stay exactly the same. Output one realistic photo.$s$,
   $r$IMAGE 1 = the person. Keep this exact person unchanged: same face, skin, hair, body, pose, expression and background. IMAGE 2 = the outfit. Copy its colours, fabric, pattern and cut exactly. Change nothing else.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, face swap:3.0, new identity:3.0, original outfit kept:2.5, outfit from wrong reference:2.0, changed pose:2.0, changed background:1.5, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed body, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('background_change',
   $s$Place the person from IMAGE 1 into the background from IMAGE 2. The person stays exactly the same; only the background changes. Output one realistic photo.$s$,
   $r$IMAGE 1 = the person. Keep this exact person unchanged: same face, skin, hair, body, pose and clothes. IMAGE 2 = the new background. Use its environment, perspective and light, and match the person's light and shadows to it.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, new identity:3.0, original background kept:2.5, changed outfit:2.5, changed pose:2.0, floating subject:2.0, mismatched lighting:1.8, cut-out edges:2.0, halo around subject:2.0, smooth skin filter:2.0, CGI, 3D render, cartoon, deformed body, bad anatomy, extra limbs, text, watermark, signature:1.5$n$, 2),

  ('virtual_tryon',
   $s$Show the customer from IMAGE 1 wearing or using the product from IMAGE 2. The customer stays exactly the same. Output one realistic photo.$s$,
   $r$IMAGE 1 = the customer. Keep this exact face, body, hair, pose and background. IMAGE 2 = the product (clothing, jewellery or bag). Copy its exact design, colours and shape, and fit it naturally on the customer.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, new identity:3.0, wrong product design:2.5, altered product colour:2.5, product missing:2.0, unnatural product fit:2.0, product floating off the body:2.0, smooth skin filter:2.0, CGI, 3D render, cartoon, deformed body, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('product_scene',
   $s$Place the EXACT product from IMAGE 1 into a realistic scene described by the user's prompt. The product must look identical to the reference. Match the scene's light to the product. Output one realistic photo.$s$,
   $r$IMAGE 1 = the product. Keep its shape, proportions, colours, material, logo, printed text and labels identical. Do not add, remove or redesign any part. If IMAGE 2 is given, use it as the scene reference only.$r$,
   $n$changed logo:3.0, altered text:3.0, wrong colour:2.5, reshaped product:3.0, extra product parts:2.5, cropped product:2.0, product floating unnaturally:2.0, mismatched lighting:1.8, product too small to read:1.5, watermark, text overlay, CGI, 3D render, cartoon, deformed$n$, 2),

  ('product_catalog',
   $s$Clean commercial catalog photograph of the EXACT product from IMAGE 1. The product is the hero. Plain seamless studio background, soft even light, full product visible, sharp focus, true colour. Output one realistic photo.$s$,
   $r$IMAGE 1 = the product. Keep its shape, proportions, colours, material, logo, printed text and labels identical. Do not add, remove or redesign any part.$r$,
   $n$changed logo:3.0, altered text:3.0, wrong colour:2.5, reshaped product:3.0, extra parts:2.5, cropped product:2.0, product partly hidden:2.0, shadows covering product:1.5, background clutter:2.0, props in frame:1.5, watermark, text overlay, CGI, 3D render, deformed$n$, 2),

  ('project_image',
   $s$Create a new visual that follows the design in IMAGE 1 closely, keeping its layout, colours and key elements. Output one realistic, high-quality image that follows the user's prompt.$s$,
   $r$IMAGE 1 = the design or project photo. Keep its layout and key elements. If IMAGE 2 is given, use it as the style reference only (colours, mood, texture); do not copy its objects.$r$,
   $n$changed layout:2.5, missing key elements:2.5, added unrelated objects:2.0, altered colours from design:2.0, distorted geometry:2.5, text, watermark, signature:1.5, CGI, 3D render, deformed$n$, 2),

  ('image_edit',
   $s$Edit the photo from IMAGE 1 only inside the area marked red in IMAGE 2. Apply the user's instruction (change colour, add text, remove text) only to that area, so it blends naturally with the rest of the photo. Output one realistic photo.$s$,
   $r$IMAGE 1 = the photo to edit. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changes outside the marked area:3.0, altered face:3.0, changed background:2.5, different lighting outside mask:2.0, visible seam:2.0, blurry edit:2.0, mismatched colours:1.8, extra objects:1.5, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('hair_change',
   $s$Change ONLY the hair of the person in IMAGE 1, inside the area marked red in IMAGE 2. Apply the hairstyle, colour or length the user describes. Keep the face, skin, expression, body, clothes and background exactly the same. Make the hair look natural, with real strands and correct light.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed skin tone:2.5, changed clothes:2.5, changed background:2.5, changes outside the red area:3.0, unnatural hair edges:2.0, wig look:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('shirt_change',
   $s$Change ONLY the top / shirt of the person in IMAGE 1, inside the area marked red in IMAGE 2, to the colour, fabric and design the user describes. Keep the face, hair, body, pose, trousers and background exactly the same. Keep folds and lighting realistic.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed hair:2.5, changed pose:2.5, changed background:2.5, changed trousers:2.0, changes outside the red area:3.0, flat unrealistic fabric:2.0, wrong fit:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('suit_change',
   $s$Change ONLY the outfit of the person in IMAGE 1, inside the area marked red in IMAGE 2, into the suit (jacket and shirt) the user describes. Keep the face, hair, body, pose and background exactly the same. The suit must fit the body and follow the pose, with realistic folds and lighting.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed hair:2.5, changed pose:2.5, changed background:2.5, original casual clothes kept:2.5, changes outside the red area:3.0, wrong fit:2.0, flat unrealistic fabric:2.0, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('bg_change',
   $s$Replace ONLY the background inside the area marked red in IMAGE 2 with the background the user describes. The person in IMAGE 1 (face, hair, body, pose, clothes) must stay exactly the same. Match the light, perspective and shadows of the person to the new background, and keep the edges around the person clean.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the background only. Do not change any pixel of the person.$r$,
   $n$changed face:3.0, altered person:3.0, changed clothes:2.5, changed pose:2.5, cut-out edges:2.0, halo around subject:2.0, mismatched lighting:1.8, visible seam:2.0, changes outside the red area:3.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('face_swap',
   $s$Swap the face: put the face of the person in IMAGE 1 onto the person in IMAGE 2. The result must show the same identity as IMAGE 1: same facial features, skin tone and eyes. Keep everything else from IMAGE 2 exactly the same: pose, head angle, body, outfit, hair style, background, lighting and camera. Output one realistic photo.$s$,
   $r$IMAGE 1 = the face to use (identity source). IMAGE 2 = the reference photo: its scene, pose, outfit and background stay exactly the same. Only the face of the person in IMAGE 2 is replaced by the face of IMAGE 1.$r$,
   $n$different person:3.0, identity not matching IMAGE 1:3.0, changed pose:2.5, changed outfit:2.5, changed background:2.5, changed lighting:2.0, two faces:2.0, skin tone mismatch:2.0, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed face, bad anatomy, text, watermark, signature:1.5$n$, 2),

  ('couple_photo',
   $s$Create one realistic photo of a couple: the girl from IMAGE 1 and the boy from IMAGE 2, together in the same frame, standing or sitting naturally close to each other. Both keep their exact own identity (face, skin tone, hair, body). Use a relaxed, natural couple pose with correct body proportions, and the same lighting, scale and perspective for both. Output one realistic photo.$s$,
   $r$IMAGE 1 = the girl. Keep her exact face, skin tone, hair and body identical to the photo. IMAGE 2 = the boy. Keep his exact face, skin tone, hair and body identical to the photo. Each person keeps their own outfit from their photo unless the user asks for a change. Never blend or merge the two faces.$r$,
   $n$merged faces:3.0, face swap between the two:3.0, changed face of the girl:3.0, changed face of the boy:3.0, different identity:3.0, extra person:2.5, missing person:2.5, unnatural body contact:2.5, extra limbs:2.5, missing fingers:2.0, mismatched scale:2.0, mismatched lighting:1.8, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed face, bad anatomy, text, watermark, signature:1.5$n$, 2),

  ('family_photo',
   $s$Create one realistic family photo with every family member from the reference photos in the same frame, standing or sitting together naturally. Each member keeps their exact own identity (face, skin tone, hair, body and apparent age). Natural family pose with correct body proportions, and the same lighting, scale and perspective for everyone. Output one realistic photo.$s$,
   $r$Each IMAGE is one family member. The order of the members is given at the end of the instruction. Keep each person's face identical to their own photo; never merge or swap faces. Each person keeps their own outfit from their photo unless the user asks for a change. Children stay children, and grandparents stay at their own age.$r$,
   $n$merged faces:3.0, swapped faces:3.0, changed identity:3.0, missing family member:2.5, extra person:2.5, wrong age of a person:2.5, unnatural body contact:2.5, extra limbs:2.5, missing fingers:2.0, mismatched scale:2.0, mismatched lighting:1.8, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed face, bad anatomy, text, watermark, signature:1.5$n$, 2),

  ('outfit_change_ref',
   $s$Dress the person from IMAGE 3 (the photo reference) in the outfit from IMAGE 2. The person must look exactly like the person in IMAGE 1 (the face reference): same face, skin tone, hair and body identity. Keep the pose, background, camera and lighting of IMAGE 3 exactly the same. Output one realistic photo.$s$,
   $r$IMAGE 1 = face reference: the identity to keep exactly. IMAGE 2 = outfit: copy its exact colours, fabric, pattern and cut onto the person. IMAGE 3 = photo reference: the base photo. Keep everything in it except the outfit.$r$,
   $n$changed face:3.0, face not matching IMAGE 1:3.0, different identity:3.0, changed pose:2.5, changed background:2.5, changed camera or lighting:2.0, original outfit kept:2.5, outfit from wrong reference:2.0, wrong outfit colours:2.0, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed body, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('ocr_text',
   $s$Read all visible text in IMAGE 1 exactly as it is written, line by line, in the original language and spelling. Keep numbers, prices, dates and symbols exact. If a part is unreadable, write [unreadable] in its place. Output only the text, nothing else.$s$,
   '', '', 2),

  ('product_tag',
   $s$Look at the product in IMAGE 1 and return its tags as plain text, one per line: Category, Main colour, Secondary colours, Material, Pattern, Style, Size (only if visible), Short title (max 12 words). Describe only what is clearly visible. If unsure, write unclear. Output only these lines.$s$,
   '', '', 2),

  ('moderation_check',
   $s$Check IMAGE 1 and return exactly these lines: Blur: yes or no. Brightness: good, too dark or too bright. Subject visible: yes or no. Inappropriate content: yes or no (with the reason if yes). Number of faces: a number. Output only these lines.$s$,
   '', '', 2),

  ('poster_text',
   $s$Design one clean, professional poster or banner. Write the exact text the user gives, with correct spelling, clear readable typography and enough contrast. If IMAGE 1 is given, use it as the main visual and keep the product or person in it unchanged. Output one high-quality design.$s$,
   $r$IMAGE 1 = the main visual to place on the poster (optional). Keep it unchanged; add the text and layout around it.$r$,
   $n$misspelled text:3.0, wrong numbers or prices:3.0, unreadable text:2.5, text cut off:2.0, changed product:2.5, extra random text:2.0, cluttered layout:1.8, watermark, signature:1.5$n$, 2),

  ('sticker_logo',
   $s$Create one flat, clean logo or sticker illustration of the user's description. Place it centred on a solid pure white background (#FFFFFF), with no shadow, no gradient and no border. Crisp edges and bold simple shapes. No text unless the user asks for it.$s$,
   '',
   $n$shadow:2.0, gradient background:2.5, background texture:2.5, photo realistic background:2.0, cut edges:1.8, blurry edges:2.0, watermark, signature:1.5$n$, 2),

  ('remove_bg',
   $s$Cut out the main subject of IMAGE 1 exactly as it is. Keep every pixel of the subject unchanged (shape, colour, texture, labels, logo). Place it on a solid pure white background (#FFFFFF) with no shadow and no other objects.$s$,
   $r$IMAGE 1 = the photo. Only the background becomes pure white. The subject must not be altered.$r$,
   $n$altered subject:3.0, changed colour:2.5, missing parts of subject:2.5, background left behind:2.5, shadow:2.0, soft halo around subject:2.0, changed logo or text:3.0, extra objects:2.0$n$, 2),

  ('restore_photo',
   $s$Restore and enhance IMAGE 1: remove noise, scratches, blur and colour fading, and sharpen it into a clean, high-resolution photo. Keep every face identical to the original, with natural skin texture. Keep the composition and everything else unchanged.$s$,
   $r$IMAGE 1 = the old or low quality photo. Keep the same people, pose, clothes and background. Only the quality changes.$r$,
   $n$changed face:3.0, altered facial features:3.0, smooth plastic skin:2.5, added objects:2.0, changed composition:2.5, colour shift:2.0, over-sharpened halos:1.8, watermark, text:1.5$n$, 2),

  ('outpaint',
   $s$Extend IMAGE 1 to fill the requested aspect ratio. Keep the main subject exactly as it is and continue the background, floor, sky or scenery naturally at the new edges, with matching light, perspective and texture. Do not crop or move the subject.$s$,
   $r$IMAGE 1 = the photo to extend. The original area stays the same; only the new edges are generated.$r$,
   $n$changed subject:3.0, moved subject:2.5, visible seam:2.5, mismatched perspective:2.0, mismatched lighting:2.0, repeated pattern artefacts:1.8, extra objects:1.5, distorted anatomy:2.0, watermark, signature:1.5$n$, 2),

  ('style_transfer',
   $s$Redraw IMAGE 1 in the art style the user describes (for example sketch, pencil drawing, oil painting, watercolour or cartoon). Keep the composition, the subjects and their positions the same. Apply the style consistently over the whole image.$s$,
   $r$IMAGE 1 = the source image. Keep the same subjects, layout and pose. Only the rendering style changes.$r$,
   $n$changed composition:2.5, missing subjects:2.5, added objects:2.0, inconsistent style:2.0, text, watermark, signature:1.5$n$, 2),

  ('mockup',
   $s$Place the design from IMAGE 1 realistically onto the product in IMAGE 2 (t-shirt, mug, bag or similar). Follow the product's shape, folds, curves and lighting so the design looks printed on it. Keep the product photo otherwise unchanged.$s$,
   $r$IMAGE 1 = the design or artwork (logo or print). Copy it exactly, without changing its colours or text. IMAGE 2 = the product photo: keep its shape, background and lighting.$r$,
   $n$altered design:3.0, misspelled design text:3.0, changed product shape:2.5, design floating above product:2.5, flat unrealistic print:2.0, changed background:2.0, extra objects:1.8, watermark, signature:1.5$n$, 2),

  ('product_angles',
   $s$Create one clean studio photo of the EXACT product from IMAGE 1, shown from the camera angle given at the end of the instruction. The product is the hero: same shape, proportions, colours, material, logo, printed text and labels. Plain seamless studio background, soft even light, full product visible, sharp focus.$s$,
   $r$IMAGE 1 = the product. Do not add, remove or redesign any part. Only the viewing angle changes.$r$,
   $n$changed logo:3.0, altered text:3.0, wrong colour:2.5, reshaped product:3.0, extra parts:2.5, cropped product:2.0, background clutter:2.0, props in frame:1.5, watermark, CGI, 3D render, deformed$n$, 2),

  ('woman_earrings',
   $s$Add or change ONLY the earrings of the woman in IMAGE 1, inside the red area in IMAGE 2 (the ear area). The earrings must sit naturally on the earlobe, at the same size and height on both ears, and match the light. Keep her face, hair and everything else exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed hair:2.5, changed clothes:2.5, changes outside the red area:3.0, uneven earrings:2.0, floating earring:2.0, mismatched lighting:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('woman_nose_pin',
   $s$Add or change ONLY the nose pin or nose ring of the woman in IMAGE 1, inside the red area in IMAGE 2 (the nostril area). It must be small and natural, sitting on the side of the nostril, matching the skin tone and light. Keep her face and everything else exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, oversized nose ring:2.5, nose ring in wrong place:2.5, changed skin tone:2.0, changes outside the red area:3.0, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('woman_shoes',
   $s$Change ONLY the shoes of the woman in IMAGE 1, inside the red area in IMAGE 2 (the feet). Use the style, colour and material the user describes, with correct perspective, size and contact with the ground. Keep her legs, outfit, face and background exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed legs:3.0, changed outfit:2.5, changed face:3.0, changes outside the red area:3.0, wrong shoe size:2.0, floating shoes:2.0, wrong perspective:2.0, mismatched lighting:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('woman_glasses',
   $s$Add or change ONLY the glasses of the woman in IMAGE 1, inside the red area in IMAGE 2 (the eyes area). The glasses must sit correctly on the nose and ears, with the right perspective and realistic reflections. Keep her eyes, face, hair and everything else identical.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered eyes:3.0, changed eye colour:2.5, changed hair:2.5, changes outside the red area:3.0, crooked glasses:2.0, glasses floating off the face:2.0, unrealistic reflections:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_glasses',
   $s$Add or change ONLY the glasses of the man in IMAGE 1, inside the red area in IMAGE 2 (the eyes area). The glasses must sit correctly on the nose and ears, with the right perspective and realistic reflections. Keep his eyes, face, beard, hair and everything else identical.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered eyes:3.0, changed eye colour:2.5, changed beard:2.5, changed hair:2.5, changes outside the red area:3.0, crooked glasses:2.0, glasses floating off the face:2.0, unrealistic reflections:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_suit',
   $s$Change ONLY the outfit of the man in IMAGE 1, inside the red area in IMAGE 2, into the suit (jacket and trousers) the user describes. The suit must fit his body and follow his pose, with realistic folds and lighting. Keep his face, hair, beard, pose and background exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed beard:2.5, changed hair:2.5, changed pose:2.5, changed background:2.5, original casual clothes kept:2.5, changes outside the red area:3.0, wrong fit:2.0, flat unrealistic fabric:2.0, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_shirt',
   $s$Change ONLY the shirt of the man in IMAGE 1, inside the red area in IMAGE 2, to the colour, fabric and style the user describes. Keep his face, beard, hair, trousers, pose and background exactly the same. Keep folds and lighting realistic.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed beard:2.5, changed hair:2.5, changed pose:2.5, changed trousers:2.0, changes outside the red area:3.0, flat unrealistic fabric:2.0, wrong fit:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_jeans',
   $s$Change ONLY the trousers of the man in IMAGE 1, inside the red area in IMAGE 2, into the jeans the user describes. Keep his shirt, shoes, face, beard, pose and background exactly the same. Realistic fit, folds and denim texture.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed shirt:2.5, changed shoes:2.0, changed pose:2.5, changed background:2.5, changes outside the red area:3.0, wrong fit:2.0, plastic denim texture:2.0, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_shorts',
   $s$Change ONLY the trousers of the man in IMAGE 1, inside the red area in IMAGE 2, into the shorts the user describes. Keep his shirt, shoes, legs, face, beard, pose and background exactly the same. Realistic length, fit and folds.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed shirt:2.5, changed shoes:2.0, changed pose:2.5, changed background:2.5, changes outside the red area:3.0, wrong length:2.0, unnatural legs:2.5, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_shoes',
   $s$Change ONLY the shoes of the man in IMAGE 1, inside the red area in IMAGE 2 (the feet). Use the style, colour and material the user describes, with correct perspective, size and contact with the ground. Keep his legs, trousers, face and background exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed legs:3.0, changed trousers:2.5, changed face:3.0, changes outside the red area:3.0, wrong shoe size:2.0, floating shoes:2.0, wrong perspective:2.0, mismatched lighting:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('pose_change',
   $s$Change the pose of the person in IMAGE 1 to the pose the user describes (for example front view, back view, side view, walking, sitting, hands in pockets). Keep the same person: identical face, skin tone, hair, body proportions, outfit and colours. Keep the background and lighting. The new pose must be natural and anatomically correct.$s$,
   $r$IMAGE 1 = the person photo. Keep the identity and the outfit exactly; only the body pose and the viewing angle change.$r$,
   $n$changed face:3.0, different identity:3.0, changed outfit:2.5, changed clothes colours:2.5, changed background:2.5, anatomy errors:2.5, extra limbs:2.5, missing fingers:2.0, twisted body:2.0, mismatched lighting:1.8, plastic skin:2.0, CGI, 3D render, cartoon, deformed, watermark, signature:1.5$n$, 2)

on conflict (task_type) do update set
  system_text   = excluded.system_text,
  role_text     = excluded.role_text,
  negative_text = excluded.negative_text,
  prompt_version = excluded.prompt_version,
  updated_at    = now()
where public.ai_studio_prompts.prompt_version < excluded.prompt_version;

-- 3. The worker gets the prompts through this function (only a registered worker)
create or replace function public.get_task_prompts(p_worker_id text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.ai_studio_workers where worker_id = p_worker_id) then
    raise exception 'Worker registered nahi hai';
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'task_type', task_type,
      'system_text', system_text,
      'role_text', role_text,
      'negative_text', negative_text,
      'enabled', enabled
    ))
    from public.ai_studio_prompts
  ), '[]'::json);
end;
$$;

-- 4. Strict rule in the database: a task of a type with no enabled prompt cannot be saved.
--    The trigger runs as the function owner, so customers cannot skip it.
create or replace function public.ai_studio_require_prompt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.task_type in ('chat', 'photo_read') then
    return new;
  end if;
  if not exists (select 1 from public.ai_studio_prompts where task_type = new.task_type and enabled) then
    raise exception 'Is kaam ka prompt band hai ya DB mein nahi hai: %', new.task_type;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_studio_require_prompt on public.ai_studio_tasks;
create trigger ai_studio_require_prompt
  before insert on public.ai_studio_tasks
  for each row execute function public.ai_studio_require_prompt();
