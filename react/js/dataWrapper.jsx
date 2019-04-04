import React from 'react';
import axios from 'axios';

import { SourceMenu } from './sourceMenu';
import { TabNav } from './tabNav';
import { ImportForm } from './forms/importForm';
import { DirectoryContext } from './context';

export class DataWrapper extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            loading: true,
            error: false,
            directories: null
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.viewDirectory = this.viewDirectory.bind(this);
        this.deleteDirectory = this.deleteDirectory.bind(this);
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

    deleteDirectory(directory) {
        console.log('deletion');
        this.setState({
            loading: true
        });
        axios.delete('api/files/deletedirectory', { data: directory })
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
                        <SourceMenu directories={this.state.directories} 
                            onChange={this.viewDirectory} 
                            onDelete={this.deleteDirectory}
                        />
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
                    <ImportForm />
                </React.Fragment>
            )
        }
    }
}