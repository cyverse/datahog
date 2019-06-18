import React from 'react';
import axios from '../axios';

/**
 * A set of "next/previous" buttons for pagination.
 * Handles GET requests and tracking the current offset.
 */
export class Paginator extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            enabled: false,
            prev: false,
            next: false,
            page: 0,
            pageSize: 0
        };

        this.prevPage = this.prevPage.bind(this);
        this.nextPage = this.nextPage.bind(this);
        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        
        this.cancelToken = axios.CancelToken.source();
        axios.get(this.props.get, {
            params: Object.assign({
                limit: this.props.pageSize
            }, this.props.params),
            cancelToken: this.cancelToken.token
        })
        .then(this.onLoad)
        .catch(this.onError);
    }

    componentWillUnmount() {
        if (this.cancelToken) this.cancelToken.cancel();
    }

    onLoad(response) {
        this.props.onLoad(response.data.page, this.state.page);
        this.setState({
            enabled: true,
            prev: this.state.page > 0,
            next: (this.state.page+1) * this.props.pageSize < response.data.total,
            pageSize: response.data.page.length
        });
    }

    onError(error) {
        this.props.onError();
        this.setState({
            enabled: false,
            prev: false,
            next: false,
            pageSize: 0
        });
    }

    nextPage() {
        this.props.onClick();

        if (this.cancelToken) this.cancelToken.cancel();
        this.cancelToken = axios.CancelToken.source();

        axios.get(this.props.get, {
            params: Object.assign({
                limit: this.props.pageSize,
                offset: (this.state.page+1)*this.props.pageSize
            }, this.props.params),
            cancelToken: this.cancelToken.token
        })
        .then(this.onLoad)
        .catch(this.onError);

        this.setState({
            enabled: false,
            page: this.state.page + 1
        });
    }

    prevPage() {
        this.props.onClick();

        if (this.cancelToken) this.cancelToken.cancel();
        this.cancelToken = axios.CancelToken.source();

        axios.get(this.props.get, {
            params: Object.assign({
                limit: this.props.pageSize,
                offset: (this.state.page-1)*this.props.pageSize
            }, this.props.params),
            cancelToken: this.cancelToken.token
        })
        .then(this.onLoad)
        .catch(this.onError);
        
        this.setState({
            enabled: false,
            page: this.state.page - 1
        });
    }

    render() {
        return (
            <div className="paginator">
                <div className="float-left text-gray">
                    {
                        (this.state.page*this.props.pageSize + 1) + 
                        '-' + (this.state.page*this.props.pageSize + this.state.pageSize)
                    }
                </div>
                <div className="btn-group float-right">
                    <button className="btn btn-action btn-sm" 
                        onClick={this.prevPage}
                        disabled={!this.state.enabled || !this.state.prev}>
                            <i className="fa fa-caret-left"></i>
                        </button>
                    <button className="btn btn-action btn-sm"
                        onClick={this.nextPage}
                        disabled={!this.state.enabled || !this.state.next}>
                            <i className="fa fa-caret-right"></i>
                    </button>
                </div>
            </div>
        );
    }
}