import React from 'react';
import axios from '../axios';

import { LoadingWrapper } from '../loadingWrapper';
import { ImportModal, DeleteModal, BackupModal } from './modals';
import { TaskContext } from '../context';


/**
 * The app's "Manage File Sources" tab.
 * Includes a SourceTable and modals to manage them.
 */
export class SourceTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sources: [],
            loading: true,
            error: false,
            toDelete: null,
            importing: false,
            backup: false
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.toggleDeleteModal = this.toggleDeleteModal.bind(this);
        this.toggleImportModal = this.toggleImportModal.bind(this);
        this.toggleBackupModal = this.toggleBackupModal.bind(this);
    }

    onLoad(response) {
        this.setState({
            sources: response.data,
            loading: false
        });
    }

    onError(error) {
        this.setState({
            sources: [],
            loading: false,
            error: true
        });
    }

    toggleDeleteModal(source) {
        this.setState({
            toDelete: this.state.toDelete ? null : source
        });
    }

    toggleImportModal() {
        this.setState({
            importing: !this.state.importing
        });
    }

    toggleBackupModal() {
        this.setState({
            backup: !this.state.backup
        });
    }

    render() {
        return (
            <LoadingWrapper get="/api/filedata/sources" callback={this.onLoad} loading={this.state.loading} error={this.state.error}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <div className="card">
                                <div className="card-body">
                                    <SourceTable sources={this.state.sources} onDelete={this.toggleDeleteModal}/>
                                </div>
                                <div className="card-footer">
                                <button className="btn btn-primary" onClick={this.toggleImportModal}>
                                    <i className="fa fa-fw fa-plus"></i> Import New Source
                                </button>
                                <button className="btn btn-link float-right" onClick={this.toggleBackupModal}>
                                    <i className="fa fa-fw fa-download"></i> Full Database Backup/Restore
                                </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ImportModal active={this.state.importing} onToggle={this.toggleImportModal}/>
                <DeleteModal active={this.state.toDelete} onToggle={this.toggleDeleteModal} source={this.state.toDelete}/>
                <BackupModal active={this.state.backup} onToggle={this.toggleBackupModal} />
            </LoadingWrapper>
        );
    }
}

SourceTab.contextType = TaskContext;


/**
 * A table to list file sources.
 */
export function SourceTable(props) {
    return (
        <table className='table file-table table-hover'>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Date Scanned</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {props.sources.map(source => {
                    return (
                        <SourceRow key={source.id} source={source} onDelete={props.onDelete}/>
                    )
                })}
            </tbody>
        </table>
    );
}

/**
 * A row of a SourceTable, representing a single file source.
 */
export class SourceRow extends React.Component {
    constructor(props) {
        super(props);
        this.onDelete = this.onDelete.bind(this);
    }

    onDelete() {
        this.props.onDelete(this.props.source);
    }

    render() {
        let backupUrl = axios.getUri({
            url: '/api/filedata/backup',
            method: 'get',
            params: { source: this.props.source.id }
        });
        return (
            <tr>
                <td>
                    {this.props.source.name}
                </td>
                <td>
                    {this.props.source.directory_type}
                </td>
                <td>
                    {this.props.source.date_scanned}
                </td>
                <td>
                    <a className="btn btn-link table-option" href={backupUrl}>
                        Save as file
                    </a>
                    <a className="btn btn-link table-option" onClick={this.onDelete}>
                        Remove
                    </a>
                </td>
            </tr>
        );
    }
}