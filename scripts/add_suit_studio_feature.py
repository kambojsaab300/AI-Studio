import pyodbc
import json

conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=db77541.public.databaseasp.net;DATABASE=db77541;UID=db77541;PWD=e_5Y@4Cw7r!K'
conn = pyodbc.connect(conn_str, timeout=15)
cursor = conn.cursor()

angles = [
    "front pose (full standing front view)",
    "back pose (back fitting and cut view)",
    "side pose (side profile 45 degree angle)",
    "close-up pose (fabric texture and lapel details)",
    "upper pose (waist-up portrait pose)",
    "down pose (full length standing pose)"
]
angles_json = json.dumps(angles)

# 1. Upsert into ai_studio_task_catalog
cursor.execute('''
IF EXISTS (SELECT 1 FROM ai_studio_task_catalog WHERE task_type = 'suit_studio')
BEGIN
    UPDATE ai_studio_task_catalog
    SET label = 'Suit Shop Studio (Model + Suit + Multi-Pose)',
        customer_label = 'Suit Shop Studio (Man, Woman and Kids)',
        hint = 'Apne suit/outfit ki photo upload karein aur model chun kar Front, Back, Side, Close-up, Upper, Down poses generate karein.',
        output = 'image',
        inputs = '["face", "style"]',
        labels = '{"face":"Model ki photo (Man/Woman/Kid)","style":"Suit / Garment ki photo"}',
        customer_labels = '{"face":"Model Photo","style":"Suit / Garment Photo"}',
        angles = ?,
        face_check = 1,
        customer_visible = 1,
        enabled = 1,
        sort = 25,
        updated_at = SYSDATETIMEOFFSET()
    WHERE task_type = 'suit_studio'
    PRINT 'Updated suit_studio in task catalog';
END
ELSE
BEGIN
    INSERT INTO ai_studio_task_catalog (task_type, label, customer_label, hint, output, inputs, optional, labels, customer_labels, extras, prompt_required, face_check, [edit], [transparent], angles, family, per_photo, customer_visible, enabled, sort, updated_at)
    VALUES ('suit_studio', 'Suit Shop Studio (Model + Suit + Multi-Pose)', 'Suit Shop Studio (Man, Woman and Kids)', 'Apne suit/outfit ki photo upload karein aur model chun kar Front, Back, Side, Close-up, Upper, Down poses generate karein.', 'image', '["face", "style"]', '[]', '{"face":"Model ki photo (Man/Woman/Kid)","style":"Suit / Garment ki photo"}', '{"face":"Model Photo","style":"Suit / Garment Photo"}', 0, 0, 1, 0, 0, ?, 0, 0, 1, 1, 25, SYSDATETIMEOFFSET());
    PRINT 'Inserted suit_studio into task catalog';
END
''', angles_json, angles_json)

# 2. Upsert into ai_studio_prompts
role_prompt = 'IMAGE 1 = the fashion model (Man, Woman, or Kid). Preserve the model\'s facial features, facial structure, skin tone, hair, age, gender and identity accurately. IMAGE 2 = the suit / garment. Fit and drape this exact suit / garment naturally and elegantly onto the model. Faithfully match and replicate the suit\'s exact color, fabric texture, weave, pattern, collar, buttons, lapels, embroidery, stitching, and cut. The model must be posing professionally in a clean studio setting with commercial catalog lighting and realistic fabric draping.'
neg_prompt = 'changed face:3.0, altered identity:3.0, wrong suit color:3.0, wrong suit pattern:3.0, altered outfit design:3.0, wrong gender, wrong age, deformed body, bad anatomy, unnatural fabric folding, blurry details, low quality, distorted lapel, cartoon, 3D CGI render, extra arms, extra fingers, text, watermark, signature:2.0'
sys_prompt = 'You are an expert commercial fashion catalog photographer and virtual apparel try-on specialist.'

cursor.execute('''
IF EXISTS (SELECT 1 FROM ai_studio_prompts WHERE task_type = 'suit_studio')
BEGIN
    UPDATE ai_studio_prompts
    SET system_text = ?, role_text = ?, negative_text = ?, enabled = 1, updated_at = SYSDATETIMEOFFSET()
    WHERE task_type = 'suit_studio'
    PRINT 'Updated suit_studio in prompts';
END
ELSE
BEGIN
    INSERT INTO ai_studio_prompts (task_type, system_text, role_text, negative_text, enabled, prompt_version, updated_at)
    VALUES ('suit_studio', ?, ?, ?, 1, 1, SYSDATETIMEOFFSET());
    PRINT 'Inserted suit_studio into prompts';
END
''', sys_prompt, role_prompt, neg_prompt, sys_prompt, role_prompt, neg_prompt)

# 3. Link to apps (ppp, weargen)
for app in ['ppp', 'weargen']:
    cursor.execute('''
    IF NOT EXISTS (SELECT 1 FROM ai_studio_app_tasks WHERE app_id = ? AND task_type = 'suit_studio')
    BEGIN
        INSERT INTO ai_studio_app_tasks (app_id, task_type) VALUES (?, 'suit_studio');
        PRINT 'Linked suit_studio to app ' + ?;
    END
    ''', app, app, app)

conn.commit()
print('All DB changes committed successfully!')
