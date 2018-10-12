import axios from 'axios';
import React from 'react';

export class LoadingBox extends React.Component {

    constructor(props) {
        super(props);

        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
        axios.defaults.xsrfCookieName = "csrftoken";

        this.getStatus = this.getStatus.bind(this);
        this.getStatus();

        this.state = {
            interval: setInterval(this.getStatus, 10000),
            updateInProgress: false,
            error: false,
            loading: true
        };
    }

    componentWillUnmount() {
        clearInterval(this.state.interval);
    }

    getStatus() {
        axios.get('/api/summaries/totals')
        .then(function(response) {
            if (response.data.in_progress) {
                this.setState(state => ({
                    updateInProgress: true,
                    error: false,
                    loading: false,
                    interval: state.interval
                }));
            } else {
                this.setState(state => ({
                    updateInProgress: false,
                    error: false,
                    loading: false,
                    interval: state.interval
                }));
            }
        }.bind(this))
        .catch(function(error) {
            this.setState(state => ({
                updateInProgress: false,
                error: true,
                loading: false,
                interval: state.interval
            }));
        }.bind(this));
    }

    render() {
        if (this.state.updateInProgress) return (
            <div className="empty">
                <div className="empty-icon">
                    <i className="icon icon-people"></i>
                </div>
                <p className="empty-title h5">You have no new messages</p>
                <p className="empty-subtitle">Click the button to start a conversation.</p>
                <div className="empty-action">
                    <button className="btn btn-primary">Send a message</button>
                </div>
            </div>
        );

        if (this.state.error || this.props.childError) return (
            <div className="empty">
                <div className="empty-icon">
                    <i className="icon icon-people"></i>
                </div>
                <p className="empty-title h5">You have no new messages</p>
                <p className="empty-subtitle">Click the button to start a conversation.</p>
                <div className="empty-action">
                    <button className="btn btn-primary">Send a message</button>
                </div>
            </div>
        );

        if (this.state.loading || this.props.childLoading) return (
            <div className="loading loading-lg"></div>
        );

        return (
            <React.Fragment>
                {this.props.children}
            </React.Fragment>
        );
    }
}