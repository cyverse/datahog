import React from 'react';
import axios from 'axios';

import { SwitchMenu } from './switchMenu';
import { TabNav } from './tabNav';
import { IrodsForm, FileForm, CyverseForm } from './updateForm';
import { DirectoryContext } from './context';

export class DataWrapper extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            loading: true,
            error: false,
            directories: null
        };

        this.onLoad = response
    }

    componentDidMount() {
        axios.get('/api/files/directories')
        .then(this.onLoad)
        .catch(this.onError);
    }

    viewDirectory(directory) {
        this.setState({
            loading: true
        });
        axios.post('/api/files/viewdirectory', directory)
        .then(this.onLoad)
        .catch(this.onError);
    }

    onLoad(response) {
        this.setState({
            loading: false,
            error: false,
            directories: response.data
        });
    }

    onError(error) {
        this.setState({
            loading: false,
            error: true
        });
    }

    render() {
        if (this.state.error) return (
            <div className="empty">
                <p className="empty-title h5">Unable to retrieve files</p>
                <p className="empty-subtitle">An error occurred, please try again later</p>
            </div>
        );

        if (this.state.loading) return (
            <div className="loading loading-lg"></div>
        );

        if (this.state.directories.length) {
            return (
                <DirectoryContext.Provider value={{
                    directory: this.state.directories[0]
                }}>
                    <header className="text-left">
                        <img src="/static/img/DataHog.png" alt="DataHog" />
                        <h1>
                            DataHog
                        </h1>
                        <SwitchMenu directories={this.state.directories} onChange={this.viewDirectory} />
                    </header>
                    <TabNav/>
                </DirectoryContext.Provider>
            )
        } else {
            return (
                <React.Fragment>
                    <header className="text-center">
                        <img src="/static/img/DataHog.png" alt="DataHog" />
                        <h1>
                            DataHog
                        </h1>
                    </header>
                    { this.props.lastAttempt.failed && 
                        <div className="toast toast-error">
                            Your last import could not be completed. The folder you requested may be too large.
                        </div>
                    }
                    <div className="container">
                        <div className="columns">
                            <IrodsForm lastAttempt={this.props.lastAttempt} onSubmit={this.props.onSubmit} />
                            <FileForm onSubmit={this.props.onSubmit} />
                            <CyverseForm lastAttempt={this.props.lastAttempt} onSubmit={this.props.onSubmit} />
                        </div>
                    </div>
                </React.Fragment>
            )
        }
    }
}