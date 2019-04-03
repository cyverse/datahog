import React from 'react';
import { FileRow } from './fileTable';
import { Size, trimPath } from './util';

export class DuplicateTable extends React.Component {

    constructor(props) {
        this.state = {
            sort: ''
        }

        this.resort = this.resort.bind(this);
    }

    resort(event) {
        let sortBy = event.target.dataset.sort;
        if (this.props.searchOnSort) {
            this.props.params.sort = sortBy;
            this.props.searchCallback(this.props.params);
        } else {
            if (sortBy === '-total_size') {
                files.sort((a, b) => b.file_size*b.file_count - a.file_size*a.file_count);
            } else if (sortBy === 'total_size') {
                files.sort((a, b) => a.file_size*a.file_count - b.file_size*b.file_count);
            } else if (sortBy === '-file_size') {
                files.sort((a, b) => b.file_size - a.file_size);
            } else if (sortBy === 'file_size') {
                files.sort((a, b) => a.file_size - b.file_size);
            } else if (sortBy === '-file_count') {
                files.sort((a, b) => b.file_count - a.file_count);
            } else if (sortBy === 'file_count') {
                files.sort((a, b) => a.file_count - b.file_count);
            }
        }
        this.setState({
            sort: sortBy
        });
    }

    render() {
        return (
            <table className='table file-table table-hover'>
                <thead>
                    <tr>
                        <SortHeader title='Count' sortBy='file_count' currentSort={this.state.sort} onClick={this.resort}/>
                        <th className='options-cell'></th>
                        <SortHeader className='size-cell' title='File Size' sortBy='file_size' currentSort={this.state.sort} onClick={this.resort}/>
                        <SortHeader className='size-cell' title='Total Size' sortBy='total_size' currentSort={this.state.sort} onClick={this.resort}/>
                    </tr>
                </thead>
                <tbody>
                    {props.dupeGroups.map((group, index) => {
                        return (
                            <DupeGroupRow key={group.checksum} group={group} />
                        )
                    })}
                </tbody>
            </table>
        );
    }
}



export class DupeGroupRow extends React.Component {
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
                    <td className="options-cell"></td>
                    <td className="size-cell">
                        <Size bytes={this.props.group.file_size}/>
                    </td>
                    <td className="size-cell">
                        <Size bytes={this.props.group.file_size * this.props.group.file_count}/>
                    </td>
                </tr>
                {!this.state.collapsed && this.props.group.files.map(file => (
                    <DuplicateFileRow crossDirectory={this.props.crossDirectory} file={file} key={file.id} />
                ))}
            </React.Fragment>
        );
    }
}


export function DuplicateFileRow(props) {
    return (
        <tr>
            <td className="name-cell" style={{paddingLeft: 30*props.depth}}>
                {props.file.name}
                {props.crossDirectory && '(' + trimPath(props.file.directory.root_path, 20) + ')'}
            </td>
            <td className="options-cell">
                <ClickToCopy text={props.file.path}>Copy path</ClickToCopy>
            </td>
            <td className="size-cell"></td>
            <td className="size-cell"></td>
        </tr>
    );  
}