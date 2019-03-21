import axios from 'axios';
import React from 'react';

import { DataWrapper } from './dataWrapper';
import { ImportContext } from './context';

export class ImportWrapper extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            updateInProgress: false,
            loading: true,
            error: false,
            currentStep: 0,
            lastAttempt: null
        };

        this.checkForUpdate = this.checkForUpdate.bind(this);
        this.updateTriggered = this.updateTriggered.bind(this);
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
            loading: false,
            lastAttempt: null
        });
    }

    checkForUpdate() {
        if (this.state.error || this.state.loading || this.state.updateInProgress) {
            axios.get('/api/import/latest')
            .then(function(response) {
                if (response.data.in_progress) {
                    this.setState({
                        updateInProgress: true,
                        currentStep: response.data.current_step,
                        error: false,
                        loading: false,
                        lastAttempt: response.data
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
                        loading: false,
                        lastAttempt: response.data
                    });
                }
            }.bind(this))
            .catch(function(error) {
                this.setState({
                    updateInProgress: false,
                    error: true,
                    loading: false,
                    lastAttempt: null
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
                        <span>Downloading file data...</span>,
                        <span>Downloading file data...</span>,
                        <span>Analyzing files...</span>,
                        <span>Building file database...</span>
                    ][this.state.currentStep]}
                </p>
                {/* <p className="empty-subtitle">
                    { this.state.extraLarge ?
                        <span>This folder is very large. The import process may take longer than usual.</span> :
                        <span>This may take a few minutes.</span>
                    }
                </p> */}
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
            <ImportContext.Provider value={{
                updateTriggered: this.updateTriggered,
                lastAttempt: this.state.lastAttempt
            }}>
                <DataWrapper onSubmit={this.updateTriggered} lastAttempt={this.state.lastAttempt} />
            </ImportContext.Provider>
        );
    }
}