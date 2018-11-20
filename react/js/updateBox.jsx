import axios from 'axios';
import React from 'react';

export const UpdateContext = React.createContext(null);

export class UpdateBox extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            updateInProgress: false,
            loading: true,
            error: false
        };

        this.checkForUpdate = this.checkForUpdate.bind(this);
    }

    componentDidMount() {
        this.interval = setInterval(this.checkForUpdate, 1000);
        this.checkForUpdate();
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    updateTriggered() {
        this.setState({
            updateInProgress: true,
            error: false,
            loading: false
        });
    }

    checkForUpdate() {
        if (this.state.updateInProgress || this.state.error || this.state.loading) {
            axios.get('/api/updates/latest')
            .then(function(response) {
                if (response.data.in_progress) {
                    this.setState({
                        updateInProgress: true,
                        error: false,
                        loading: false
                    });
                } else {
                    this.setState({
                        updateInProgress: false,
                        error: false,
                        loading: false
                    });
                }
            }.bind(this))
            .catch(function(error) {
                this.setState({
                    updateInProgress: false,
                    error: true,
                    loading: false
                });
            }.bind(this));
        }
    }

    render() {
        if (this.state.updateInProgress) return (
            <div className="empty">
                <div className="empty-icon">
                    <div className="loading loading-lg"></div>
                </div>
                <p className="empty-title h5">A database update is in progress</p>
                <p className="empty-subtitle">This may take several minutes</p>
            </div>
        );

        if (this.state.error) return (
            <div className="empty">
                <div className="empty-icon">
                    <i className="icon icon-cross"></i>
                </div>
                <p className="empty-title h5">Unable to contact server</p>
                <p className="empty-subtitle">An error occurred, please try again later</p>
            </div>
        );

        if (this.state.loading) return (
            <div className="loading loading-lg"></div>
        );

        return (
            <UpdateContext.Provider value={this}>
                {this.props.children}
            </UpdateContext.Provider>
        );
    }
}