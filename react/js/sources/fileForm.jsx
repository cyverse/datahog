import React from 'react';
import axios from 'axios';

export class FileForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            file: null,
            waiting: false,
            error: ''
        };
        this.submitForm = this.submitForm.bind(this);
        this.fileChanged = this.fileChanged.bind(this);
    }

    submitForm(event) {
        event.preventDefault();
        this.setState({
            waiting: true,
            error: ''
        });
        let formData = new FormData();
        formData.append('file',this.state.file)
        let config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };
        axios.post('/api/import/loadfile', formData, config)
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

    fileChanged(event) {
        if (event.target.files.length) {
            this.setState({
                file: event.target.files[0]
            });
        } else {
            this.setState({
                file: null
            });
        }
    }
    
    render() {
        return (
            <form className="form-horizontal" onSubmit={this.submitForm}>
                <div className="form-group">
                    <div className="col-6 col-mx-auto">
                        <input type="file" className="form-input" onChange={this.fileChanged} accept=".datahog"/>
                    </div>
                </div>
                <div className="form-group" style={{marginTop: '30px'}}>
                    <div className="col-6 text-center">
                        <input type="submit" 
                            className="btn btn-primary"
                            value="Import from File"
                            disabled={!this.state.file}/>
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
                <div style={{marginTop: '30px'}}>
                    You can use <a href="/static/scripts/datahog_crawler.py" download>this Python utility</a> to generate a .datahog file
                    for any directory on your computer.
                </div>
            </form>
        );
    }
}
