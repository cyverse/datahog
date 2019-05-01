import React from 'react';
import { IrodsForm } from './irodsForm';
import { CyverseForm } from './cyverseForm';
import { FileForm } from './fileForm';
import { S3Form } from './s3Form';
import { TaskContext, ImportContext } from '../context';


export function ImportModal(props) {
    return (
        <div className={props.active ? 'modal active' : 'modal'}>
            <a className="modal-overlay" onClick={props.onToggle}></a>
            <div className="modal-container import-modal">
                <div className="modal-body">
                    <ImportForm />
                </div>
                <div className="modal-footer">
                    <button className="btn btn-link" onClick={props.onToggle}>Cancel</button>
                </div>
            </div>
        </div>
    );
}


export class ImportForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeForm: 1
        }
    }
    
    render() {
        return (
            <div className="import-form">
                { this.context.lastTask && this.context.lastTask.failed && 
                    <div className="toast toast-error">
                        Your last import could not be completed. The folder you requested may be too large.
                    </div>
                }
                <h5 className="text-center">Import file data from...</h5>
                <ul className="tab tab-block source-tabs">
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
                <ImportContext.Consumer>
                    {importer => (
                        [
                            <div></div>,
                            <IrodsForm onSubmit={this.context.taskStarted} lastAttempt={importer.lastAttempt}/>,
                            <FileForm onSubmit={this.context.taskStarted} lastAttempt={importer.lastAttempt}/>,
                            <CyverseForm onSubmit={this.context.taskStarted} lastAttempt={importer.lastAttempt}/>,
                            <S3Form onSubmit={this.context.taskStarted} lastAttempt={importer.lastAttempt}/>,
                        ][this.state.activeForm]
                    )}
                </ImportContext.Consumer>
            </div>
        );
    }
}

ImportForm.contextType = TaskContext;
