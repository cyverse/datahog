import React from 'react';
import axios from 'axios';

import { SimpleFileTable } from './simpleFileTable';
import { Size } from './util';
import { LoadingBox } from './loadingBox';

export class SummaryTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            topTenFiles: [],
            topTenFolders: [],
            topTenTypes: [],
            totals: {}
        };

        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
        axios.defaults.xsrfCookieName = "csrftoken";

        this.receiveTopTenTypes = this.receiveTopTenTypes.bind(this);
        this.receiveTopTenFiles = this.receiveTopTenFiles.bind(this);
        this.receiveTopTenFolders = this.receiveTopTenFolders.bind(this);
        this.receiveTotals = this.receiveTotals.bind(this);

        axios.get('/api/updates/latest')
        .then(this.receiveTotals)
        .catch(function(error) {
            console.log(error);
        });

        axios.get('/api/summaries/types')
        .then(this.receiveTopTenTypes)
        .catch(function(error) {
            console.log(error);
        });

        axios.get('/api/summaries/files')
        .then(this.receiveTopTenFiles)
        .catch(function(error) {
            console.log(error);
        });

        axios.get('/api/summaries/folders')
        .then(this.receiveTopTenFolders)
        .catch(function(error) {
            console.log(error);
        });
    }

    receiveTopTenTypes(response) {
        this.setState(state => ({
            topTenFolders: state.topTenFolders,
            topTenFiles: state.topTenFiles,
            topTenTypes: response.data,
            totals: state.totals
        }));
    }

    receiveTopTenFiles(response) {
        this.setState(state => ({
            topTenFolders: state.topTenFolders,
            topTenFiles: response.data,
            topTenTypes: state.topTenTypes,
            totals: state.totals
        }));
    }

    receiveTopTenFolders(response) {
        this.setState(state => ({
            topTenFolders: response.data,
            topTenFiles: state.topTenFiles,
            topTenTypes: state.topTenTypes,
            totals: state.totals
        }));
    }

    receiveTotals(response) {
        this.setState(state => ({
            topTenFolders: state.topTenFolders,
            topTenFiles: state.topTenFiles,
            topTenTypes: state.topTenTypes,
            totals: response.data
        }));
    }

    render() {
        return (
            <LoadingBox childLoading={this.state.loading} childError={this.state.error}>
                <div className="container">
                    <div className="columns">
                        <div className="column">
                            {this.state.totals &&
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title h5">You have...</div>
                                    </div>
                                    <div className="card-body">
                                        <p>
                                            <i className="fa fa-fw fa-file"></i>&nbsp;
                                            {this.state.totals.file_count} files
                                        </p>
                                        <p>
                                            <i className="fa fa-fw fa-folder-open"></i>&nbsp;
                                            {this.state.totals.folder_count} folders
                                        </p>
                                        <p>
                                            <i className="fa fa-fw fa-area-chart"></i>&nbsp;
                                                <Size bytes={this.state.totals.total_size}/> occupied
                                        </p>
                                    </div>
                                    <div className="card-footer">
                                        Last updated {this.state.totals.timestamp}
                                    </div>
                                </div>
                            }
                        </div>
                        <div className="column">
                            {this.state.topTenTypes &&
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title h5">Top File Types</div>
                                    </div>
                                    <div className="card-body">
                                        <SimpleFileTable
                                            title={'Top File Types'}
                                            files={this.state.topTenTypes}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                    <div className="columns">
                        <div className="column">
                            {this.state.topTenFiles &&
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title h5">Largest Files</div>
                                    </div>
                                    <div className="card-body">
                                        <SimpleFileTable
                                            title={'Largest Files'}
                                            files={this.state.topTenFiles}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                        <div className="column">
                            {this.state.topTenFolders &&
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title h5">Largest Folders</div>
                                    </div>
                                    <div className="card-body">
                                        <SimpleFileTable
                                            title={'Largest Folders'}
                                            files={this.state.topTenFolders}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </LoadingBox>
        );
    }
}