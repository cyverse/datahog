import axios from 'axios';
import React from 'react';

export class LoadingBox extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            updateInProgress: false,
            error: false,
            loading: true
        };

        this.checkForUpdate = this.checkForUpdate.bind(this);
        this.getFromServer = this.getFromServer.bind(this);

        this.interval = setInterval(this.checkForUpdate, 10000);

        if (props.checkForUpdate) {
            this.checkForUpdate();
        } else {
            this.getFromServer();
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    checkForUpdate() {
        if (this.props.checkForUpdate) {
            axios.get('/api/updates/latest')
            .then(function(response) {
                if (response.data.in_progress) {
                    this.setState({
                        updateInProgress: true,
                        error: false,
                        loading: false
                    });
                } else if (this.state.updateInProgress || this.state.error || this.state.loading) {
                    this.setState({
                        updateInProgress: false,
                        error: false,
                        loading: true
                    });
                    this.getFromServer();
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
    }

    getFromServer() {
        axios.get(this.props.get)
        .then(function(response) {
            this.setState({
                loading: false,
                updateInProgress: false,
                error: false
            });
            this.props.callback(response);
        }.bind(this))
        .catch(function(error) {
            this.setState({
                loading: false,
                updateInProgress: false,
                error: true
            })
        }.bind(this));
    }

    render() {
        if (this.state.updateInProgress) return (
            <div className="empty">
                <div className="empty-icon">
                    <div className="loading loading-lg"></div>
                </div>
                <p className="empty-title h5">A database update is in progress</p>
                <p className="empty-subtitle">This may take several minutes</p>
            </div>
        );

        if (this.state.error) return (
            <div className="empty">
                <div className="empty-icon">
                    <i className="icon icon-cross"></i>
                </div>
                <p className="empty-title h5">Unable to retrieve files</p>
                <p className="empty-subtitle">An error occurred, please try again later</p>
            </div>
        );

        if (this.state.loading) return (
            <div className="loading loading-lg"></div>
        );  

        return (
            <React.Fragment>
                {this.props.children}
            </React.Fragment>
        );
    }
}