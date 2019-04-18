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
                                <div className="card fixed-height">
                                    <div className="card-body">
                                        <SourceMenu sources={this.state.sources} onChange={this.switchSource}/>
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
                                    <SizeTimeline data={this.state.sources[0].size_timeline_data} id="sizeTimeline"/>
                                </div>
                            </div>
                            <div className="column">
                                <TypePanel data={this.state.sources[0].type_chart_data}/>
                            </div>
                        </div>
                        <div className="columns">
                            <div className="column">
                                <PaginatedPanel title="Biggest Files"
                                    get="/api/files/biggestfiles"
                                    source={this.state.sources[0]}/>
                            </div>
                            <div className="column">
                                <PaginatedPanel title="Biggest Folders"
                                    get="/api/files/biggestfolders"
                                    source={this.state.sources[0]}/>
                            </div>
                        </div>
                        <div className="columns">
                            <div className="column">
                                <PaginatedPanel title="Newest Files"
                                    get="/api/files/newestfiles"
                                    source={this.state.sources[0]}
                                    showDate={true}/>
                            </div>
                            <div className="column">
                                <PaginatedPanel title="Oldest Files"
                                    get="/api/files/oldestfiles"
                                    source={this.state.sources[0]}
                                    showDate={true}/>
                            </div>
                        </div>
                    </div>
                }
            </LoadingWrapper>
        );
    }
}