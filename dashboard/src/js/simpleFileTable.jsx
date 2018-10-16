import React from 'react';
import { Size, ClickToCopy } from './util';

export class SimpleFileTable extends React.Component {
    render() {
        return (
            <table className='table file-table'>
                <thead className='light-head'>
                    <tr>
                        <th>Name</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.files.map(file => {
                        return <SimpleFileTableRow 
                                file={file} 
                                key={file.id} />
                    })}
                </tbody>
            </table>
        );
    }
}

export class SimpleFileTableRow extends React.Component {
    render() {
        return (
            <tr>
                <td>
                    {this.props.file.name}
                    {this.props.file.path && <ClickToCopy text={this.props.file.path} />}
                </td>
                <td>
                    <Size bytes={this.props.file.size || this.props.file.total_size}/>
                </td>
            </tr>
        )
    }
}

