
file_path = 'f:/geeoo/geo-linguistic-survey-project/src/GeoLinguisticSurvey.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

stack = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            print(f"Extra closing brace at position {i}")
        else:
            stack.pop()

if stack:
    print(f"Unclosed opening braces at positions: {stack}")
    for pos in stack:
        # get line and context
        line_num = content[:pos].count('\n') + 1
        line_content = content.splitlines()[line_num - 1]
        print(f"Line {line_num}: {line_content}")
else:
    print("No brace mismatch found in the entire file.")
