import React from 'react';
import axios from 'axios';
import { LabeledInput } from '../util';

export class CyverseForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: this.props.lastAttempt.username,
            password: '',
            folder: this.props.lastAttempt.root_path,
            waiting: false,
            error: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.submitForm = this.submitForm.bind(this);
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
        axios.post('/api/import/cyverselogin', {
            user: this.state.user,
            password: this.state.password,
            folder: this.state.folder
        })
        .then(function(response) {
            this.setState({
                waiting: false
            });
            if (this.props.onSubmit) {
                this.props.onSubmit();
            }
        }.bind(this))
        .catch(function(error) {
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
            !this.state.folder.length
        );
        return (
            <div className="column col-9 col-mx-auto">
                <form className="card" onSubmit={this.submitForm}>
                    <div className="card-header">
                        <div className="card-title h5">Import from CyVerse (under development)</div>
                    </div>
                    <div className="card-body form-horizontal">
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
                    <div className="card-footer">
                        <input type="submit" 
                            className="btn btn-primary"
                            value="Import from CyVerse"
                            disabled={submitDisabled} />
                        <div className="float-right text-right">
                            { this.state.waiting ?
                                <span className="text-primary">
                                    <i className="loading">load</i> Connecting to CyVerse...
                                </span> :
                                <span className="text-error">
                                    {this.state.error}
                                </span>
                            }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}