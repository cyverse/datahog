import React from 'react';
import { Size, SortHeader, ClickToCopy } from '../util';

export class DuplicateTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            sort: ''
        }
        this.resort = this.resort.bind(this);
    }

    resort(event) {
        let sortBy = event.target.dataset.sort;
        if (sortBy === '-total_size') {
            this.props.dupeGroups.sort((a, b) => b[0].size*b.length - a[0].size*a.length);
        } else if (sortBy === 'total_size') {
            this.props.dupeGroups.sort((a, b) => a[0].size*a.length - b[0].size*b.length);
        } else if (sortBy === '-file_size') {
            this.props.dupeGroups.sort((a, b) => b[0].size - a[0].size);
        } else if (sortBy === 'file_size') {
            this.props.dupeGroups.sort((a, b) => a[0].size - b[0].size);
        } else if (sortBy === '-file_count') {
            this.props.dupeGroups.sort((a, b) => b.length - a.length);
        } else if (sortBy === 'file_count') {
            this.props.dupeGroups.sort((a, b) => a.length - b.length);
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
                        <SortHeader title='Duplications' sortBy='file_count' currentSort={this.state.sort} onClick={this.resort}/>
                        <th className='options-cell'></th>
                        <SortHeader className='size-cell' title='File Size' sortBy='file_size' currentSort={this.state.sort} onClick={this.resort}/>
                        <SortHeader className='size-cell' title='Total Size' sortBy='total_size' currentSort={this.state.sort} onClick={this.resort}/>
                    </tr>
                </thead>
                <tbody>
                    {this.props.dupeGroups.map((group, index) => {
                        return (
                            <DupeGroupRow key={group[0].checksum} group={group} />
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