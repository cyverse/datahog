import React from 'react';
import axios from 'axios';

import { Size } from './util';
import { FileRow } from './fileTable';

export function FileTree(props) {
    return (
        <table className='table file-table table-hover'>
            <tbody>
                {props.files.map((file, index) => {
                    return (
                        <FileTreeNode key={file.id} file={file} depth={0} />
                    )
                })}
            </tbody>
        </table>
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
                        <td className="size-cell">
                            <Size bytes={this.props.file.total_size}/>
                        </td>
                    </tr>
                    {this.state.childrenLoaded && !this.state.collapsed && 
                        this.props.file.children.map(child => {
                        return <FileTreeNode 
                                file={child} 
                                key={child.id}
                                depth={this.props.depth + 1}/>
                        })
                    }
                </React.Fragment>
            );
        } else {
            return (
                <FileRow file={this.props.file} depth={this.props.depth}/>
            );
        }
    }
}
