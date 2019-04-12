import React from 'react';
import { FileTable } from './fileTable';
import { PaginatedPanel } from './paginatedPanel';
import { Link } from 'react-router-dom';
import { SizeTimeline } from './sizeTimeline';
import { TypePanel } from './typePanel';
import { LoadingWrapper } from '../loadingWrapper';

export class SummaryTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sources: [],
            selected: 0
        }

        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            sources: response.data,
            currentSource: response.data[0]
        });
    }

    render() {
        return (
            <LoadingWrapper get="/api/files/directories" callback={this.onLoad}>
                <div className="container">
                    {/* <div className="columns">
                        <div className="column">
                            <div className="card fixed-height">
                                <div className="card-header">
                                    <div className="card-title h5">You have...</div>
                                </div>
                                <div className="card-body">
                                    <p>
                                        <i className="fa fa-fw fa-file"></i>
                                        {this.state.currentSource.file_count} files
                                    </p>
                                    <p>
                                        <i className="fa fa-fw fa-folder-open"></i>
                                        {this.context.directory.folder_count} folders
                                    </p>
                                    <p>
                                        {this.context.directory.duplicate_count > 0 ? 
                                            <Link to="/duplicates">
                                                <i className="fa fa-fw fa-clone"></i>
                                                {this.context.directory.duplicate_count} duplicated files
                                            </Link> :
                                            <React.Fragment>
                                                <i className="fa fa-fw fa-clone"></i>
                                                0 duplicated files
                                            </React.Fragment>
                                        }
                                    </p>
                                </div>
                                <div className="visualization">
                                    <SizeTimeline data={this.context.directory.size_timeline_data} id="sizeTimeline"/>
                                </div>
                                <div className="card-footer">
                                    Snapshot from {this.context.directory.date_scanned}
                                    <a href="/api/files/savefile">Back up file data</a>
                                </div>
                            </div>
                        </div>
                        <div className="column">
                            <TypePanel data={this.context.directory.type_chart_data}/>
                        </div>
                    </div> */}
                    <div className="columns">
                        <div className="column">
                            <PaginatedPanel
                                scroll={false}
                                title="Biggest Files"
                                get="/api/files/biggestfiles"
                                component={FileTable}/>
                        </div>
                        <div className="column">
                            <PaginatedPanel
                                scroll={false}
                                title="Biggest Folders"
                                get="/api/files/biggestfolders"
                                component={FileTable}/>
                        </div>
                    </div>
                    <div className="columns">
                        <div className="column">
                            <PaginatedPanel
                                scroll={false}
                                title="Newest Files"
                                get="/api/files/newestfiles"
                                component={FileTable}
                                showDate={true}/>
                        </div>
                        <div className="column">
                            <PaginatedPanel
                                scroll={false}
                                title="Oldest Files"
                                get="/api/files/oldestfiles"
                                component={FileTable}
                                showDate={true}/>
                        </div>
                    </div>
                </div>
            </LoadingWrapper>
        );
    }
}