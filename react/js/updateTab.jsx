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
        });
    }
    
    render() {
        return (
            <LoadingBox get="/api/import/latest" callback={this.onLoad} checkForUpdate={false}>
                {this.state.lastAttempt &&
                    <div className="container">
                        <div className="columns">
                            <IrodsForm lastAttempt={this.state.lastAttempt} context={this.props.context} />
                            <CyverseForm lastAttempt={this.state.lastAttempt} context={this.props.context} />
                        </div>
                    </div>
                }
            </LoadingBox>
        );
    }
}