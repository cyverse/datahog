import os
import sys
import hashlib
import getopt
import pickle
import datetime

help_msg = '''
Usage:

python datahog_crawler.py <root path> [options]

Options:

-n --no-checksums    Do not calculate checksums for files (much faster)
-o --output          Specify an output file
'''

if len(sys.argv) < 2:
    print(help_msg) 
    sys.exit()

root_path = os.path.abspath(sys.argv[1])
output_path = '{}.datahog'.format(os.path.basename(root_path))
gen_checksums = True
has_checksums = gen_checksums
files = []
problem_files = []

try:
    opts, args = getopt.getopt(sys.argv[2:], 'o:n', ['output=', 'no-checksums'])
except getopt.GetoptError as err:
    print(err)
    sys.exit(0)

for o, a in opts:
    if o in ('-n', '--no-checksums'):
        gen_checksums = False
    elif o in ('-o', '--output'):
        output_path = a
        if not os.path.isdir(os.path.dirname(os.path.abspath(output_path))):
            print('Failed: "{}" is not a valid output path.'.format(output_path))
            sys.exit()

for dirpath, dirnames, filenames in os.walk(root_path):
    for fname in filenames:
        path = '{}/{}'.format(dirpath, fname)
        
        try:
            created = os.path.getctime(path)
            size = os.path.getsize(path)
        except:
            problem_files.append(path)
            continue
        
        if gen_checksums:
            try:
                with open(path, 'rb') as f:
                    data = f.read()
                checksum = hashlib.md5(data).hexdigest()
            except:
                has_checksums = False
                checksum = None
        else:
            checksum = None
        
        files.append({
            'path': path,
            'checksum': checksum,
            'created': created,
            'size': size
        })

    sys.stdout.write('\rScanned {} files'.format(len(files)))
    sys.stdout.flush()

if not len(files):
    sys.stdout.write('\rFailed: No files found in "{}".\n'.format(sys.argv[1]))
    sys.exit(0)

obj = {
    'format': 'datahog:0.1',
    'root': root_path,
    'type': 'Local folder',
    'date_scanned': datetime.datetime.now().timestamp(),
    'files': files,
    'has_checksums': has_checksums
}

with open(output_path, 'wb') as outfile:
    pickle.dump(obj, outfile)

if len(problem_files) > 10:
    problem_path = 'datahog_problem_files.txt'
    with open(problem_path, 'w') as pfile:
        for path in problem_files:
            pfile.write('{}\n'.format(path))
    print('\n\nEncountered a problem reading {} files (list saved to {})'.format(len(problem_files), problem_path))

elif len(problem_files) > 0:
    print('\n\nEncountered a problem reading the following files:')
    for file in problem_files:
        print(file)

print('\nSaved output to {}'.format(output_path))
