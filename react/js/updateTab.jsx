import React from 'react';
import axios from 'axios';
import { LoadingBox } from './loadingBox';

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
        }.bind(this))
        .catch(function(error) {
            console.log(error.response.data);
            debugger;
            this.setState({
                waiting: false,
                error: error.response.data
            });
        }.bind(this));
    }

    onLoad(response) {
        this.setState({
            updates: response.data
        });
    }

    render() {
        let submitDisabled = this.state.waiting || !this.state.user.length || !this.state.password.length || !this.state.host.length || !this.state.folder.length || !this.state.port.length || !this.state.zone.length;
        return (
            <LoadingBox get="/api/updates/list" callback={this.onLoad} checkForUpdate={false}>
                <div className="container">
                    <div className="columns">
                        <div className="column">
                            <form className="panel" onSubmit={this.submitForm}>
                                <div className="panel-header">
                                    <div className="panel-title h5">Update from iRODS</div>
                                </div>
                                <div className="panel-body form-horizontal">
                                    <div className="form-group">
                                        <input value={this.state.user} onChange={this.handleChange} name="user" className="form-input" type="text" placeholder="Username"/>
                                    </div>
                                    <div className="form-group">
                                        <input value={this.state.password} onChange={this.handleChange} name="password" className="form-input" type="password" placeholder="Password"/>
                                    </div>
                                    <div className="form-group">
                                        <input value={this.state.host} onChange={this.handleChange} name="host" className="form-input" type="text" placeholder="Host"/>
                                    </div>
                                    <div className="form-group">
                                        <input value={this.state.port} onChange={this.handleChange} name="port" className="form-input" type="text" placeholder="Port"/>
                                    </div>
                                    <div className="form-group">
                                        <input value={this.state.zone} onChange={this.handleChange} name="zone" className="form-input" type="text" placeholder="Zone"/>
                                    </div>
                                    <div className="form-group">
                                        <input value={this.state.folder} onChange={this.handleChange} name="folder" className="form-input" type="text" placeholder="Folder"/>
                                    </div>
                                </div>
                                <div className="panel-footer">
                                    <input type="submit" className="btn btn-primary" value="Update from iRODS" disabled={submitDisabled} />
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