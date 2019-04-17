import React from 'react';
import axios from '../axios';
import { FileTable } from './fileTable';
import { PaginatedPanel } from './paginatedPanel';
import { Link } from 'react-router-dom';
import { SizeTimeline } from './sizeTimeline';
import { Size } from '../util';
import { TypePanel } from './typePanel';
import { LoadingWrapper } from '../loadingWrapper';
import { SourceMenu } from '../sources/sourceMenu';

export class SummaryTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sources: [],
            loading: true,
            error: false
        }

        this.onLoad = this.onLoad.bind(this);
        this.switchSource = this.switchSource.bind(this);
        this.onError = this.onError.bind(this);
    }

    onLoad(response) {
        this.setState({
            sources: response.data,
            loading: false,
            error: false
        });
    }

    onError(response) {
        this.setState({
            sources: [],
            loading: false,
            error: true
        });
    }

    switchSource(source) {
        this.setState({
            loading: true
        });
        axios.post('/api/files/viewdirectory', source)
        .then(this.onLoad)
        .catch(this.onError);
    }

    render() {
        return (
            <LoadingWrapper get="/api/files/directories" callback={this.onLoad} loading={this.state.loading} error={this.state.error}>
                { this.state.sources.length && 
                    <div className="container">
                        <div className="columns">
                            <div className="column">
                                <SourceMenu sources={this.state.sources} onChange={this.switchSource}/>
                                <div className="card fixed-height">
                                    <div className="card-header">
                                        <div className="card-title h5">This source has...</div>
                                    </div>
                                    <div className="card-body">
                                        <p>
                                            <i className="fa fa-fw fa-file"></i>
                                            {this.state.sources[0].file_count} files
                                        </p>
                                        <p>
                                            <i className="fa fa-fw fa-folder-open"></i>
                                            {this.state.sources[0].folder_count} folders
                                        </p>
                                        <p>
                                            <Size bytes={this.state.sources[0].total_size} /> occupied
                                        </p>
                                    </div>
                                    <div className="visualization">
                                        <SizeTimeline data={this.state.sources[0].size_timeline_data} id="sizeTimeline"/>
                                    </div>
                                    <div className="card-footer text-center">
                                        <small className="text-gray">Estimated based on file creation time.</small>
                                    </div>
                                </div>
                            </div>
                            <div className="column">
                                <TypePanel data={this.state.sources[0].type_chart_data}/>
                            </div>
                        </div>
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
                }
            </LoadingWrapper>
        );
    }
}