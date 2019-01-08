import React from 'react';
import { Paginator } from './paginator';

export class PaginatedPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            loading: true,
            error: false
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        this.setState({
            loading: true
        });
    }

    onLoad(files) {
        this.setState({
            files: files,
            loading: false,
            error: false
        });
    }

    onError(error) {
        this.setState({
            files: [],
            loading: false,
            error: true
        });
    }

    render() {
        let panelBody;
        if (this.state.error) {
            panelBody = <div>An error occurred.</div>
        } else if (this.state.loading) {
            panelBody = <div className="loading"></div>
        } else {
            panelBody = <this.props.component files={this.state.files}/>
        }

        return (
            <div className={this.props.scroll ? "panel fixed-height" : "card fixed-height"}>
                <div className={this.props.scroll ? "panel-header" : "card-header"}>
                    <div className={this.props.scroll ? "panel-title h5" : "card-title h5"}>
                        {this.props.title}
                    </div>
                </div>
                <div className={this.props.scroll ? "panel-body" : "card-body"}>
                    {panelBody}
                </div>
                <div className={this.props.scroll ? "panel-footer" : "card-footer"}>
                    <Paginator
                        get={this.props.get}
                        limit={10}
                        onLoad={this.onLoad}
                        onError={this.onError}
                        onClick={this.onClick}
                    />
                </div>
            </div>
        );
    }
}