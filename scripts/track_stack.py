with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

stack = []
for idx, ch in enumerate(text):
    if ch in '({[':
        stack.append((ch, idx))
    elif ch in ')}]':
        if not stack:
            print(f"Extra closing {ch} at {idx}")
        else:
            top, pos = stack.pop()
            if (top == '(' and ch != ')') or (top == '{' and ch != '}') or (top == '[' and ch != ']'):
                print(f"Mismatched {top} at {pos} closed by {ch} at {idx}")

print(f"Remaining open items: {len(stack)}")
for item in stack:
    # get line number
    line_num = text[:item[1]].count('\n') + 1
    line_snippet = text[item[1]:item[1]+50].replace('\n', ' ')
    print(f"Unclosed {item[0]} at line {line_num}: {line_snippet}")
