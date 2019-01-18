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
            searchLoading: false
        };

        this.searchBar = React.createRef();
        
        this.searchFiles = this.searchFiles.bind(this);
        this.clearSearch = this.clearSearch.bind(this);
        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            files: response.data
        });
    }

    clearSearch() {
        this.setState({
            searching: false,
            searchLoading: false,
            searchResults: []
        });
        this.searchBar.current.value = '';
    }

    searchFiles(params) {
        this.setState({
            searching: true,
            searchLoading: true,
        });
        axios.post('/api/files/search', params)
        .then(function(response) {
            this.setState({
                searchLoading: false,
                searchResults: response.data
            });
        }.bind(this))
        .catch(function(error) {
            this.setState({
                searchLoading: false,
                searchResults: []
            });
        }.bind(this));
    }

    render() {
        return (
            <LoadingBox get="/api/files/top" callback={this.onLoad} checkForUpdate={true}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <div className="panel fixed-height">
                                <div className="panel-header search-header form-horizontal">
                                    <SearchForm state={null} submit={this.searchFiles} />
                                </div>
                                <div className="panel-body">
                                    { this.state.searching ? 
                                        (this.state.searchLoading ? 
                                            <div className="loading loading-lg"></div> :
                                            (
                                                <React.Fragment>
                                                    <div className="toast">
                                                        Found {this.state.searchResults.length} results.
                                                        <a className="float-right c-hand" onClick={this.clearSearch}>
                                                            Clear search
                                                        </a>
                                                    </div>
                                                    <FileTree files={this.state.searchResults} />
                                                </React.Fragment>
                                            )
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