import os
import sys
import hashlib
import getopt
import pickle

if len(sys.argv) < 2:
    print('Please specify a root directory.')
    sys.exit()

root = os.path.abspath(sys.argv[1])
files = []

for dirpath, dirnames, filenames in os.walk(root):
    for fname in filenames:
        path = '{}/{}'.format(dirpath, fname)
        with open(path, 'rb') as f:
            data = f.read()
        checksum = hashlib.md5(data).hexdigest()
        modified = os.path.getmtime(path)
        size = os.path.getsize(path)
        files.append({
            'path': path,
            'checksum': checksum,
            'modified': modified,
            'size': size
        })
    sys.stdout.write('\rScanned {} files'.format(len(files)))
    sys.stdout.flush()

if not len(files):
    sys.stdout.write('\rFailed: No files found in {}\n'.format(root))
else:
    outname = os.path.basename(root)
    with open('{}.dh'.format(outname), 'wb') as outfile:
        pickle.dump(files, outfile)

    print('\nSaved output to {}.dh'.format(outname))
