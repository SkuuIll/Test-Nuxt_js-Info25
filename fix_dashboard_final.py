#!/usr/bin/env python3

"""
Final fix for dashboard/views.py syntax errors
"""

def fix_dashboard_final():
    """Fix remaining syntax errors in dashboard views"""
    
    # Read the file
    with open('dashboard/views.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Process line by line to fix specific patterns
    fixed_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Fix DashboardAPIResponse.success patterns with missing closing brace
        if 'DashboardAPIResponse.success({' in line and i + 2 < len(lines):
            if lines[i + 2].strip() == ')':
                # Fix missing closing brace
                fixed_lines.append(line)
                fixed_lines.append(lines[i + 1])
                fixed_lines.append(lines[i + 2].replace(')', '})'))
                i += 3
                continue
        
        # Fix incomplete str(e) patterns
        if "'message': f'" in line and 'str(e' in line and not 'str(e)' in line:
            # Fix incomplete str(e) pattern
            line = line.replace('str(e', 'str(e)')
            if line.endswith('})}\'\n'):
                line = line.replace('})}\'\n', '\'\n')
            elif line.endswith(')}\'\n'):
                line = line.replace(')}\'\n', '\'\n')
        
        # Remove extra closing patterns
        if line.strip() in ['})}\'\n', '})\'\n', '})}\'\n', ')}\'\n']:
            i += 1
            continue
        
        # Fix malformed message patterns
        if "'data': message=f'" in line:
            line = line.replace("'data': message=f'", "'message': f'")
        
        fixed_lines.append(line)
        i += 1
    
    # Write the fixed content back
    with open('dashboard/views.py', 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print("✅ Applied final fixes to dashboard/views.py")

if __name__ == "__main__":
    fix_dashboard_final()