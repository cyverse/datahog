import React from 'react';
import axios from 'axios';
import { LoadingBox } from './loadingBox';

export class UpdateTab extends React.Component {

    constructor(props) {
        super(props);

        this.requestUpdate = this.requestUpdate.bind(this);
        this.fileChanged = this.fileChanged.bind(this);

        this.state = {
            file: null,
            updateInProgress: false,
            loading: false,
            error: false,
            updates: []
        };

        axios.get('/api/updates/list')
        .then(function(response) {
            this.setState({
                updates: response.data,
                loading: false
            });
        }.bind(this))
        .catch(function(error) {
            this.setState({
                loading: false,
                error: true
            });
        }.bind(this));
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
            this.setState(state => ({
                file: state.file,
                updateInProgress: true
            }));
            axios.post('/api/updates/uploadfile', formData)
            .then(function(response) {
                console.log(response);
            })
            .catch(function(error) {
                console.log(error);
            });
        }
    }

    render() {
        return (
            <LoadingBox childLoading={this.state.loading} childError={this.state.error}>
                <div className="container">
                    <div className="columns">
                        <div className="column">
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title h5">Update from File</div>
                                </div>
                                <div className="card-body">
                                    <input className="form-input" type="file" onChange={this.fileChanged}/>
                                </div>
                                <div className="card-footer">
                                    <button className="btn btn-primary" onClick={this.requestUpdate}>Update from File</button>
                                </div>
                            </div>
                        </div>
                        <div className="column">
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title h5">Update from iRODS</div>
                                </div>
                                <div className="card-body form-horizontal">
                                    <div className="form-group">
                                        <input className="form-input" type="text" placeholder="Username"/>
                                    </div>
                                    <div className="form-group">
                                        <input className="form-input" type="password" placeholder="Password"/>
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <button className="btn btn-primary" disabled>Update from iRODS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="columns">
                        <div className="column">
                            <div className="panel">
                                <div className="panel-header">
                                    <div className="card-title h5">Update Log</div>
                                </div>
                                <div className="panel-body" style={{maxHeight: '400px'}}>
                                    <table className="table">
                                        <tbody>
                                        {this.state.updates.map(update => {
                                            return (
                                                <tr key={update.id}>
                                                    <td>{update.timestamp}</td>
                                                    <td>
                                                        {update.failed ? 
                                                            <span className="label label-error">Failed</span> : 
                                                            <span>Successfully imported {update.file_count} files.</span>
                                                        }
                                                    </td>
                                                </tr>
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