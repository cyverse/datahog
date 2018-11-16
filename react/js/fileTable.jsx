import React from 'react';
import { Size, ClickToCopy } from './util';

export function FileTable(props) {
    return (
        <table className='table file-table'>
            <thead className='light-head'>
                <tr>
                    <th>Name</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                {props.files.map(file => {
                    return <FileTableRow 
                            file={file} 
                            key={file.id} />
                })}
            </tbody>
        </table>
    );
}

export function FileTableRow(props) {
    let snippedName;
    if (props.file.name.length > 20) {
        snippedName = props.file.name.substring(0, 19) + '…';
    } else {
        snippedName = props.file.name;
    }
    return (
        <tr>
            <td>
                {snippedName}
                {props.file.path && <ClickToCopy text={props.file.path} />}
            </td>
            <td>
                <Size bytes={props.file.size || props.file.total_size}/>
            </td>
        </tr>
    );
}

