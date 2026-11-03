with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

count = 0
for i, line in enumerate(lines):
    prev = count
    # crude tokenization ignoring strings
    s = line
    # remove string literals
    for ch in s:
        if ch == '{': count += 1
        elif ch == '}': count -= 1
    # print when count increases in main return
    if i > 1500 and count > prev:
        # print line
        pass

print("Final count:", count)
# Let's check where the function AiStudioAdmin ends
# Search for export default function AiStudioAdmin
