import axios from 'axios';
import React from 'react';

export class LoadingBox extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            error: false,
            loading: true
        };
    }

    componentDidMount() {
        axios.get(this.props.get)
        .then(function(response) {
            this.setState({
                loading: false,
                error: false
            });
            this.props.callback(response);
        }.bind(this))
        .catch(function(error) {
            this.setState({
                loading: false,
                error: true
            });
        }.bind(this));
    }

    render() {
        if (this.state.error) return (
            <div className="empty">
                <div className="empty-icon">
                    <i className="icon icon-cross"></i>
                </div>
                <p className="empty-title h5">Unable to retrieve files</p>
                <p className="empty-subtitle">An error occurred, please try again later</p>
            </div>
        );

        if (this.state.loading) return (
            <div className="loading loading-lg"></div>
        );  

        return (
            <React.Fragment>
                {this.props.children}
            </React.Fragment>
        );
    }
}