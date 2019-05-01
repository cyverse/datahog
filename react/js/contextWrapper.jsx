import React from 'react';

import { TabNav } from './tabNav';
import { ImportForm } from './sources/importForm';
import { LoadingWrapper } from './loadingWrapper';
import { TaskContext, ImportContext } from './context';

export class ContextWrapper extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            lastAttempt: null,
            numSources: 0
        };

        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            lastAttempt: response.data.last_attempt,
            numSources: response.data.num_sources
        });
    }

    render() {
        return (
            <TaskContext.Provider value={{
                taskStarted: this.props.taskStarted,
                lastTask: this.props.lastTask
            }}>
                <header className="text-center">
                    <img src="/static/img/DataHog.png" alt="DataHog" />
                    <h1>
                        DataHog
                    </h1>
                </header>
                <LoadingWrapper get="/api/import/context" callback={this.onLoad}>
                    { this.state.lastAttempt &&
                        <ImportContext.Provider value={{
                            lastAttempt: this.state.lastAttempt
                        }}> 
                            { this.state.numSources ?
                                <TabNav/> :
                                <ImportForm />
                            }
                        </ImportContext.Provider>
                    }
                </LoadingWrapper>
            </TaskContext.Provider>
        );
    }
}