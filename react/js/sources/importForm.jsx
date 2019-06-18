import React from 'react';
import { IrodsForm } from './irodsForm';
import { CyverseForm } from './cyverseForm';
import { FileForm } from './fileForm';
import { S3Form } from './s3Form';
import { TaskContext, ImportContext } from '../context';

/**
 * Tabs containing forms for all import methods.
 */
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
