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

        this.state = {
            backupClicked: false,
            error: '',
            waiting: false,
            file: null
        }

        this.fileChanged = this.fileChanged.bind(this);
        this.submitFile = this.submitFile.bind(this);
        this.onSuccess = this.onSuccess.bind(this);
        this.onError = this.onError.bind(this);
    }

    onSuccess(response) {
        this.setState({
            waiting: false
        });
        this.context.taskStarted(response.data);
    }

    onError(error) {
        this.setState({
            waiting: false,
            error: error.response.data
        });
    }

    fileChanged(event) {
        this.setState({
            file: event.target.files.length ? event.target.files[0] : null
        });
    }

    componentDidUpdate() {
        this.state.backupClicked = false;
    }

    submitFile(event) {
        event.preventDefault();
        this.setState({
            waiting: true,
            error: ''
        });
        let formData = new FormData();
        formData.append('file', this.state.file);
        let config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };
        axios.post('/api/import/loaddata', formData, config)
        .then(this.onSuccess)
        .catch(this.onError);
    }

    render() {
        return (
            <div className={this.props.active ? 'modal active' : 'modal'}>
                <a className="modal-overlay" onClick={this.props.onToggle}></a>
                <div className="modal-container">
                    <div className="modal-header">
                        <div className="modal-title h5">Backup/Restore Database</div>
                    </div>
                    <div className="modal-body">
                        <a className="btn btn-primary" href="/api/import/dumpdata" download disabled={this.state.backupClicked} onClick={()=>this.setState({backupClicked: true})}>Download database backup</a>
                    </div>
                    <div className="modal-body">
                        <form className="form-horizontal" onSubmit={this.submitFile}>
                            <div className="form-group">
                                <div className="col-6">
                                    <input type="file" name="file" className="form-input" onChange={this.fileChanged} accept=".json"/>
                                </div>
                                <div className="col-3 text-center">
                                    <input type="submit" 
                                            className="btn btn-primary"
                                            value="Restore"
                                            disabled={!this.state.file}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="col-6">
                                    { this.state.waiting ?
                                        <span className="text-primary">
                                            <i className="loading">load</i> Uploading file...
                                        </span> :
                                        <span className="text-error">
                                            {this.state.error}
                                        </span>
                                    }
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-link" onClick={this.props.onToggle}>Close</button>
                    </div>
                </div>
            </div>
        );
    }
}

BackupModal.contextType = TaskContext;