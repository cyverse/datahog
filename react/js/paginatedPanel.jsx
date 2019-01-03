import React from 'react';
import axios from 'axios';

export class PaginatedPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            loading: true,
            error: false,
            prev: null,
            next: null,
            page: 0
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.prevPage = this.prevPage.bind(this);
        this.nextPage = this.nextPage.bind(this);

        axios.get(this.props.get + '?limit=10')
        .then(this.onLoad)
        .catch(this.onError);
    }

    onLoad(response) {
        this.setState({
            files: response.data.results,
            loading: false,
            error: false,
            prev: response.data.previous,
            next: response.data.next
        });
    }

    onError(error) {
        this.setState({
            files: [],
            loading: false,
            error: true,
            prev: null,
            next: null
        });
    }

    nextPage() {
        axios.get(this.props.get + '?limit=10&offset=' + (this.state.page+1)*10)
        .then(this.onLoad)
        .catch(this.onError);

        this.setState({
            loading: true,
            page: this.state.page + 1
        });
    }

    prevPage() {
        axios.get(this.props.get + '?limit=10&offset=' + (this.state.page-1)*10)
        .then(this.onLoad)
        .catch(this.onError);
        
        this.setState({
            loading: true,
            page: this.state.page - 1
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
                    <div className={this.props.scroll ? "panel-title h5" : "card-title h5"}>{this.props.title}</div>
                </div>
                <div className={this.props.scroll ? "panel-body" : "card-body"}>
                    {panelBody}
                </div>
                <div className={this.props.scroll ? "panel-footer" : "card-footer"}>
                    <div className="float-left text-gray">
                        {!this.state.loading && (this.state.page*10 + 1) + '-' + (this.state.page*10 + this.state.files.length)}
                    </div>
                    <div className="btn-group float-right">
                        <button className="btn btn-action btn-sm" 
                            onClick={this.prevPage}
                            disabled={this.state.loading || !this.state.prev}>
                                <i className="fa fa-caret-left"></i>
                            </button>
                        <button className="btn btn-action btn-sm"
                            onClick={this.nextPage}
                            disabled={this.state.loading || !this.state.next}>
                                <i className="fa fa-caret-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}