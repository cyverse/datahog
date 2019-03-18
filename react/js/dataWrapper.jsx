import React from 'react';
import axios from 'axios';

import { SwitchMenu } from './switchMenu';
import { TabNav } from './tabNav';
import { IrodsForm, FileForm, CyverseForm } from './updateForm';

export const DirectoryContext = React.createContext({
    directory: null
});

export class DataWrapper extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            loading: true,
            error: false,
            directories: null
        };
    }

    componentDidMount() {
        axios.get('/api/files/directories')
        .then(function(response) {
            this.setState({
                loading: false,
                error: false,
                directories: response.data
            });
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
                <p className="empty-title h5">Unable to retrieve files</p>
                <p className="empty-subtitle">An error occurred, please try again later</p>
            </div>
        );

        if (this.state.loading) return (
            <div className="loading loading-lg"></div>
        );

        if (this.state.directories.length) {
            console.log(this.state.directories);
            return (
                <DirectoryContext.Provider value={{
                    directory: this.state.directories[0]
                }}>
                    <header className="text-left">
                        <img src="/static/img/DataHog.png" alt="DataHog" />
                        <h1>
                            DataHog
                        </h1>
                        <SwitchMenu directories={this.state.directories}/>
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
                    <div className="container">
                        <div className="columns">
                            <IrodsForm lastAttempt={this.props.lastAttempt} context={this.props.context} />
                            <FileForm context={this.props.context} />
                            <CyverseForm lastAttempt={this.props.lastAttempt} context={this.props.context} />
                        </div>
                    </div>
                </React.Fragment>
            )
        }
    }
}