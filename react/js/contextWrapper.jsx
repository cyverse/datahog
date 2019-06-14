import React from 'react';

import { TabNav } from './tabNav';
import { ImportForm } from './sources/importForm';
import { LoadingWrapper } from './loadingWrapper';
import { TaskContext, ImportContext, SourceContext } from './context';
import { BackupModal } from './sources/modals';

/**
 * Provides values for TaskContext, ImportContext, and SourceContext.
 * Renders the TabNav if there is at least one imported file source.
 * Otherwise, shows the ImportForm.
 */
export class ContextWrapper extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            lastAttempt: null,
            sources: 0,
            restoreModal: false
        };

        this.onLoad = this.onLoad.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
    }

    toggleModal() {
        this.setState({
            restoreModal: !this.state.restoreModal
        });
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
                            
                            { this.state.sources.length ?
                                <SourceContext.Provider value={{
                                    include: new Set(this.state.sources.map(source => source.id))
                                }}>
                                    <TabNav/>
                                </SourceContext.Provider> :
                                <React.Fragment>
                                    <ImportForm />
                                    <div className="text-center">
                                        <button className="btn btn-link" onClick={this.toggleModal}><i className="fa fa-database"></i> Restore database</button>
                                    </div>
                                    <BackupModal active={this.state.restoreModal} onToggle={this.toggleModal} hideDownload={true}/>
                                </React.Fragment>
                            }
                        </ImportContext.Provider>
                    }
                </LoadingWrapper>
            </TaskContext.Provider>
        );
    }
}