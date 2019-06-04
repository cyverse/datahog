import React from 'react';

import { TabNav } from './tabNav';
import { ImportForm } from './sources/importForm';
import { LoadingWrapper } from './loadingWrapper';
import { TaskContext, ImportContext, SourceContext } from './context';

// Provides values for TaskContext, ImportContext, and SourceContext

export class ContextWrapper extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            lastAttempt: null,
            sources: 0
        };

        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            lastAttempt: response.data.last_attempt,
            sources: response.data.sources
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
                            <SourceContext.Provider value={{
                                include: new Set(this.state.sources.map(source => source.id))
                            }}>
                                { this.state.sources.length ?
                                    <TabNav/> :
                                    <ImportForm />
                                }
                            </SourceContext.Provider>
                        </ImportContext.Provider>
                    }
                </LoadingWrapper>
            </TaskContext.Provider>
        );
    }
}