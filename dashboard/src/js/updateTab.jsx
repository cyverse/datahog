import React from 'react';
import axios from 'axios';

export class UpdateTab extends React.Component {

    constructor(props) {
        super(props);

        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
        axios.defaults.xsrfCookieName = "csrftoken";

        this.requestUpdate = this.requestUpdate.bind(this);
    }

    requestUpdate() {
        axios.get('/api/database/update')
        .then(function(response) {
            console.log(response);
        })
        .catch(function(error) {
            console.log(error);
        });
    }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <button onClick={this.requestUpdate}>Update from File</button>
                </div>
            </div>
        );
    }
}