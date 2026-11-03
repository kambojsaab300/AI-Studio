import pyodbc

conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=db77541.public.databaseasp.net;DATABASE=db77541;UID=db77541;PWD=e_5Y@4Cw7r!K'
conn = pyodbc.connect(conn_str, timeout=15)
cursor = conn.cursor()

# Get all task types from catalog
cursor.execute("SELECT task_type FROM ai_studio_task_catalog")
catalog_types = [row[0] for row in cursor.fetchall()]

# Get existing tool_types
cursor.execute("SELECT task_type FROM ai_studio_tool_types")
existing_types = set(row[0] for row in cursor.fetchall())

missing = [t for t in catalog_types if t not in existing_types]
print(f"Total catalog types: {len(catalog_types)}, Existing tool_types: {len(existing_types)}, Missing: {len(missing)}")

for t in missing:
    tool_val = 'chat' if t in ('chat', 'photo_read', 'product_tag', 'ocr_text', 'moderation_check') else 'image'
    cursor.execute("INSERT INTO ai_studio_tool_types (task_type, tool) VALUES (?, ?)", (t, tool_val))
    print(f"Added to tool_types: {t} -> {tool_val}")

conn.commit()
print("Done! Total tool_types now:")
cursor.execute("SELECT COUNT(*) FROM ai_studio_tool_types")
print(cursor.fetchone()[0])
conn.close()
