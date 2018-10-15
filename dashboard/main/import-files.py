import json
import random

with open('files.json', 'r') as f:
    all_files = json.loads(f.read())

    for file in all_files:
        folder_names = file['folder'].split('/')
        
        folder_ptr = file_tree
        folder_ptr['size'] += file['size']

        for folder_name in folder_names:
            matching_child = next((c for c in folder_ptr['children'] if c['name'] == folder_name), None)
            if matching_child is None:
                matching_child = {
                    'name': folder_name,
                    'size': 0,
                    'children': []
                }
                folder_ptr['children'].append(matching_child)
            
            folder_ptr = matching_child
            folder_ptr['size'] += file['size']
        
        folder_ptr['children'].append({
            'name': file['name'],
            'size': file['size']
        })
    
    with open('randomfiles.json', 'w') as f2:
        f2.write(json.dumps(file_tree))
