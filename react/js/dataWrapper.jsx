import React from 'react';

import { SourceMenu } from './sourceMenu';
import { TabNav } from './tabNav';
import { ImportForm } from './sources/importForm';
import { LoadingWrapper } from './loadingWrapper';

export class DataWrapper extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            directories: [null]
        };

        this.onLoad = this.onLoad.bind(this);
    }

    // deleteDirectory(directory) {
    //     console.log('deletion');
    //     this.setState({
    //         loading: true
    //     });
    //     axios.delete('api/files/deletedirectory', { data: directory })
    //     .then(this.onLoad)
    //     .catch(this.onError);
    // }

    onLoad(response) {
        this.setState({
            directories: response.data
        });
    }

    render() {
        return (
            <LoadingWrapper get="/api/files/directories" callback={this.onLoad}>
                <header className="text-center">
                    <img src="/static/img/DataHog.png" alt="DataHog" />
                    <h1>
                        DataHog
                    </h1>
                </header>
                { this.state.directories.length ?
                    <TabNav/>
                    :
                    <ImportForm />
                }
            </LoadingWrapper>
        );
    }
}