import React from 'react';
import { Size } from './util';

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
                        return <SimpleFileTableRow 
                                file={file} 
                                key={file.id} 
                                onRowClick={this.props.onRowClick} 
                                selectedRow={this.props.selectedRow}/>
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
        return (
            <tr onClick={this.handleRowClick} 
                className={this.props.selectedRow && this.props.selectedRow === this ? 'selected' : ''}>
                <td>{this.props.file.name}</td>
                <td>
                    <Size bytes={this.props.file.size || this.props.file.total_size}/>
                </td>
                <td>
                    <i className="fa fa-fw fa-plus"></i>
                </td>
                <td>
                    <i className="fa fa-fw fa-clone"></i>
                </td>
            </tr>
        )
    }
}

