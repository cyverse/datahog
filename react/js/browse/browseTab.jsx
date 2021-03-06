import React from 'react';
import axios from '../axios';

import { FileTree } from './fileTree'
import { LoadingWrapper } from '../loadingWrapper';
import { SearchForm } from './searchForm';
import { MultiSelect } from '../util';
import { SourceContext } from '../context';

/**
 * The app's "Browse Files" tab.
 * Fetches top-level files and search results.
 * Uses SourceContext to remember which sources are currently enabled.
 */
export class BrowseTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            files: [],
            sources: [],
            include: new Set(),
            loading: true,
            searching: false,
            moreResults: false,
            searchParams: {}
        };

        this.cancelToken = null;
        this.searchForm = React.createRef();

        this.onLoad = this.onLoad.bind(this);
        this.getTopFiles = this.getTopFiles.bind(this);
        this.onFilesLoad = this.onFilesLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.searchFiles = this.searchFiles.bind(this);
        this.clearSearch = this.clearSearch.bind(this);
        this.onSearchLoad = this.onSearchLoad.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.getCsvUrl = this.getCsvUrl.bind(this);
        this.sourcesChanged = this.sourcesChanged.bind(this);
    }

    componentWillUnmount() {
        this.context.include = this.state.include;
    }

    onLoad(response) {
        let include;
        if (this.context.include) {
            include = this.context.include;
        } else {
            include = new Set(response.data.map(source => source.id));
        }
        this.setState({
            sources: response.data,
            include: include
        });
        axios.get('/api/filedata/top', {
            params: {
                sources: Array.from(this.state.include)
            }
        }).then(this.onFilesLoad)
        .catch(this.onError);
    }

    getTopFiles() {
        this.setState({
            loading: true,
            searching: false,
            files: [],
            moreResults: false
        });
        axios.get('/api/filedata/top', {
            params: {
                sources: Array.from(this.state.include)
            }
        }).then(this.onFilesLoad)
        .catch(this.onError);
    }
    
    onFilesLoad(response) {
        this.setState({
            files: response.data,
            loading: false
        });
    }

    onError(error) {
        if (!axios.isCancel(error)) {
            this.setState({
                files: [],
                loading: false,
                moreResults: false
            });
        }
    }

    searchFiles(params) {
        params.sources = Array.from(this.state.include);
        this.setState({
            searching: true,
            loading: true,
            files: [],
            searchParams: params
        });
        axios.get('/api/filedata/files', {
            params: Object.assign({
                sources: Array.from(this.state.include),
                limit: 100
            }, params)
        }).then(this.onSearchLoad)
        .catch(this.onError);
    }

    onSearchLoad(response) {
        this.setState({
            files: this.state.files.concat(response.data.page),
            loading: false,
            moreResults: this.state.files.length + response.data.page.length < response.data.total
        });
    }

    clearSearch() {
        this.searchForm.current.clearSearch();
        this.getTopFiles();
    }

    handleScroll(event) {
        let hitBottom = event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;
        if (hitBottom && this.state.searching && !this.state.loading && this.state.moreResults) {
            this.setState({
                loading: true
            });
            axios.get('/api/filedata/files', {
                params: Object.assign({
                    sources: Array.from(this.state.include),
                    limit: 100,
                    offset: this.state.files.length
                }, this.state.searchParams)
            }).then(this.onSearchLoad)
            .catch(this.onError);
        }
    }

    getCsvUrl() {
        return axios.getUri({
            url: '/api/filedata/searchcsv',
            method: 'get',
            params: this.state.searchParams
        });
    }

    sourcesChanged() {
        if (this.state.searching) {
            this.searchFiles(this.state.searchParams);
        } else {
            this.getTopFiles();
        }
    }

    render() {
        return (
            <LoadingWrapper get="/api/filedata/sources" callback={this.onLoad}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <div className="panel fixed-height">
                                <div className="panel-header search-header form-horizontal">
                                    { this.state.sources.length > 1 && 
                                        <div className="form-group">
                                            <MultiSelect choices={this.state.sources} value={this.state.include} onChange={this.sourcesChanged}/>
                                        </div>
                                    }
                                    <SearchForm state={null} submit={this.searchFiles} ref={this.searchForm} />
                                    { this.state.searching && !this.state.loading &&
                                        <div className="toast">
                                            Found {this.state.files.length}{this.state.moreResults && '+'} results.
                                            <a className="float-right c-hand" onClick={this.clearSearch}>
                                                Clear search
                                            </a>
                                            <a className="float-right c-hand" href={this.getCsvUrl()} style={{'marginRight': '10px'}}>
                                                Export all results
                                            </a>
                                        </div>
                                    }   
                                </div>
                                <div className="panel-body" onScroll={this.handleScroll}>
                                    <FileTree files={this.state.files}
                                        searching={this.state.searching}
                                        searchOnSort={this.state.moreResults}
                                        searchCallback={this.searchFiles}
                                        searchParams={this.state.searchParams}/>
                                    { this.state.loading && 
                                        <div className="loading loading-lg"></div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LoadingWrapper>
        );
    }
}

BrowseTab.contextType = SourceContext;