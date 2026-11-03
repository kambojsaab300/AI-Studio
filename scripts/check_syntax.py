with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Let's count curly braces and parentheses
open_curlies = 0
open_parens = 0

for i, line in enumerate(lines):
    for char in line:
        if char == '{': open_curlies += 1
        elif char == '}': open_curlies -= 1
        elif char == '(': open_parens += 1
        elif char == ')': open_parens -= 1

print(f"Total lines: {len(lines)}")
print(f"Unclosed curlies: {open_curlies}")
print(f"Unclosed parens: {open_parens}")
