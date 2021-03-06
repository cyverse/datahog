import axios from './axios';
import React from 'react';

import { ContextWrapper } from './contextWrapper';

/**
 * Displays a loading screen if a task is in progress.
 * Otherwise, renders the ContextWrapper.
 */
export class TaskWrapper extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            error: false,
            lastTask: null
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.checkForUpdate = this.checkForUpdate.bind(this);
        this.taskStarted = this.taskStarted.bind(this);
        this.dismissModal = this.dismissModal.bind(this);
    }

    componentDidMount() {
        this.interval = setInterval(this.checkForUpdate, 2000);
        this.checkForUpdate();
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    taskStarted(task) {
        this.setState({
            error: false,
            loading: false,
            lastTask: task
        });
    }

    onLoad(response) {
        this.setState({
            loading: false,
            error: false,
            lastTask: response.data
        });
        
        if (response.data.failed) window.location.hash = '/import';
        else                      window.location.hash = '/summary';
    }

    onError(error) {
        this.setState({
            error: true,
            loading: false,
            lastTask: null
        });
    }

    checkForUpdate() {
        if (this.state.error || this.state.loading || this.state.lastTask.in_progress) {
            axios.get('/api/import/task')
            .then(this.onLoad)
            .catch(this.onError);
        }
    }

    dismissModal() {
        this.state.lastTask.warning = false;
        axios.patch('/api/import/task', this.state.lastTask);
        this.setState({});
    }

    render() {

        if (this.state.loading) return (
            <div className="loading loading-lg"></div>
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

        if (this.state.lastTask.in_progress) return (
            <div className="empty">
                <div className="empty-icon">
                    <div className="loading loading-lg"></div>
                </div>
                <p className="empty-title h5">
                    {this.state.lastTask.status_message}
                </p>
                <p className="empty-subtitle">
                    {this.state.lastTask.status_subtitle}
                </p>
            </div>
        );

        return (
            <React.Fragment>
                <ContextWrapper lastTask={this.state.lastTask} taskStarted={this.taskStarted} />
                <div className={this.state.lastTask.warning ? 'modal active' : 'modal'}>
                    <a className="modal-overlay" onClick={this.dismissModal}></a>
                    <div className="modal-container">
                        <div className="modal-header">
                            <div className="modal-title h5">
                                {this.state.lastTask.status_message}
                            </div>
                        </div>
                        <div className="modal-body">
                            {this.state.lastTask.status_subtitle}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={this.dismissModal}>Close</button>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}