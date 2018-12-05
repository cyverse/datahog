import React from 'react';
import { PaginatedFileTable } from './fileTable';
import { Size } from './util';
import { LoadingBox } from './loadingBox';

export class SummaryTab extends React.Component {

    constructor(props) {
        super(props);
        
        this.state = {
            summary: {}
        };

        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            summary: response.data
        });
    }

    render() {
        return (
            <LoadingBox get="/api/files/summary" callback={this.onLoad} checkForUpdate={true}>
                <div className="container">
                    <div className="columns">
                        <div className="column">
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title h5">You have...</div>
                                </div>
                                <div className="card-body">
                                    <p>
                                        <i className="fa fa-fw fa-file"></i>
                                        {this.state.summary.file_count} files
                                    </p>
                                    <p>
                                        <i className="fa fa-fw fa-folder-open"></i>
                                        {this.state.summary.folder_count} folders
                                    </p>
                                    <p>
                                        <i className="fa fa-fw fa-area-chart"></i>
                                        <Size bytes={this.state.summary.total_size}/> occupied
                                    </p>
                                </div>
                                <div className="card-footer">
                                    Last updated {this.state.summary.timestamp}
                                </div>
                            </div>
                        </div>
                        <div className="column">
                            <PaginatedFileTable title="Top File Types" get="/api/files/biggestfiletypes"/>
                        </div>
                    </div>
                    <div className="columns">
                        <div className="column">
                            <PaginatedFileTable title="Biggest Files" get="/api/files/biggestfiles"/>
                        </div>
                        <div className="column">
                            <PaginatedFileTable title="Biggest Folders" get="/api/files/biggestfolders"/>
                        </div>
                    </div>
                </div>
            </LoadingBox>
        );
    }
}