import React from 'react';
import { Size, SortHeader, ClickToCopy } from '../util';

/**
 * A sortable table of DupeGroupRows.
 */
export class DuplicateTable extends React.Component {

    constructor(props) {
        super(props);
        this.resort = this.resort.bind(this);
    }

    resort(event) {
        let sortBy = event.target.dataset.sort;
        if (!this.props.searchOnSort) {
            if (sortBy === '-total_size') {
                this.props.dupeGroups.sort((a, b) => b[0].size*b.length - a[0].size*a.length);
            } else if (sortBy === 'total_size') {
                this.props.dupeGroups.sort((a, b) => a[0].size*a.length - b[0].size*b.length);
            } else if (sortBy === '-size') {
                this.props.dupeGroups.sort((a, b) => b[0].size - a[0].size);
            } else if (sortBy === 'size') {
                this.props.dupeGroups.sort((a, b) => a[0].size - b[0].size);
            } else if (sortBy === '-dupe_count') {
                this.props.dupeGroups.sort((a, b) => b.length - a.length);
            } else if (sortBy === 'dupe_count') {
                this.props.dupeGroups.sort((a, b) => a.length - b.length);
            }
        }
        this.props.onResort(sortBy);
    }

    render() {
        return (
            <table className='table file-table table-hover'>
                <thead>
                    <tr>
                        <SortHeader title='Duplications' sortBy='dupe_count' currentSort={this.props.sort} onClick={this.resort}/>
                        <th className='options-cell'></th>
                        <SortHeader className='size-cell' title='File Size' sortBy='size' currentSort={this.props.sort} onClick={this.resort}/>
                        <SortHeader className='size-cell' title='Total Size' sortBy='total_size' currentSort={this.props.sort} onClick={this.resort}/>
                    </tr>
                </thead>
                <tbody>
                    {this.props.dupeGroups.map((group, index) => {
                        return (
                            <DupeGroupRow key={index} group={group} />
                        )
                    })}
                </tbody>
            </table>
        );
    }
}

/**
 * A collapsible row representing a group of duplicate files.
 */
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
                <tr className="c-hand" onClick={this.handleClick} >
                    <td className="name-cell">
                        <i className={"fa fa-fw " + icon}/>
                        {this.props.group.length} duplicates of "{this.props.group[0].name}"
                    </td>
                    <td className="options-cell"></td>
                    <td className="size-cell">
                        <Size bytes={this.props.group[0].size}/>
                    </td>
                    <td className="size-cell">
                        <Size bytes={this.props.group[0].size * this.props.group.length}/>
                    </td>
                </tr>
                {!this.state.collapsed && this.props.group.map(file => (
                    <DuplicateFileRow file={file} key={file.id} />
                ))}
            </React.Fragment>
        );
    }
}

/**
 * A child of a DupeGroupRow, representing a single file instance.
 */
export function DuplicateFileRow(props) {
    return (
        <tr>
            <td className="name-cell" style={{paddingLeft: 30}}>
                {props.file.name}
                <span className="text-gray">{' (' + props.file.directory_name + ')'}</span>
            </td>
            <td className="options-cell">
                <ClickToCopy text={props.file.path}>Copy path</ClickToCopy>
            </td>
            <td className="size-cell"></td>
            <td className="size-cell"></td>
        </tr>
    );  
}