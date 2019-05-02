import React from 'react';
import axios from '../axios';

import { LabeledInput } from '../util';

export class FileForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            file: null,
            name: this.props.lastAttempt.file_name,
            waiting: false,
            error: ''
        };
        this.submitForm = this.submitForm.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    submitForm(event) {
        event.preventDefault();
        this.setState({
            waiting: true,
            error: ''
        });
        let formData = new FormData();
        formData.append('file', this.state.file);
        formData.append('name', this.state.name);
        let config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };
        axios.post('/api/import/loadfile', formData, config)
        .then(function(response) {
            this.setState({
                waiting: false
            })
            this.props.onSubmit(response.data);
        }.bind(this))
        .catch(function(error) {
            this.setState({
                waiting: false,
                error: error.response.data
            });
        }.bind(this));
    }

    handleChange(event) {
        let value;
        if (event.target.type === 'file') {
            value = event.target.files.length ? event.target.files[0] : null;
        } else {
            value = event.target.value;
        }

        this.setState({
            [event.target.name]: value
        });
    }

    render() {
        return (
            <React.Fragment>
                <form className="form-horizontal" onSubmit={this.submitForm}>
                    <div className="form-group">
                        <div className="col-6 col-mx-auto">
                            <input type="file" name="file" className="form-input" onChange={this.handleChange} accept=".datahog"/>
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
                    <div className="form-group submit-group">
                        <div className="col-6 text-center">
                            <input type="submit" 
                                className="btn btn-primary"
                                value="Import from File"
                                disabled={!this.state.file || !this.state.name.length}/>
                        </div>
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
                <article>
                    <h5 className="text-center">Scan a local directory</h5>
                    <ol>
                        <li>Download <a href="/static/scripts/datahog_crawler.py" download>this Python script</a>.</li>
                        <li>Run the script with <code>python3 datahog_crawler.py &lt;root path&gt;</code></li>
                        <li>Import the resulting file as a .datahog file</li>
                    </ol>
                </article>
            </React.Fragment>
        );
    }
}
