import React from 'react';
import axios from '../axios';

import { LoadingWrapper } from '../loadingWrapper';
import { trimPath } from '../util';
import { ImportModal } from './importForm';

export class SourceTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sources: [],
            loading: true,
            error: false,
            toDelete: null,
            importing: false
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.toggleDeleteModal = this.toggleDeleteModal.bind(this);
        this.toggleImportModal = this.toggleImportModal.bind(this);
        this.deleteSource = this.deleteSource.bind(this);
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

    deleteSource() {
        axios.delete('api/filedata/deletesource', { data: this.state.toDelete })
        .then(this.onLoad)
        .catch(this.onError);
        this.setState({
            toDelete: null
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
                                <button className="btn btn-link float-right">
                                    <i className="fa fa-fw fa-download"></i> Full Database Backup/Restore
                                </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ImportModal active={this.state.importing} onToggle={this.toggleImportModal}/>
                <div className={this.state.toDelete ? 'modal active' : 'modal'} id="modal-id">
                    <a className="modal-overlay" onClick={this.toggleDeleteModal}></a>
                    <div className="modal-container">
                        <div className="modal-header">
                            <div className="modal-title h5">Are you sure?</div>
                        </div>
                        <div className="modal-body">
                            <div className="content">
                                If you remove this source, it will need to be re-imported in order to be viewed again.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={this.deleteSource}>Remove</button>
                            <button className="btn btn-link" onClick={this.toggleDeleteModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            </LoadingWrapper>
        );
    }
}


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