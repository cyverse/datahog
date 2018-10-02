import React from 'react';
import axios from 'axios';

import { SimpleFileTable, SimpleFileTableRow } from './simpleFileTable';

export class SummaryTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            summaries: {},
            selectedRow: null
        };

        this.onRowClick = this.onRowClick.bind(this);

        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
        axios.defaults.xsrfCookieName = "csrftoken";

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
        .then(this.receiveTotals)
        .catch(function(error) {
            console.log(error);
        });

        axios.get('/api/summaries/folders')
        .then(this.receiveTotals)
        .catch(function(error) {
            console.log(error);
        });
    }

    receiveTopTenTypes() {
        
    }

    receieveTopTenFiles() {

    }

    receiveTopTenFolders() {

    }

    receiveTotals() {

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
                    <div className="widget column">
                        {this.state.summaries.totals && 
                            <div>
                                <p>
                                    <i className="fa fa-fw fa-file"></i>
                                    {this.state.totals.file_count}
                                </p>
                                <p>
                                    <i className="fa fa-fw fa-folder-open"></i>
                                    {this.state.totals.folder_count}
                                </p>
                                <p>
                                    <i className="fa fa-fw fa-area-chart"></i>
                                    {this.state.totals.total_size}
                                </p>
                                <p>
                                    Last updated {this.state.totals.timestamp}
                                </p>
                            </div>
                        }
                    </div>
                    <div className="column">
                        {this.state.summaries.topTenTypes &&
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
                        {this.state.summaries.topTenFiles &&
                            <SimpleFileTable
                                title={'Largest Files'}
                                files={this.state.topTenFiles}
                                selectedRow={this.state.selectedRow}
                                onRowClick={this.onRowClick}
                            />
                        }
                    </div>
                    <div className="column">
                        {this.state.summaries.topTenFolders &&
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