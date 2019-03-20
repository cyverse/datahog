import React from 'react';

export class SwitchMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            collapsed: true
        }
        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.switchDirectories = this.switchDirectories.bind(this);
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
            <ul className="menu menu-switch">
                <li className="menu-item">
                    <a onClick={this.toggleCollapse}>
                        <span className="h5">
                            <i className="fa fa-fw fa-lg fa-folder-open-o"></i>
                            {trimPath(this.props.directories[0].root_path, 20)}
                        </span>
                        <span className="text-gray">
                            &nbsp; ({this.props.directories[0].directory_type})
                        </span>
                        { this.props.directories.length > 1 && 
                            <span className="float-right">
                                <i className={this.state.collapsed ? 'fa fa-lg fa-caret-down' : 'fa fa-lg fa-caret-up'}></i>
                            </span>
                        }
                    </a>
                </li>
                { this.props.directories.length > 1 && !this.state.collapsed && 
                    <React.Fragment>
                        <li className="divider"></li>
                        {this.props.directories.map((directory, index) => {
                            if (index !== 0) return (
                                <li className="menu-item">
                                    <a href="">
                                        <span>
                                            <i className="fa fa-fw fa-lg fa-folder-o"></i>
                                            {trimPath(directory.root_path, 20)}
                                        </span>
                                        <small className="text-gray">&nbsp; ({directory.directory_type})</small>
                                    </a>
                                </li>
                            )
                        })}
                    </React.Fragment>
                }
            </ul>
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