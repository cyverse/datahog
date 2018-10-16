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
        axios.get('/api/updates/latest')
        .then(function(response) {
            if (response.data.in_progress) {
                this.setState({
                    updateInProgress: true,
                    error: false,
                    loading: false
                });
            } else {
                this.setState({
                    updateInProgress: false,
                    error: false,
                    loading: false
                });
            }
        }.bind(this))
        .catch(function(error) {
            this.setState({
                updateInProgress: false,
                error: true,
                loading: false
            });
        }.bind(this));
    }

    render() {
        if (this.state.updateInProgress || this.props.childUpdateInProgress) return (
            <div className="empty">
                <div className="empty-icon">
                    <div className="loading loading-lg"></div>
                </div>
                <p className="empty-title h5">A database update is in progress</p>
                <p className="empty-subtitle">This may take several minutes</p>
            </div>
        );

        if (this.state.error || this.props.childError) return (
            <div className="empty">
                <div className="empty-icon">
                    <i className="icon icon-cross"></i>
                </div>
                <p className="empty-title h5">Unable to retrieve files</p>
                <p className="empty-subtitle">An error occurred, please try again later</p>
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