import React from 'react';
import axios from 'axios';

export class FileTableRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true,
            childrenLoaded: props.file.children !== undefined
        };

        this.toggle = this.toggle.bind(this);
        this.receiveChildren = this.receiveChildren.bind(this);
        this.handleRowClick = this.handleRowClick.bind(this);
    }
    toggle() {
        if (this.state.collapsed) {
            if (this.state.childrenLoaded) {
                this.setState({
                    collapsed: false,
                    childrenLoaded: true
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
                collapsed: true,
                childrenLoaded: true
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
    handleRowClick(event) {
        if (event.target.nodeName !== 'I') {
            this.props.onRowClick(this);
        }
    }
    render() {
        let rawSize = this.props.file.size;
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

        if (this.props.file.is_folder) {
            let icon;
            if (this.state.collapsed) icon = 'fa-plus';
            else                      icon = 'fa-minus';

            return (
                <React.Fragment>
                    <tr onClick={this.handleRowClick} className={this.props.selectedRow && this.props.selectedRow === this ? 'selected' : ''}>
                        <td style={{
                            paddingLeft: 30*this.props.depth
                        }}>
                            <i onClick={this.toggle} className={"fa fa-fw " + icon}/>
                            <span>
                                {this.props.file.name}
                            </span>
                        </td>
                        <td>{formattedSize}</td>
                    </tr>
                    {this.state.childrenLoaded && !this.state.collapsed && 
                     this.props.file.children.map(child => {
                        return <FileTableRow 
                                file={child} 
                                key={child.id}
                                onRowClick={this.props.onRowClick} 
                                selectedRow={this.props.selectedRow}
                                depth={this.props.depth + 1}/>
                     })}
                </React.Fragment>
            )
        } else {
            return (
                <tr onClick={this.handleRowClick} className={this.props.selectedRow && this.props.selectedRow === this ? 'selected' : ''}>
                    <td style={{
                        paddingLeft: 30*this.props.depth
                    }}>
                        {this.props.file.name}</td>
                    <td>{formattedSize}</td>
                </tr>
            )
        }
    }
}

