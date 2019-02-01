import React from 'react';
import { LoadingBox } from './loadingBox';
import { UpdateContext } from './updateBox';
import { IrodsForm, CyverseForm } from './updateForm';

export function UpdateTabWithContext() {
    return  (
        <UpdateContext.Consumer>
            {context =>
                <UpdateTab context={context}/>
            }
        </UpdateContext.Consumer>
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
        })
    }
    
    render() {
        return (
            <LoadingBox get="/api/import/latest" callback={this.onLoad} checkForUpdate={false}>
                { this.state.failed && 
                    <div className="toast toast-error">
                        Your last import could not be completed. The folder you requested is likely too large.
                    </div>
                }
                <div className="container">
                    <div className="columns">
                        <CyverseForm lastAttempt={this.state.lastAttempt} updateTriggered={this.props.context.updateTriggered} />
                        <IrodsForm lastAttempt={this.state.lastAttempt} updateTriggered={this.props.context.updateTriggered} />
                    </div>
                </div>
            </LoadingBox>
        );
    }
}