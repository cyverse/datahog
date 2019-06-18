import React from 'react';
import axios from '../axios';
import { LabeledInput } from '../util';

/**
 * A form to enter information for an S3 import.
 */
export class S3Form extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            access: this.props.lastAttempt.s3_key,
            secret: '',
            bucket: this.props.lastAttempt.s3_bucket,
            folder: this.props.lastAttempt.s3_root,
            name: this.props.lastAttempt.s3_name,
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
        axios.post('/api/import/awslogin', {
            key: this.state.access,
            secret: this.state.secret,
            bucket: this.state.bucket,
            root: this.state.folder,
            name: this.state.name
        })
        .then(function(response) {
            this.setState({
                waiting: false
            });
            this.props.onSubmit(response.data);
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
            !this.state.name.length
        );
        return (
            <form className="form-horizontal" onSubmit={this.submitForm}>
                <div className="form-group">
                    <div className="col-2">
                        <br/>
                        <label>Access Keys</label>
                    </div>
                    <div className="col-5">
                        <LabeledInput name="access"
                            label="Access Key ID"
                            value={this.state.access}
                            onChange={this.handleChange}/>
                    </div>
                    <div className="col-5">
                        <LabeledInput name="secret"
                            type="password"
                            label="Secret Access Key"
                            value={this.state.secret}
                            onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-2">
                        <br/>
                        <label>Bucket</label>
                    </div>
                    <div className="col-6">
                        <LabeledInput name="bucket"
                            label="Bucket Name"
                            value={this.state.bucket}
                            onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-5">
                        <br/>
                        <label>Folder to Import (optional)</label>
                    </div>
                    <div className="col-7">
                        <LabeledInput name="folder"
                            label="Folder"
                            value={this.state.folder}
                            onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-3 col-ml-auto">
                        <br/>
                        <label>Name this source</label>
                    </div>
                    <div className="col-4 col-mr-auto">
                        <LabeledInput name="name"
                            label="Name"
                            value={this.state.name}
                            onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="form-group" style={{marginTop: '30px'}}>
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