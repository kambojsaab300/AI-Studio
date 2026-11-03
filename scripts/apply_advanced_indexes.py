import pyodbc

conn_str = (
    'DRIVER={ODBC Driver 18 for SQL Server};'
    'SERVER=db77541.public.databaseasp.net;'
    'DATABASE=db77541;'
    'UID=db77541;'
    'PWD=e_5Y@4Cw7r!K;'
    'TrustServerCertificate=yes;'
    'Encrypt=yes;'
)

print('Connecting to live SQL Server...')
with pyodbc.connect(conn_str) as conn:
    cursor = conn.cursor()
    print('Connected!')

    with open('db/ai_studio_advanced_indexes.sql', 'r', encoding='utf-8') as f:
        sql = f.read()

    batches = [b.strip() for b in sql.split('GO') if b.strip()]
    for i, batch in enumerate(batches):
        print(f'Executing batch {i+1}...')
        cursor.execute(batch)
        conn.commit()

    print('\nVerifying Indexes on Database:')
    cursor.execute("""
        SELECT i.name, t.name as table_name, i.type_desc
        FROM sys.indexes i
        JOIN sys.tables t ON i.object_id = t.object_id
        WHERE i.name LIKE 'IX_ai_studio%'
    """)
    rows = cursor.fetchall()
    for row in rows:
        print(f' -> {row[0]} on {row[1]} ({row[2]})')

print('\nIndexes applied successfully!')
