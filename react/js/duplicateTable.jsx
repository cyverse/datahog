import React from 'react';
import { FileRow } from './fileTable';
import { Size } from './util';

export function DuplicateTable(props) {
    return (
        <table className='table file-table table-hover'>
            <tbody>
                {props.files.map((group, index) => {
                    return (
                        <DuplicateRow key={group.checksum} group={group} />
                    )
                })}
            </tbody>
        </table>
    );
}

export class DuplicateRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true
        };
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState((state) => ({
            collapsed: !state.collapsed
        }));
    }

    render() {
        let icon;
        if (this.state.collapsed) icon = 'fa-caret-right';
        else                      icon = 'fa-caret-down';
        return (
            <React.Fragment>
                <tr className="c-hand" onClick={this.handleClick}>
                    <td className="name-cell">
                        <i className={"fa fa-fw " + icon}/>
                        {this.props.group.file_count} duplicates of "{this.props.group.files[0].name}"
                    </td>
                    <td className="options-cell">
                        Total size:
                    </td>
                    <td className="size-cell">
                        <Size bytes={this.props.group.file_size * this.props.group.file_count}/>
                    </td>
                </tr>
                {!this.state.collapsed && this.props.group.files.map(file => (
                    <FileRow file={file} key={file.id} depth={1}/>
                ))}
            </React.Fragment>
        );
    }
}
