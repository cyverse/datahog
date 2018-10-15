import React from 'react';
import axios from 'axios';
import { LoadingBox } from './loadingBox';

export class UpdateTab extends React.Component {

    constructor(props) {
        super(props);

        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
        axios.defaults.xsrfCookieName = "csrftoken";

        this.requestUpdate = this.requestUpdate.bind(this);
        this.fileChanged = this.fileChanged.bind(this);

        this.state = {
            file: null,
            updateInProgress: false
        };
    }

    fileChanged(event) {
        let selectedFiles = event.target.files;
        if (selectedFiles.length > 0) {
            this.setState(state => ({
                file: selectedFiles[0],
                updateInProgress: state.updateInProgress
            }));
        } else {
            this.setState(state => ({
                file: null,
                updateInProgress: state.updateInProgress
            }));
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
            <LoadingBox childLoading={false} childError={false} childUpdateInProgress={this.state.updateInProgress}>
                <div className="container">
                    <div className="columns">
                        <input type="file" onChange={this.fileChanged}/>
                        <button onClick={this.requestUpdate}>Update from File</button>
                    </div>
                </div>
            </LoadingBox>
        );
    }
}