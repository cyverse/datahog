import React from 'react';

export class SimpleFileTable extends React.Component {
    render() {
        return (
            <table>
                <thead>
                    <tr>
                        <th>{this.props.title}</th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.files.map(file => {
                        return <FileTableRow 
                                file={file} 
                                key={file.id} 
                                onRowClick={this.props.onRowClick} 
                                selectedRow={this.props.selectedRow}
                                depth={0}/>
                    })}
                </tbody>
            </table>
        );
    }
}

export class SimpleFileTableRow extends React.Component {
    constructor(props) {
        super(props);
        this.handleRowClick = this.handleRowClick.bind(this);
    }
    handleRowClick() {
        this.props.onRowClick(this);
    }
    render() {
        let rawSize = this.props.file.size ? this.props.file.size : this.props.file.total_size;
        let formattedSize;
        if (rawSize < 1000)
            formattedSize = rawSize + ' B';
        else if (rawSize < 1000000)
            formattedSize = rawSize/1000 + ' kB';
        else if (rawSize < 1000000000)
            formattedSize = rawSize/1000000 + ' MB';
        else if (rawSize < 1000000000000)
            formattedSize = rawSize/1000000000 + ' GB';
        else if (rawSize < 1000000000000000)
            formattedSize = rawSize/1000000000000 + ' TB';

        return (
            <tr onClick={this.handleRowClick} 
                className={this.props.selectedRow && this.props.selectedRow === this ? 'selected' : ''}>
                <td>{this.props.file.name}</td>
                <td>{formattedSize}</td>
            </tr>
        )
    }
}

