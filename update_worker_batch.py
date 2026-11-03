with open('app/AI Studio Worker.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update DEFAULT_SETTINGS photos_per_task_max to 50
old_settings = "photos_per_task_max: 10,"
new_settings = "photos_per_task_max: 50,"

if old_settings in text:
    text = text.replace(old_settings, new_settings)
    print("Updated DEFAULT_SETTINGS photos_per_task_max to 50.")
else:
    print("Warning: old_settings not found exactly")

# 2. Update perPhoto processing in Worker.jsx to support up to 50 photos
old_per_photo = """// One by one: each uploaded photo (up to 10) gets the same prompt, so one result per photo
            if (type.perPhoto) {
                const photosIn = (task.extra_image_urls || []).filter(Boolean).slice(0, 10);
                const done = await Promise.allSettled(photosIn.map(async (url) => {
                    const b64 = await urlToBase64(url);
                    return makePhoto(task, { extras: [b64] });
                }));"""

new_per_photo = """// Batch one by one: each uploaded photo (up to 50) gets the same prompt, so one result per photo
            if (type.perPhoto) {
                const maxBatch = settingsRef.current?.photos_per_task_max || 50;
                const photosIn = (task.extra_image_urls || []).filter(Boolean).slice(0, maxBatch);
                const done = await Promise.allSettled(photosIn.map(async (url) => {
                    const b64 = await urlToBase64(url);
                    return makePhoto(task, { extras: [b64], input: b64 });
                }));"""

if old_per_photo in text:
    text = text.replace(old_per_photo, new_per_photo)
    print("Updated perPhoto batch processing to 50 in Worker.jsx.")
else:
    print("Warning: old_per_photo not found exactly, searching substring...")
    p = text.find('if (type.perPhoto)')
    print(text[p-50:p+250])

with open('app/AI Studio Worker.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("AI Studio Worker.jsx updated successfully!")
