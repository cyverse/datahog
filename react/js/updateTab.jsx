import React from 'react';
import axios from 'axios';
import { LoadingBox } from './loadingBox';

export class UpdateTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            file: null,
            updates: []
        };

        this.requestUpdate = this.requestUpdate.bind(this);
        this.fileChanged = this.fileChanged.bind(this);
        this.restoreUpdate = this.restoreUpdate.bind(this);
        this.onLoad = this.onLoad.bind(this);
    }

    fileChanged(event) {
        let selectedFiles = event.target.files;
        if (selectedFiles.length > 0) {
            this.setState({
                file: selectedFiles[0]
            });
        } else {
            this.setState({
                file: null
            });
        }
    }

    requestUpdate() {
        if (this.state.file) {
            let formData = new FormData();
            formData.append('file', this.state.file);
            axios.post('/api/updates/uploadfile', formData)
            .then(function(response) {
                this.setState({
                    updates: [response.data].concat(this.state.updates)
                });
            }.bind(this))
            .catch(function(error) {
                console.log(error);
            }.bind(this));
     
        }
    }

    restoreUpdate(update) {
        console.log(arguments);
        axios.post('/api/updates/restore', {
            update_id: update.id
        })
        .then(function(response) {
            this.setState({
                updates: [response.data].concat(this.state.updates)
            });
        }.bind(this))
        .catch(function(error) {
            console.log(error);
        }.bind(this));
    }

    onLoad(response) {
        this.setState({
            updates: response.data
        });
    }

    render() {
        let disabled = this.state.updates.length > 0 && this.state.updates[0].in_progress;
        //console.log(buttons_disabled);
        return (
            <LoadingBox get="/api/updates/list" callback={this.onLoad} checkForUpdate={false}>
                <div className="container">
                    {!disabled &&
                        <div className="columns">
                            <div className="column">
                                <div className="panel">
                                    <div className="panel-header">
                                        <div className="panel-title h5">Update from File</div>
                                    </div>
                                    <div className="panel-body">
                                        <input className="form-input" type="file" onChange={this.fileChanged}/>
                                    </div>
                                    <div className="panel-footer">
                                        <button className="btn btn-primary" onClick={this.requestUpdate} disabled={disabled}>Update from File</button>
                                    </div>
                                </div>
                            </div>
                            <div className="column">
                                <div className="panel">
                                    <div className="panel-header">
                                        <div className="panel-title h5">Update from iRODS</div>
                                    </div>
                                    <div className="panel-body form-horizontal">
                                        <div className="form-group">
                                            <input className="form-input" type="text" placeholder="Username"/>
                                        </div>
                                        <div className="form-group">
                                            <input className="form-input" type="password" placeholder="Password"/>
                                        </div>
                                    </div>
                                    <div className="panel-footer">
                                        <button className="btn btn-primary" disabled>Update from iRODS</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                    <div className="columns">
                        <div className="column">
                            <div className="panel">
                                <div className="panel-header">
                                    <div className="panel-title h5">Update Log</div>
                                </div>
                                <div className="panel-body" style={{maxHeight: '400px'}}>
                                    <table className="table">
                                        <tbody>
                                        {this.state.updates.map(update => {
                                            return (
                                                <UpdateLogRow key={update.id} update={update} onRestore={this.restoreUpdate} disabled={disabled}/>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LoadingBox>
        );
    }
}

class UpdateLogRow extends React.Component {

    constructor(props) {
        super(props);
        this.handleRestore = this.handleRestore.bind(this);
    }

    handleRestore() {
        this.props.onRestore(this.props.update);
    }

    render() {
        return (
            <tr>
                <td>{this.props.update.timestamp}</td>
                <td>
                    {this.props.update.in_progress ? 
                        <span className="label label-warning">In Progress</span> :
                    this.props.update.failed ? 
                        <span className="label label-error">Failed</span> : 
                    <span>Successfully imported {this.props.update.file_count} files.</span>
                    }
                </td>
                <td>
                    {this.props.update.file && !this.props.update.failed && !this.props.update.in_progress && 
                        <button className="btn btn-primary" onClick={this.handleRestore} disabled={this.props.disabled}>Restore</button>
                    }
                </td>
            </tr>
        );
    } 
}