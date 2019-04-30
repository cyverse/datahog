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
        axios.post('/api/filedata/changesource', source)
        .then(this.onLoad)
        .catch(this.onError);
    }

    render() {
        let selectedSource = this.state.sources[0];
        return (
            <LoadingWrapper get="/api/filedata/sources" callback={this.onLoad} loading={this.state.loading} error={this.state.error}>
                { this.state.sources.length && 
                    <div className="container">
                        <div className="columns">
                            <div className="column">
                                <div className="card fixed-height">
                                    <div className="card-body">
                                        <SourceMenu sources={this.state.sources} onChange={this.switchSource}/>
                                        <div style={{marginTop: '20px'}}>
                                            <p>
                                                <i className="fa fa-fw fa-file"></i>
                                                {selectedSource.file_count} files <br/>
                                            </p>
                                            <p>
                                                <i className="fa fa-fw fa-folder-open"></i>
                                                {selectedSource.folder_count} folders <br/>
                                            </p>
                                            <p>
                                                <i className="fa fa-fw fa-area-chart"></i>
                                                <Size bytes={selectedSource.total_size} />
                                            </p>
                                        </div>
                                    </div>
                                    <SizeTimeline data={selectedSource.size_timeline_data} id="sizeTimeline"/>
                                </div>
                            </div>
                            <div className="column">
                                <TypePanel source={selectedSource}/>
                            </div>
                        </div>
                        <div className="columns">
                            <div className="column">
                                <PaginatedPanel
                                    title={'Biggest files in "'+selectedSource.name+'"'}
                                    get="/api/filedata/files"
                                    params={{
                                        source: selectedSource.id,
                                        sort: '-size'
                                    }}/>
                            </div>
                            <div className="column">
                                <PaginatedPanel
                                    title={'Biggest folders in "'+selectedSource.name+'"'}
                                    get="/api/filedata/folders"
                                    params={{
                                        source: selectedSource.id,
                                        sort: '-total_size'
                                    }}/>
                            </div>
                        </div>
                        <div className="columns">
                            <div className="column">
                                <PaginatedPanel
                                    title={'Newest files in  "'+selectedSource.name+'"'}
                                    get="/api/filedata/files"
                                    showDate={true}
                                    params={{
                                        source: selectedSource.id,
                                        sort: '-date_created'
                                    }}/>
                            </div>
                            <div className="column">
                                <PaginatedPanel
                                    title={'Oldest files in "'+selectedSource.name+'"'}
                                    get="/api/filedata/files"
                                    showDate={true}
                                    params={{
                                        source: selectedSource.id,
                                        sort: 'date_created'
                                    }}/>
                            </div>
                        </div>
                    </div>
                }
            </LoadingWrapper>
        );
    }
}