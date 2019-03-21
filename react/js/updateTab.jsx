import React from 'react';
import { IrodsForm, CyverseForm, FileForm } from './updateForm';
import { ImportContext } from './context';

export class UpdateTab extends React.Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        return (
            <React.Fragment>
                { this.context.lastAttempt && this.context.lastAttempt.failed && 
                    <div className="toast toast-error">
                        Your last import could not be completed. The folder you requested may be too large.
                    </div>
                }
                { this.context.lastAttempt &&
                    <div className="container">
                        <div className="columns">
                            <IrodsForm lastAttempt={this.context.lastAttempt} onSubmit={this.context.updateTriggered} />
                            <FileForm onSubmit={this.context.updateTriggered} />
                            <CyverseForm lastAttempt={this.context.lastAttempt} onSubmit={this.context.updateTriggered} />
                        </div>
                    </div>
                }
            </React.Fragment>
        );
    }
}

UpdateTab.contextType = ImportContext;