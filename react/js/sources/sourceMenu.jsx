import React from 'react';

import { ImportModal } from './modals';

export class SourceMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            collapsed: true,
            showModal: false
        }
        this.node = React.createRef();

        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
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

    toggleModal() {
        this.setState({
            collapsed: true,
            showModal: !this.state.showModal
        });
    }

    render() {
        return (
            <div className="source-menu-wrapper">
                {this.props.sources.length && 
                    <ul className="menu" ref={this.node}>
                        <li className="menu-item" key="0">
                            <a onClick={this.toggleCollapse}>
                                <span className="h5">
                                    <i className="fa fa-fw fa-lg fa-folder-open-o"></i>
                                    {this.props.sources[0].name}
                                </span>
                                <span className="text-gray">
                                    &nbsp; ({this.props.sources[0].directory_type})
                                </span>
                                <span className="collapse-icon">
                                    <i className={this.state.collapsed ? 'fa fa-lg fa-caret-down' : 'fa fa-lg fa-caret-up'}></i>
                                </span>
                            </a>
                        </li>
                        { !this.state.collapsed && 
                            <React.Fragment>
                                <li className="divider" key="1"></li>
                                {this.props.sources.map((directory, index) => {
                                    if (index !== 0) return (
                                        <li className="menu-item" key={directory.id}>
                                            <a onClick={() => this.props.onChange(directory)}>
                                                <span>
                                                    <i className="fa fa-fw fa-lg fa-folder-o"></i>
                                                    {directory.name}
                                                </span>
                                                <small className="text-gray">&nbsp; ({directory.directory_type})</small>
                                            </a>
                                        </li>
                                    );
                                })}
                                <li className="menu-item" key="2">
                                    <a onClick={this.toggleModal}>
                                        <span className="text-right">
                                            <i className="fa fa-sm fa-fw fa-plus"></i>
                                            Import new directory
                                        </span>
                                    </a>
                                </li>
                            </React.Fragment>
                        }
                    </ul>
                }
                <ImportModal active={this.state.showModal} onToggle={this.toggleModal}/>
            </div>
        );
    }
}