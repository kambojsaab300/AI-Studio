# Script to generate the modern website-like UI for AI Studio Admin
import re

with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's inspect the sections in code
print(f"Total length: {len(code)}")
