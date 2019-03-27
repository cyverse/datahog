import React from 'react';

export class SwitchMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            collapsed: true
        }
        this.node = React.createRef();

        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.switchDirectories = this.switchDirectories.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }

    componentWillMount()   { document.addEventListener('mousedown', this.handleDocumentClick, false);    }
    componentWillUnmount() { document.removeEventListener('mousedown', this.handleDocumentClick, false); }

    handleDocumentClick(event) {
        if (!this.state.collapsed && !this.node.current.contains(event.target)) {
            this.toggleCollapse();
        }
    }

    toggleCollapse() {
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    switchDirectories(dir) {
        this.props.onSwitch(dir);
    }

    render() {
        return (
            <React.Fragment>
                <ul className="menu directory-menu" ref={this.node}>
                    <li className="menu-item" key="0">
                        <a onClick={this.toggleCollapse}>
                            <span className="h5">
                                <i className="fa fa-fw fa-lg fa-folder-open-o"></i>
                                {trimPath(this.props.directories[0].root_path, 20)}
                            </span>
                            <span className="text-gray">
                                &nbsp; ({this.props.directories[0].directory_type})
                            </span>
                            <span className="collapse-icon">
                                <i className={this.state.collapsed ? 'fa fa-lg fa-caret-down' : 'fa fa-lg fa-caret-up'}></i>
                            </span>
                        </a>
                    </li>
                    { !this.state.collapsed && 
                        <React.Fragment>
                            <li className="divider" key="1"></li>
                            {this.props.directories.map((directory, index) => {
                                if (index !== 0) return (
                                    <li className="menu-item" key={directory.id}>
                                        <a onClick={() => this.props.onChange(directory)}>
                                            <span>
                                                <i className="fa fa-fw fa-lg fa-folder-o"></i>
                                                {trimPath(directory.root_path, 20)}
                                            </span>
                                            <small className="text-gray">&nbsp; ({directory.directory_type})</small>
                                            <button className="btn btn-link delete-button" onClick={event => {
                                                event.stopPropagation;
                                                this.props.onDelete(directory);
                                            }}>
                                                <small className="text-error">Delete</small>
                                            </button>
                                        </a>
                                    </li>
                                );
                            })}
                            <li className="menu-item" key="2">
                                <a href='/#/import' onClick={this.toggleCollapse}>
                                    <span className="text-right">
                                        <i className="fa fa-sm fa-fw fa-plus"></i>
                                        Import new directory
                                    </span>
                                </a>
                            </li>
                        </React.Fragment>
                    }
                </ul>
                <div className="modal" id="modal-id">
                    <a href="#close" className="modal-overlay" aria-label="Close"></a>
                    <div className="modal-container">
                        <div className="modal-header">
                            <div className="modal-title h5">Title</div>
                        </div>
                        <div className="modal-body">
                            <div className="content">
                                Content
                            </div>
                        </div>
                        <div className="modal-footer">
                            Footer
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export function trimPath(path, max) {
    if (!path) path = '';
    if (!max)  max = 30;
    
    if (path.length <= max) {
        return path;
    } else {
        let sub = path.substring(path.length-max+1);
        let slashPos = sub.indexOf('/');
        if (slashPos === -1) return '…' + sub;
        else                 return '…' + sub.substring(slashPos);
    }
}