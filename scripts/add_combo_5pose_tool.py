import pyodbc
import json

conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=db77541.public.databaseasp.net;DATABASE=db77541;UID=db77541;PWD=e_5Y@4Cw7r!K'
conn = pyodbc.connect(conn_str, timeout=15)
cursor = conn.cursor()

task_type = "combo_5pose_studio"
label = "5-Pose Combo Catalog Studio (Front, Back, Side, Close, Upper)"
cust_label = "5-Pose Combo Catalog Studio (Front, Back, Side, Close & Upper)"
hint = "Photo upload karein aur 5 alag-alag poses payein: Front view, Back view, Side view, Close-up detail, aur Upper body portrait."

angles = [
    "Front View Pose (full standing front catalog view showing complete outfit silhouette)",
    "Back View Pose (full standing rear view showing back fit and styling)",
    "Side View Pose (45 degree side profile fashion angle showing posture and drape)",
    "Close-up Macro Pose (macro texture, collar, buttons, lapels and fabric weave focus)",
    "Upper Body Portrait Pose (waist-up professional catalog portrait showing face and chest)"
]
angles_json = json.dumps(angles)
inputs_json = json.dumps(["face", "style"])
optional_json = json.dumps(["style"])
labels_json = json.dumps({"face": "Person / Model ki photo", "style": "Outfit / Suit photo (Optional)"})
cust_labels_json = json.dumps({"face": "Person / Model Photo", "style": "Outfit Photo (Optional)"})

system_prompt = "You are a premier commercial fashion lookbook and 5-pose catalog photography AI specialist."
role_prompt = "IMAGE 1 = the model / person. Preserve the exact facial identity, skin tone, hair, facial features, age and body structure 100% faithfully. If IMAGE 2 is provided, fit this exact outfit naturally. Generate a distinct commercial fashion photoshoot in the requested camera angle and pose from the 5-pose catalog series (Front, Back, Side, Close-up, or Upper Body). Studio catalog lighting, crisp details, natural fabric drape and premium lookbook composition."
neg_prompt = "changed face:3.0, altered identity:3.0, face swap artifacts:3.0, different outfit:2.5, deformed limbs, bad anatomy, extra fingers, cartoon, 3D CGI, blurry, low resolution, watermark, signature:2.0"

# 1. Upsert into ai_studio_task_catalog
cursor.execute('''
IF EXISTS (SELECT 1 FROM ai_studio_task_catalog WHERE task_type = ?)
BEGIN
    UPDATE ai_studio_task_catalog
    SET label = ?, customer_label = ?, hint = ?, output = 'image', inputs = ?, optional = ?, labels = ?, customer_labels = ?,
        angles = ?, face_check = 1, customer_visible = 1, enabled = 1, sort = 24, updated_at = SYSDATETIMEOFFSET()
    WHERE task_type = ?;
    PRINT 'Updated combo_5pose_studio in task catalog';
END
ELSE
BEGIN
    INSERT INTO ai_studio_task_catalog (task_type, label, customer_label, hint, output, inputs, optional, labels, customer_labels, extras, prompt_required, face_check, [edit], [transparent], angles, family, per_photo, customer_visible, enabled, sort, updated_at)
    VALUES (?, ?, ?, ?, 'image', ?, ?, ?, ?, 0, 0, 1, 0, 0, ?, 0, 0, 1, 1, 24, SYSDATETIMEOFFSET());
    PRINT 'Inserted combo_5pose_studio into task catalog';
END
''', task_type, label, cust_label, hint, inputs_json, optional_json, labels_json, cust_labels_json, angles_json, task_type,
     task_type, label, cust_label, hint, inputs_json, optional_json, labels_json, cust_labels_json, angles_json)

# 2. Upsert into ai_studio_prompts
cursor.execute('''
IF EXISTS (SELECT 1 FROM ai_studio_prompts WHERE task_type = ?)
BEGIN
    UPDATE ai_studio_prompts
    SET system_text = ?, role_text = ?, negative_text = ?, enabled = 1, updated_at = SYSDATETIMEOFFSET()
    WHERE task_type = ?;
    PRINT 'Updated combo_5pose_studio in prompts';
END
ELSE
BEGIN
    INSERT INTO ai_studio_prompts (task_type, system_text, role_text, negative_text, enabled, prompt_version, updated_at)
    VALUES (?, ?, ?, ?, 1, 1, SYSDATETIMEOFFSET());
    PRINT 'Inserted combo_5pose_studio into prompts';
END
''', task_type, system_prompt, role_prompt, neg_prompt, task_type,
     task_type, system_prompt, role_prompt, neg_prompt)

# 3. Link to apps (ppp, weargen)
for app in ['ppp', 'weargen']:
    cursor.execute('''
    IF NOT EXISTS (SELECT 1 FROM ai_studio_app_tasks WHERE app_id = ? AND task_type = ?)
    BEGIN
        INSERT INTO ai_studio_app_tasks (app_id, task_type) VALUES (?, ?);
        PRINT 'Linked combo_5pose_studio to app ' + ?;
    END
    ''', app, task_type, app, task_type, app)

conn.commit()
print("All DB changes committed successfully for combo_5pose_studio!")
