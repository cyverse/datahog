import React from 'react';
import { Size, ClickToCopy } from '../util';

export function FileTable(props) {
    return (
        <table className='table file-table table-hover'>
            <tbody>
                {props.files.map(file => {
                    return <FileRow 
                            file={file} 
                            key={file.id} 
                            showDate={props.showDate}/>
                })}
            </tbody>
        </table>
    );
}

export function FileRow(props) {
    return (
        <tr>
            <td className="name-cell">
                {props.file.name || props.file.extension}
            </td>
            { props.file.path && 
                <td className="options-cell">
                    <ClickToCopy text={props.file.path}>Copy path</ClickToCopy>
                </td>
            }
            { props.showDate ?
                <td className="date-cell">
                    {props.file.date_created}
                </td> :
                <td className="size-cell">
                    <Size bytes={props.file.size !== undefined ? props.file.size : props.file.total_size}/>
                </td>
            }
        </tr>
    );
}

