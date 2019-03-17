import os
import sys
import hashlib
import getopt
import pickle
import datetime

'''
usage:

python crawl_dir.py <path> [<options>]

options:

-n --no-checksums   Do not calculate checksums for files (much faster)
-o --output         Specify an output file
'''


if len(sys.argv) < 2:
    print('Please specify a root directory.')
    sys.exit()

root = os.path.abspath(sys.argv[1])
files = []

for dirpath, dirnames, filenames in os.walk(root):
    for fname in filenames:
        path = '{}/{}'.format(dirpath, fname)
        try:
            with open(path, 'rb') as f:
                data = f.read()
            checksum = hashlib.md5(data).hexdigest()
        except:
            checksum = None
        created = os.path.getctime(path)
        size = os.path.getsize(path)
        files.append({
            'path': path,
            'checksum': checksum,
            'created': created,
            'size': size
        })
    sys.stdout.write('\rScanned {} files'.format(len(files)))
    sys.stdout.flush()

if not len(files):
    sys.stdout.write('\rFailed: No files found in {}\n'.format(root))
else:
    obj = {
        'format': 'datahog:0.1',
        'root': root,
        'date_scanned': datetime.datetime.now().timestamp(),
        'files': files
    }

    outname = os.path.basename(root)
    with open('{}.datahog'.format(outname), 'wb') as outfile:
        pickle.dump(obj, outfile)
    
    print('\nSaved output to {}.datahog'.format(outname))
