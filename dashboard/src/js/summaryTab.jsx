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
                                <div>
                                    <p>
                                        <i className="fa fa-fw fa-file"></i>&nbsp;
                                        <span style={{fontSize: '130%'}}>{this.state.totals.file_count} files</span>
                                    </p>
                                    <p>
                                        <i className="fa fa-fw fa-folder-open"></i>&nbsp;
                                        <span style={{fontSize: '130%'}}>{this.state.totals.folder_count} folders</span>
                                    </p>
                                    <p>
                                        <i className="fa fa-fw fa-area-chart"></i>&nbsp;
                                        <span style={{fontSize: '130%'}}>
                                            <Size bytes={this.state.totals.total_size}/> occupied
                                        </span>
                                    </p>
                                    <p>
                                        Last updated {this.state.totals.timestamp}
                                    </p>
                                </div>
                            }
                        </div>
                        <div className="column">
                            {this.state.topTenTypes &&
                                <SimpleFileTable
                                    title={'Top File Types'}
                                    files={this.state.topTenTypes}
                                />
                            }
                        </div>
                    </div>
                    <div className="columns">
                        <div className="column">
                            {this.state.topTenFiles &&
                                <SimpleFileTable
                                    title={'Largest Files'}
                                    files={this.state.topTenFiles}
                                />
                            }
                        </div>
                        <div className="column">
                            {this.state.topTenFolders &&
                                <SimpleFileTable
                                    title={'Largest Folders'}
                                    files={this.state.topTenFolders}
                                />
                            }
                        </div>
                    </div>
                </div>
            </LoadingBox>
        );
    }
}