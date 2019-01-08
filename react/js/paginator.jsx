import React from 'react';
import axios from 'axios';

export class Paginator extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            enabled: false,
            prev: null,
            next: null,
            page: 0,
            pageSize: 0
        };

        this.prevPage = this.prevPage.bind(this);
        this.nextPage = this.nextPage.bind(this);
        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);

        axios.get(this.props.get + '?limit=' + this.props.limit)
        .then(this.onLoad)
        .catch(this.onError);
    }

    onLoad(response) {
        this.props.onLoad(response.data.results);
        this.setState({
            enabled: true,
            prev: response.data.previous,
            next: response.data.next,
            pageSize: response.data.results.length
        });
    }

    onError(error) {
        this.props.onError();
        this.setState({
            enabled: false,
            prev: null,
            next: null,
            pageSize: 0
        });
    }

    nextPage() {
        this.props.onClick();

        axios.get(this.props.get + '?limit=' + this.props.limit + '&offset=' + (this.state.page+1)*10)
        .then(this.onLoad)
        .catch(this.onError);

        this.setState({
            enabled: false,
            page: this.state.page + 1
        });
    }

    prevPage() {
        this.props.onClick();

        axios.get(this.props.get + '?limit=' + this.props.limit + '&offset=' + (this.state.page-1)*10)
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
                    {(this.state.page*10 + 1) + 
                        '-' + (this.state.page*10 + this.state.pageSize)
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