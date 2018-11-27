import axios from 'axios';
import React from 'react';

export const UpdateContext = React.createContext(null);

export class UpdateBox extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            updateInProgress: false,
            loading: true,
            error: false,
            currentStep: 0
        };

        this.checkForUpdate = this.checkForUpdate.bind(this);
    }

    componentDidMount() {
        this.interval = setInterval(this.checkForUpdate, 2000);
        this.checkForUpdate();
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    updateTriggered() {
        this.setState({
            updateInProgress: true,
            currentStep: 0,
            error: false,
            loading: false
        });
    }

    checkForUpdate() {
        if (this.state.updateInProgress || this.state.error || this.state.loading) {
            axios.get('/api/import/latest')
            .then(function(response) {
                if (response.data.in_progress) {
                    this.setState({
                        updateInProgress: true,
                        currentStep: response.data.current_step,
                        error: false,
                        loading: false
                    });
                } else {
                    if (response.data.failed || response.data.current_step === 0) {
                        window.location.hash = '/import';
                    } else {
                        window.location.hash = '/summary';
                    }
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

    render() {
        if (this.state.updateInProgress) return (
            <div className="empty">
                <div className="empty-icon">
                    <div className="loading loading-lg"></div>
                </div>
                <p className="empty-title h5">
                    {[
                        <span>Starting file import process...</span>,
                        <span>Waiting for iRODS server...</span>,
                        <span>Downloading file information...</span>,
                        <span>Analyzing files...</span>,
                        <span>Building file database...</span>
                    ][this.state.currentStep]}
                </p>
                <p className="empty-subtitle">This may take several minutes.</p>
            </div>
        );

        if (this.state.error) return (
            <div className="empty">
                <div className="empty-icon">
                    <i className="icon icon-cross"></i>
                </div>
                <p className="empty-title h5">Unable to contact server</p>
                <p className="empty-subtitle">An error occurred, please try again later</p>
            </div>
        );

        if (this.state.loading) return (
            <div className="loading loading-lg"></div>
        );

        return (
            <UpdateContext.Provider value={this}>
                {this.props.children}
            </UpdateContext.Provider>
        );
    }
}