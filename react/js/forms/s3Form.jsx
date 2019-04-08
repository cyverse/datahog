import React from 'react';
import axios from 'axios';
import { LabeledInput } from '../util';

export class S3Form extends React.Component {
    constructor(props) {
        super(props);

        if (this.props.lastAttempt.import_method === 'S3') {
            this.state = {
                access: this.props.lastAttempt.username,
                secret: '',
                bucket: this.props.lastAttempt.s3_bucket,
                folder: this.props.lastAttempt.root_path,
                waiting: false,
                error: ''
            };
        } else {
            this.state = {
                access: '',
                secret: '',
                bucket: '',
                folder: '',
                waiting: false,
                error: ''
            };
        }

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
        axios.post('/api/import/awslogin', {
            access: this.state.access,
            secret: this.state.secret,
            bucket: this.state.bucket,
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
            !this.state.access.length || 
            !this.state.secret.length ||
            !this.state.bucket.length ||
            !this.state.folder.length
        );
        return (
            <form className="form-horizontal" onSubmit={this.submitForm}>
                <div className="form-group">
                    <div className="col-3">
                        <br/>
                        <label>Credentials</label>
                    </div>
                    <div className="col-4">
                        <LabeledInput name="access"
                            label="Access Key ID"
                            value={this.state.access}
                            onChange={this.handleChange}/>
                    </div>
                    <div className="col-4">
                        <LabeledInput name="secret"
                            label="Secret Access Key"
                            value={this.state.secret}
                            onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-3">
                        <br/>
                        <label>Files to Import</label>
                    </div>
                    <div className="col-4">
                        <LabeledInput name="bucket"
                            label="Bucket Name"
                            value={this.state.bucket}
                            onChange={this.handleChange}/>
                    </div>
                    <div className="col-4">
                        <LabeledInput name="folder"
                            label="Folder (optional)"
                            value={this.state.folder}
                            onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-3">
                        <input type="submit" 
                            className="btn btn-primary"
                            value="Import from S3"
                            disabled={submitDisabled} />
                    </div>
                    <div className="col-9">
                        { this.state.waiting ?
                            <span className="text-primary">
                                <i className="loading">load</i> Connecting to AWS...
                            </span> :
                            <span className="text-error">
                                {this.state.error}
                            </span>
                        }
                    </div>
                </div>
            </form>
        );
    }
}