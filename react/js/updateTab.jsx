import React from 'react';
import { LoadingBox } from './loadingBox';
import { ImportContext } from './importWrapper';
import { IrodsForm, CyverseForm, FileForm } from './updateForm';

export function UpdateTabWithContext() {
    return  (
        <ImportContext.Consumer>
            {context =>
                <UpdateTab context={context}/>
            }
        </ImportContext.Consumer>
    )
}

export class UpdateTab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            lastAttempt: null
        };

        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            lastAttempt: response.data
        });
    }
    
    render() {
        return (
            <LoadingBox get="/api/import/latest" callback={this.onLoad} checkForUpdate={false}>
                { this.state.lastAttempt && this.state.lastAttempt.failed && 
                    <div className="toast toast-error">
                        Your last import could not be completed. The folder you requested may be too large.
                    </div>
                }
                { this.state.lastAttempt &&
                    <div className="container">
                        <div className="columns">
                            <IrodsForm lastAttempt={this.state.lastAttempt} context={this.props.context} />
                            <FileForm context={this.props.context} />
                            <CyverseForm lastAttempt={this.state.lastAttempt} context={this.props.context} />
                        </div>
                    </div>
                }
            </LoadingBox>
        );
    }
}