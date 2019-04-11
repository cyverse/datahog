import React from 'react';
import { IrodsForm } from './irodsForm';
import { CyverseForm } from './cyverseForm';
import { FileForm } from './fileForm';
import { ImportContext } from '../context';
import { S3Form } from './s3Form';

export class ImportForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeForm: 1
        }
    }
    
    render() {
        return (
            <React.Fragment>
                { this.context.lastAttempt && this.context.lastAttempt.failed && 
                    <div className="toast toast-error">
                        Your last import could not be completed. The folder you requested may be too large.
                    </div>
                }
                <h5 className="text-center" style={{margin: '30px'}}>Import file data from...</h5>
                <ul className="tab tab-block source-tabs" style={{marginBottom: '20px'}}>
                    <li className='tab-item c-hand source-tab'>
                        <a className={this.state.activeForm === 1 ? 'active' : ''} onClick={() => this.setState({activeForm: 1})}>
                            iRODS
                        </a>
                    </li>
                    <li className='tab-item c-hand source-tab'>
                        <a className={this.state.activeForm === 2 ? 'active' : ''} onClick={() => this.setState({activeForm: 2})}>
                            .datahog File
                        </a>
                    </li>
                    <li className='tab-item c-hand source-tab'>
                        <a className={this.state.activeForm === 3 ? 'active' : ''} onClick={() => this.setState({activeForm: 3})}>
                            CyVerse
                        </a>
                    </li>
                    <li className='tab-item c-hand source-tab'>
                        <a className={this.state.activeForm === 4 ? 'active' : ''} onClick={() => this.setState({activeForm: 4})}>
                            S3 Bucket
                        </a>
                    </li>
                </ul>
                {
                    [
                        <div></div>,
                        <IrodsForm lastAttempt={this.context.lastAttempt} onSubmit={this.context.updateTriggered} />,
                        <FileForm onSubmit={this.context.updateTriggered} />,
                        <CyverseForm lastAttempt={this.context.lastAttempt} onSubmit={this.context.updateTriggered} />,
                        <S3Form lastAttempt={this.context.lastAttempt} onSubmit={this.context.updateTriggered} />,
                    ][this.state.activeForm]
                }
            </React.Fragment>
        );
    }
}

ImportForm.contextType = ImportContext;

export function ImportTab(props) {
    return (
        <div className="container">
            <div className="columns">
                <div className="column col-7 col-mx-auto">
                    <ImportForm />
                </div>
            </div>
        </div>
    );
}