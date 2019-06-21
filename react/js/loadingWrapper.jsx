import axios from './axios';
import React from 'react';

/**
 * Performs a GET request for a child component.
 * Renders a spinner instead of the child while it waits.
 */
export class LoadingWrapper extends React.Component {

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
        if (this.state.error || this.props.error) return (
            <div className="empty">
                <p className="empty-title h5">Unable to contact server</p>
                <p className="empty-subtitle">An error occurred, please try again later</p>
            </div>
        );

        if (this.state.loading || this.props.loading) return (
            <div className="loading loading-lg"></div>
        );  

        return (
            <React.Fragment>
                {this.props.children}
            </React.Fragment>
        );
    }
}