import React from 'react';

import { trimPath } from './util';

export class SwitchMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            collapsed: true,
            toDelete: null
        }
        this.node = React.createRef();

        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleListClick = this.handleListClick.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
    }

    componentWillMount()   { document.addEventListener('mousedown', this.handleDocumentClick, false);    }
    componentWillUnmount() { document.removeEventListener('mousedown', this.handleDocumentClick, false); }

    handleDocumentClick(event) {
        if (!this.state.collapsed && !this.node.current.contains(event.target)) {
            this.toggleCollapse();
        }
    }

    handleListClick(event, directory) {
        if (event.target.classList.contains('delete-button')) {
            this.toggleModal(directory);
        } else {
            this.props.onChange(directory);
        }
    }

    toggleCollapse() {
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    toggleModal(toDelete) {
        if (this.state.toDelete) {
            this.setState({
                toDelete: null
            });
        } else if (toDelete) {
            this.setState({
                toDelete: toDelete
            });
        }
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
                                        <a onClick={event => this.handleListClick(event, directory)}>
                                            <span>
                                                <i className="fa fa-fw fa-lg fa-folder-o"></i>
                                                {trimPath(directory.root_path, 20)}
                                            </span>
                                            <small className="text-gray">&nbsp; ({directory.directory_type})</small>
                                            <small className="delete-button c-hand">Remove</small>
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
                <div className={this.state.toDelete ? 'modal active' : 'modal'} id="modal-id">
                    <a href="#close" className="modal-overlay" aria-label="Close"></a>
                    <div className="modal-container">
                        <div className="modal-header">
                            <div className="modal-title h5">Are you sure?</div>
                        </div>
                        <div className="modal-body">
                            <div className="content">
                                If you remove this directory, it will need to be re-imported in order to be viewed again.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => this.props.onDelete(this.state.toDelete)}>Remove</button>
                            <button className="btn btn-link" onClick={this.toggleModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}