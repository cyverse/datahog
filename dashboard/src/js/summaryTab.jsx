import React from 'react';
import axios from 'axios';

import { SimpleFileTable, SimpleFileTableRow } from './simpleFileTable';
import { Size } from './util';

export class SummaryTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            topTenFiles: [],
            topTenFolders: [],
            topTenTypes: [],
            totals: {},
            selectedRow: null
        };

        this.onRowClick = this.onRowClick.bind(this);

        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
        axios.defaults.xsrfCookieName = "csrftoken";

        this.receiveTopTenTypes = this.receiveTopTenTypes.bind(this);
        this.receiveTopTenFiles = this.receiveTopTenFiles.bind(this);
        this.receiveTopTenFolders = this.receiveTopTenFolders.bind(this);
        this.receiveTotals = this.receiveTotals.bind(this);

        axios.get('/api/summaries/totals')
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
        this.setState({
            selectedRow: this.state.selectedRow,
            topTenFolders: this.state.topTenFolders,
            topTenFiles: this.state.topTenFiles,
            topTenTypes: response.data,
            totals: this.state.totals
        });
    }

    receiveTopTenFiles(response) {
        this.setState({
            selectedRow: this.state.selectedRow,
            topTenFolders: this.state.topTenFolders,
            topTenFiles: response.data,
            topTenTypes: this.state.topTenTypes,
            totals: this.state.totals
        });
    }

    receiveTopTenFolders(response) {
        this.setState({
            selectedRow: this.state.selectedRow,
            topTenFolders: response.data,
            topTenFiles: this.state.topTenFiles,
            topTenTypes: this.state.topTenTypes,
            totals: this.state.totals
        });
    }

    receiveTotals(response) {
        this.setState({
            selectedRow: this.state.selectedRow,
            topTenFolders: this.state.topTenFolders,
            topTenFiles: this.state.topTenFiles,
            topTenTypes: this.state.topTenTypes,
            totals: response.data
        });
    }

    onRowClick(row) {
        this.setState({
            selectedRow: row,
            summaries: this.state.summaries
        });
    }

    render() {
        return (
            <div className="container">
                <div className="row">
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
                                selectedRow={this.state.selectedRow}
                                onRowClick={this.onRowClick}
                            />
                        }
                    </div>
                </div>
                <div className="row">
                    <div className="column">
                        {this.state.topTenFiles &&
                            <SimpleFileTable
                                title={'Largest Files'}
                                files={this.state.topTenFiles}
                                selectedRow={this.state.selectedRow}
                                onRowClick={this.onRowClick}
                            />
                        }
                    </div>
                    <div className="column">
                        {this.state.topTenFolders &&
                            <SimpleFileTable
                                title={'Largest Folders'}
                                files={this.state.topTenFolders}
                                selectedRow={this.state.selectedRow}
                                onRowClick={this.onRowClick}
                            />
                        }
                    </div>
                </div>
            </div>
        );
    }
}