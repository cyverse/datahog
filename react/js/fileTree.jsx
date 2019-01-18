import React from 'react';
import axios from 'axios';

import { Size, ClickToCopy } from './util';

export class FileTree extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sort: ''
        }

        this.resort = this.resort.bind(this);
    }

    resort(event) {
        let sortBy = event.target.dataset.sort;
        recursiveSort(this.props.files, sortBy);
        this.setState({
            sort: sortBy
        });
    }

    render() {
        return (
            <table className='table file-table table-hover'>
                <thead>
                    <tr>
                        <SortHeader title='Name' sortBy='name' currentSort={this.state.sort} onClick={this.resort}/>
                        <th className='options-cell'></th>
                        <SortHeader className='date-cell' title='Created' sortBy='date' currentSort={this.state.sort} onClick={this.resort}/>
                        <SortHeader className='size-cell' title='Size' sortBy='size' currentSort={this.state.sort} onClick={this.resort}/>
                    </tr>
                </thead>
                <tbody>
                    {this.props.files.map((file, index) => {
                        return (
                            <FileTreeNode key={file.id} file={file} depth={0} sort={this.state.sort}/>
                        )
                    })}
                </tbody>
            </table>
        );
    }
}

function recursiveSort(files, sortBy) {
    if (sortBy === 'name') {
        files.sort(function(a, b) {
            if (a.is_folder && !b.is_folder) return -1;
            if (b.is_folder && !a.is_folder) return 1;
            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
            if (b.name.toLowerCase() < a.name.toLowerCase()) return 1;
            return 0;
        });
    } else if (sortBy === '-name') {
        files.sort(function(a, b) {
            if (a.is_folder && !b.is_folder) return -1;
            if (b.is_folder && !a.is_folder) return 1;
            if (a.name.toLowerCase() < b.name.toLowerCase()) return 1;
            if (b.name.toLowerCase() < a.name.toLowerCase()) return -1;
            return 0;
        });
    } else if (sortBy === 'size') {
        files.sort(function(a, b) {
            if (a.is_folder && !b.is_folder) return -1;
            if (b.is_folder && !a.is_folder) return 1;
            if (a.is_folder) return b.total_size - a.total_size;
            else             return b.size - a.size;
        });
    } else if (sortBy === '-size') {
        files.sort(function(a, b) {
            if (a.is_folder && !b.is_folder) return -1;
            if (b.is_folder && !a.is_folder) return 1;
            if (a.is_folder) return a.total_size - b.total_size;
            else             return a.size - b.size;
        });
    } else if (sortBy === 'date') {
        files.sort(function(a, b) {
            if (a.is_folder && !b.is_folder) return -1;
            if (b.is_folder && !a.is_folder) return 1;
            if (a.is_folder) return 0;
            if (a.date_created < b.date_created) return 1;
            if (a.date_created > b.date_created) return -1;
            return 0;
        });
    } else if (sortBy === '-date') {
        files.sort(function(a, b) {
            if (a.is_folder && !b.is_folder) return -1;
            if (b.is_folder && !a.is_folder) return 1;
            if (a.is_folder) return 0;
            if (a.date_created < b.date_created) return -1;
            if (a.date_created > b.date_created) return 1;
            return 0;
        });
    }
    for (let file of files) {
        if (file.children) {
            recursiveSort(file.children, sortBy);
        }
    }
}

export function SortHeader(props) {
    let sortDirection;
    if (props.currentSort === props.sortBy) {
        sortDirection = 1;
    } else if (props.currentSort === '-' + props.sortBy) {
        sortDirection = -1;
    } else {
        sortDirection = 0;
    }
    return (
        <th className={props.className}>
            <a className='btn btn-link'
                onClick={props.onClick}
                data-sort={sortDirection > 0 ? '-' + props.sortBy : props.sortBy}>
                {props.title} &nbsp;
                {sortDirection > 0 && <i className='fa fa-caret-down'></i>}
                {sortDirection < 0 && <i className='fa fa-caret-up'></i>}
            </a>
        </th>
    );
}

export class FileTreeNode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true,
            childrenLoaded: props.file.children !== undefined
        };

        this.handleClick = this.handleClick.bind(this);
        this.receiveChildren = this.receiveChildren.bind(this);
    }

    handleClick() {
        if (this.state.collapsed) {
            if (this.state.childrenLoaded) {
                this.setState({
                    collapsed: false
                });
            } else {
                axios.get('/api/files/' + this.props.file.id + '/children')
                .then(this.receiveChildren)
                .catch(function(error) {
                    console.log(error);
                });
            }
        } else {
            this.setState({
                collapsed: true
            });
        }
    }

    receiveChildren(response) {
        this.props.file.children = response.data;
        recursiveSort(this.props.file.children, this.props.sort);
        this.setState({
            collapsed: false,
            childrenLoaded: true
        });
    }

    render() {
        if (this.props.file.is_folder) {
            let icon;
            if      (this.state.collapsed)      icon = 'fa-caret-right';
            else if (this.state.childrenLoaded) icon = 'fa-caret-down';
            else                                icon = ''

            return (
                <React.Fragment>
                    <tr className="c-hand" onClick={this.handleClick}>
                        <td className="name-cell" style={{paddingLeft: 30*this.props.depth}}>
                            <i className={"fa fa-fw " + icon}/>
                            {this.props.file.name}
                        </td>
                        <td className="options-cell"></td>
                        <td className="date-cell"></td>
                        <td className="size-cell">
                            <Size bytes={this.props.file.total_size}/>
                        </td>
                    </tr>
                    {this.state.childrenLoaded && !this.state.collapsed && 
                        this.props.file.children.map(child => {
                        return <FileTreeNode 
                                file={child} 
                                key={child.id}
                                depth={this.props.depth + 1}
                                sort={this.props.sort}/>
                        })
                    }
                </React.Fragment>
            );
        } else {
            return (
                <tr>
                    <td className="name-cell" style={{paddingLeft: 30*this.props.depth}}>
                        {this.props.file.name}
                    </td>
                    <td className="options-cell">
                        <ClickToCopy text={this.props.file.path}>Copy path</ClickToCopy>
                    </td>
                    <td className="date-cell">
                        {this.props.file.date_created}
                    </td>
                    <td className="size-cell">
                        <Size bytes={this.props.file.size}/>
                    </td>
                </tr>
            );
        }
    }
}
