import React from 'react';
import axios from 'axios';

import { FileTree } from './fileTree'
import { LoadingBox } from './loadingBox';
import { SearchForm } from './searchForm';

export class BrowseTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            files: [],
            searching: false,
            searchResults: [],
            moreResults: false,
            searchLoading: false,
            searchParams: {}
        };

        this.searchForm = React.createRef();
        
        this.searchFiles = this.searchFiles.bind(this);
        this.clearSearch = this.clearSearch.bind(this);
        this.onLoad = this.onLoad.bind(this);
        this.onSearchLoad = this.onSearchLoad.bind(this);
        this.onSearchError = this.onSearchError.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.getCsvUrl = this.getCsvUrl.bind(this);
    }

    onLoad(response) {
        this.setState({
            files: response.data
        });
    }

    onSearchLoad(response) {
        this.setState({
            files: this.state.files,
            searching: true,
            searchLoading: false,
            searchResults: this.state.searchResults.concat(response.data),
            searchParams: this.state.searchParams,
            moreResults: response.data.length >= 100
        });
    }

    onSearchError(error) {
        this.setState({
            files: this.state.files,
            searching: true,
            searchLoading: false,
            searchResults: [],
            searchParams: this.state.searchParams,
            moreResults: false
        });
    }

    clearSearch() {
        this.searchForm.current.clearSearch();
        this.setState({
            searching: false,
            searchLoading: false,
            searchResults: [],
            searchParams: {}
        });
    }

    searchFiles(params) {
        this.setState({
            searching: true,
            searchLoading: true,
            searchResults: [],
            searchParams: params
        });
        axios.get('/api/files/search', {
            params: params
        }).then(this.onSearchLoad)
        .catch(this.onSearcherror);
    }

    getCsvUrl() {
        return axios.getUri({
            url: '/api/files/searchcsv',
            method: 'get',
            params: this.state.searchParams
        });
    }

    handleScroll(event) {
        let hitBottom = event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;
        if (hitBottom && this.state.searching && !this.state.searchLoading && this.state.moreResults) {
            let params = this.state.searchParams;
            params.offset = this.state.searchResults.length;
            this.setState({
                searching: true,
                searchLoading: true
            });
            axios.get('/api/files/search', {
                params: params
            })
            .then(this.onSearchLoad)
            .catch(this.onSearchError);
        }
    }

    render() {
        return (
            <LoadingBox get="/api/files/top" callback={this.onLoad} checkForUpdate={true}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <div className="panel fixed-height">
                                <div className="panel-header search-header form-horizontal">
                                    <SearchForm state={null} submit={this.searchFiles} ref={this.searchForm} />
                                    { this.state.searching && !this.state.searchLoading &&
                                        <div className="toast">
                                            Found {this.state.searchResults.length}{this.state.moreResults && '+'} results.
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
                                    { this.state.searching ?
                                        (
                                            <React.Fragment>
                                                <FileTree files={this.state.searchResults}
                                                    searchOnSort={this.state.moreResults}
                                                    searchCallback={this.searchFiles}
                                                    searchParams={this.state.searchParams}/>
                                                {this.state.searchLoading && 
                                                    <div className="loading loading-lg"></div>
                                                }
                                            </React.Fragment>
                                        ) :
                                        <FileTree files={this.state.files} />
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LoadingBox>
        );
    }
}