import re

with open('dashboard/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Simple replacements
replacements = [
    ('return Response({', 'return DashboardAPIResponse.error('),
    ("'error': True,", ''),
    ("'message':", ''),
    ('}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)', ', status_code=HTTPStatus.INTERNAL_SERVER_ERROR)'),
    ('}, status=status.HTTP_400_BAD_REQUEST)', ', status_code=HTTPStatus.BAD_REQUEST)'),
    ('})', ')'),
]

# Apply simple text replacements for error patterns
lines = content.split('\n')
new_lines = []

for line in lines:
    if 'return Response({' in line and "'error': True" in line:
        # Extract the message part
        if "'message':" in line:
            # Simple error response
            message_start = line.find("'message':") + 10
            message_end = line.find('}')
            if message_end == -1:
                message_end = len(line)
            message = line[message_start:message_end].strip()
            if message.endswith(','):
                message = message[:-1]
            
            if 'status=status.HTTP_500_INTERNAL_SERVER_ERROR' in line:
                new_line = f"            return DashboardAPIResponse.error({message}, status_code=HTTPStatus.INTERNAL_SERVER_ERROR)"
            else:
                new_line = f"            return DashboardAPIResponse.error({message})"
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

content = '\n'.join(new_lines)

with open('dashboard/views.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Applied final fixes to dashboard responses')