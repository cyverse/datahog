import React from 'react';
import axios from 'axios';
import { LoadingBox } from './loadingBox';
import { LabeledInput } from './util';
import { UpdateContext } from './updateBox';

export function UpdateTabWithContext() {
    return  (
        <UpdateContext.Consumer>
            {context =>
                <UpdateTab context={context}/>
            }
        </UpdateContext.Consumer>
    )
}

export class UpdateTab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: '',
            password: '',
            host: 'data.cyverse.org',
            port: '1247',
            zone: 'iplant',
            folder: '',
            updates: [],
            waiting: false,
            error: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            updates: response.data
        });
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    submitForm(event) {
        event.preventDefault();
        this.setState({
            waiting: true,
            error: ''
        });
        axios.post('/api/updates/irodslogin', {
            user: this.state.user,
            password: this.state.password,
            host: this.state.host,
            port: this.state.port,
            zone: this.state.zone,
            folder: this.state.folder
        })
        .then(function(response) {
            this.setState({
                waiting: false,
                lastUpdate: response.data
            });
            if (this.props.context) {
                this.props.context.updateTriggered();
            }
        }.bind(this))
        .catch(function(error) {
            console.log(error.response.data);
            this.setState({
                waiting: false,
                error: error.response.data
            });
        }.bind(this));
    }
    
    render() {
        let submitDisabled = (
            this.state.waiting || 
            !this.state.user.length || 
            !this.state.password.length || 
            !this.state.host.length || 
            !this.state.folder.length || 
            !this.state.port.length || 
            !this.state.zone.length
        );
        return (
            <LoadingBox get="/api/updates/list" callback={this.onLoad} checkForUpdate={false}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <form className="panel" onSubmit={this.submitForm}>
                                <div className="panel-header">
                                    <div className="panel-title h5">Import from iRODS</div>
                                </div>
                                <div className="panel-body form-horizontal">
                                    <div className="form-group">
                                        <div className="col-2">
                                            <br/>
                                            <label>Server</label>
                                        </div>
                                        <div className="col-4">
                                            <LabeledInput name="host"
                                                label="Host"
                                                value={this.state.host}
                                                onChange={this.handleChange}/>
                                        </div>
                                        <div className="col-2">
                                            <LabeledInput name="port"
                                                label="Port"
                                                value={this.state.port}
                                                onChange={this.handleChange}/>
                                        </div>
                                        <div className="col-4">
                                            <LabeledInput name="zone"
                                                label="Zone"
                                                value={this.state.zone}
                                                onChange={this.handleChange}/>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="col-3">
                                            <br/>
                                            <label>Credentials</label>
                                        </div>
                                        <div className="col-4">
                                            <LabeledInput name="user"
                                                label="Username"
                                                value={this.state.user}
                                                onChange={this.handleChange}/>
                                        </div>
                                        <div className="col-4">
                                            <LabeledInput type="password"
                                                name="password"
                                                label="Password"
                                                value={this.state.password}
                                                onChange={this.handleChange}/>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="col-3">
                                            <br/>
                                            <label>Folder to Import</label>
                                        </div>
                                        <div className="col-8">
                                            <LabeledInput name="folder"
                                                label="Folder"
                                                value={this.state.folder}
                                                onChange={this.handleChange}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="panel-footer">
                                    <input type="submit" 
                                        className="btn btn-primary"
                                        value="Update from iRODS"
                                        disabled={submitDisabled} />
                                    { this.state.waiting && 
                                        <React.Fragment>
                                            <i className="loading"></i> Connecting to iRODS...
                                        </React.Fragment>
                                    }
                                    <React.Fragment>{this.state.error}</React.Fragment>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </LoadingBox>
        );
    }
}