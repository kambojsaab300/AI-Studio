import pyodbc

conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=db77541.public.databaseasp.net;DATABASE=db77541;UID=db77541;PWD=e_5Y@4Cw7r!K'
conn = pyodbc.connect(conn_str, timeout=15)
cursor = conn.cursor()

# 1. Mark tasks 8 and 9 as failed
cursor.execute("""
    UPDATE ai_studio_tasks 
    SET status = 'failed', 
        error = 'Face reference chahiye (Input missing)',
        finished_at = SYSDATETIMEOFFSET(),
        updated_at = SYSDATETIMEOFFSET()
    WHERE id IN (8, 9)
""")
print(f"Tasks updated: {cursor.rowcount}")

# 2. Unpause all paused workers so worker_46 and others can work
cursor.execute("""
    UPDATE ai_studio_workers
    SET paused = 0,
        pause_reason = NULL
    WHERE paused = 1
""")
print(f"Workers unpaused: {cursor.rowcount}")

conn.commit()
conn.close()
print("Success!")
