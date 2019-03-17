import React from 'react';

export class SwitchMenu extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (this.props.directories) {
            return (
                <ul className="menu menu-switch">
                    <li className="menu-item">
                        <a href="">
                            <span className="h5">
                                <i className="fa fa-fw fa-lg fa-folder-open-o"></i>
                                {this.props.currentDirectory}
                            </span>
                            <span className="text-gray">
                                &nbsp; (iRODS)
                            </span>
                        </a>
                    </li>
                    <li className="divider"></li>
                    <li className="menu-item">
                        <a href="">
                            <i className="fa fa-fw fa-lg fa-folder-o"></i>
                            .../home/thing
                            <small className="text-gray">&nbsp; (iRODS)</small>
                        </a>
                    </li>
                </ul>
            );
        } else {
            return (
                <ul className="menu menu-switch">
                    <li className="menu-item">
                        <a href="">
                            <span className="h5">
                                No directory loaded.
                            </span>
                        </a>
                    </li>
                </ul>
            );
        }
    }
}