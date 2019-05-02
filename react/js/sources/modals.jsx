import React from 'react';
import axios from '../axios';

import { ImportForm } from './importForm';
import { TaskContext } from '../context';

export function ImportModal(props) {
    return (
        <div className={props.active ? 'modal active' : 'modal'}>
            <a className="modal-overlay" onClick={props.onToggle}></a>
            <div className="modal-container import-modal">
                <div className="modal-body">
                    <ImportForm />
                </div>
                <div className="modal-footer">
                    <button className="btn btn-link" onClick={props.onToggle}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export class DeleteModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            waiting: false,
            error: false
        };
        
        this.deleteSource = this.deleteSource.bind(this);
        this.onSuccess = this.onSuccess.bind(this);
        this.onError = this.onError.bind(this);

    }

    onSuccess(response) {
        this.context.taskStarted(response.data);
    }

    onError(error) {
        this.setState({
            waiting: false,
            error: true
        });
    }

    deleteSource() {
        this.setState({
            waiting: true
        });
        axios.delete('api/import/deletesource', { data: {source: this.props.source.id} })
        .then(this.onSuccess)
        .catch(this.onError);
    }

    render() {
        return (
            <div className={this.props.active ? 'modal active' : 'modal'}>
                <a className="modal-overlay" onClick={this.props.onToggle}></a>
                <div className="modal-container">
                    <div className="modal-header">
                        <div className="modal-title h5">Are you sure?</div>
                    </div>
                    <div className="modal-body">
                        <div className="content">
                            If you remove this source, it will need to be re-imported in order to be viewed again.
                        </div>
                    </div>
                    <div className="modal-footer">
                        { this.state.error && 
                            <span className="text-error">
                                An error occurred.
                            </span>
                        }
                        {
                            this.state.waiting &&
                            <i className="loading"></i>
                        }
                        <button className="btn btn-primary" onClick={this.deleteSource} disabled={this.state.waiting}>Remove</button>
                        <button className="btn btn-link" onClick={this.props.onToggle}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }
}

DeleteModal.contextType = TaskContext;

export class BackupModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className={this.props.active ? 'modal active' : 'modal'}>
                <a className="modal-overlay" onClick={this.props.onToggle}></a>
                <div className="modal-container">
                    <div className="modal-footer">
                        <button className="btn btn-link" onClick={this.props.onToggle}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }
}