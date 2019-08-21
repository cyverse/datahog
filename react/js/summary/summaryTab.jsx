import React from 'react';
import axios from '../axios';
import { PaginatedPanel } from './paginatedPanel';
import { SizeTimeline } from './sizeTimeline';
import { Size } from '../util';
import { TypePanel } from './typePanel';
import { LoadingWrapper } from '../loadingWrapper';
import { SourceMenu } from '../sources/sourceMenu';
import { ActivityPanel } from './activityPanel';

/**
 * The app's "Summary" tab.
 * Includes a SourceMenu to select a file source, which re-renders the tab.
 * Includes panels with:
 * - Basic file source statistics
 * - A SizeTimeline
 * - A TypeChart
 * - The largest files
 * - The largest folders
 * - The newest files
 * - The oldest files
 */
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
                                <div className="card">
                                    <div className="card-body">
                                        <SourceMenu sources={this.state.sources} onChange={this.switchSource}/>
                                        <div className="container">
                                            <div className="columns" style={{marginTop: '10px'}}>
                                                <p className="column">
                                                    <i className="fa fa-fw fa-file"></i>
                                                    {selectedSource.file_count} files <br/>
                                                </p>
                                                <p className="column">
                                                    <i className="fa fa-fw fa-area-chart"></i>
                                                    <Size bytes={selectedSource.total_size} />
                                                </p>
                                            </div>
                                            <div className="columns" style={{marginTop: '7px'}}>
                                                <p className="column">
                                                    <i className="fa fa-fw fa-folder-open"></i>
                                                    {selectedSource.folder_count} folders <br/>
                                                </p>
                                                <p className="column">
                                                    <i className="fa fa-fw fa-calendar"></i>
                                                    Scanned {selectedSource.date_scanned}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ActivityPanel source={selectedSource} />

                                { selectedSource.has_owners &&
                                    <PaginatedPanel
                                        title={'User Breakdown'}
                                        get="/api/filedata/owners"
                                        params={{
                                            source: selectedSource.id,
                                            sort: '-total_size'
                                        }}/>
                                }
                                { selectedSource.has_groups &&
                                    <PaginatedPanel
                                        title={'Group Breakdown'}
                                        get="/api/filedata/groups"
                                        params={{
                                            source: selectedSource.id,
                                            sort: '-total_size'
                                        }}/>
                                }
                                <PaginatedPanel
                                    title={'Biggest folders in "'+selectedSource.name+'"'}
                                    get="/api/filedata/folders"
                                    params={{
                                        source: selectedSource.id,
                                        sort: '-total_size'
                                    }}/>
                            </div>
                            <div className="column">
                                <TypePanel source={selectedSource}/>
                                <PaginatedPanel
                                    title={'Biggest files in "'+selectedSource.name+'"'}
                                    get="/api/filedata/files"
                                    params={{
                                        source: selectedSource.id,
                                        sort: '-size'
                                    }}/>
                                    
                                <PaginatedPanel
                                    title={'Newest files in  "'+selectedSource.name+'"'}
                                    get="/api/filedata/files"
                                    showDate={true}
                                    params={{
                                        source: selectedSource.id,
                                        sort: '-date_created'
                                    }}/>
                                <PaginatedPanel
                                    title={'Oldest files in "'+selectedSource.name+'"'}
                                    get="/api/filedata/files"
                                    showDate={true}
                                    params={{
                                        source: selectedSource.id,
                                        sort: 'date_created'
                                    }}/>
                                {/* <SizeTimeline data={selectedSource.size_timeline_data} id="sizeTimeline"/> */}
                            </div>
                        </div>
                    </div>
                }
            </LoadingWrapper>
        );
    }
}