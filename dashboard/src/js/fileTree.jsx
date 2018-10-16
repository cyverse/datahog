import React from 'react';
import axios from 'axios';

import { Size } from './util';

export function FileTree(props) {
    return (
        <table className='table file-table table-hover'>
            <thead className='light-head'>
                <tr>
                    <th>Name</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                {props.files.map(file => {
                    return <FileTreeNode 
                            file={file} 
                            key={file.id}
                            depth={0} />
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
                        <td style={{paddingLeft: 30*this.props.depth}}>
                            <i className={"fa fa-fw " + icon}/>
                            {this.props.file.name}
                        </td>
                        <td>
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
                <tr>
                    <td style={{paddingLeft: 30*this.props.depth}}>
                        {this.props.file.name}
                    </td>
                    <td>
                        <Size bytes={this.props.file.size}/>
                    </td>
                </tr>
            );
        }
    }
}
