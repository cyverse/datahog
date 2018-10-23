import json
import getopt
import sys
import time
from irods.session import iRODSSession
from irods.models import DataObject, Collection
from irods.column import Between

'''
usage:

python irods_file_list.py <arguments>

arguments:

-u --username   irods username
-w --password   irods password
-h --host       irods host
-p --port       irods port
-z --zone       irods zone
-f --folder     directory to retrieve files from
-o --output     file to output JSON to
-s --sample     only get one batch of files
'''

def irods_file_list(user, password, host, port, zone, folder, output, sample=False):
    timer = time.time()
    with iRODSSession(host=host, port=port, user=user, zone=zone, password=password) as session:

        all_files = []
        def append_row(row):
            all_files.append({
                'collection': row[Collection.name],
                'name': row[DataObject.name],
                'checksum': row[DataObject.checksum],
                'size': row[DataObject.size],
                'created': str(row[DataObject.create_time])
            })
        
        query = session.query(
            Collection.name, 
            DataObject.name, 
            DataObject.checksum, 
            DataObject.size, 
            DataObject.create_time
        ).filter(
            Between(Collection.name, (folder, folder+'~'))
        ).filter(
            DataObject.replica_number == 0
        ).limit(1000)

        print('authentication successful. waiting for irods server...')
        if sample:
            for row in query.all():
                append_row(row)
        else:
            batch_num = 0
            for result_set in query.get_batches():
                batch_num += 1
                print('received {} batches'.format(batch_num))
                for row in result_set:
                    append_row(row)

    with open(output, 'w') as f:
        f.write(json.dumps(all_files))
    
    timer = time.time() - timer
    print('completed in {} seconds'.format(timer))


def main():
    try:
        opts, args = getopt.getopt(sys.argv[1:], 'u:w:h:p:z:f:o:s', ['username=', 'password=', 'host=', 'port=', 'zone=', 'folder=', 'output=', 'sample'])
    except getopt.GetoptError as err:
        print(err)
        sys.exit(2)
    
    sample = False
    for o, a in opts:
        if o in ('-u', '--username'):
            username = a
        elif o in ('-w', '--password'):
            password = a
        elif o in ('-h', '--host'):
            host = a
        elif o in ('-p', '--port'):
            port = a
        elif o in ('-z', '--zone'):
            zone = a
        elif o in ('-f', '--folder'):
            folder = a
        elif o in ('-o', '--output'):
            output = a
        elif o in ('-s', '--sample'):
            sample = True
    
    irods_file_list(username, password, host, port, zone, folder, output, sample)

if __name__ == '__main__':
    main()