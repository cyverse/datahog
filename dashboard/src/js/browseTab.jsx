import React from 'react';
import axios from 'axios';

import { FileTree } from './fileTree'
import { LoadingBox } from './loadingBox';

export class BrowseTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            files: [],
            loading: true,
            error: false,
            searching: false,
            searchTerms: '',
            searchResults: [],
            searchLoading: false
        };

        this.searchBar = React.createRef();

        this.searchFiles = this.searchFiles.bind(this);
        this.clearSearch = this.clearSearch.bind(this);

        axios.get('/api/files/top')
        .then(function(response) {
            this.setState({
                files: response.data,
                loading: false
            });
        }.bind(this))
        .catch(function(error) {
            this.setState({
                loading: false,
                error: true
            });
        }.bind(this));
    }

    clearSearch() {
        this.setState({
            searchTerms: '',
            searching: false,
            searchLoading: false,
            searchResults: []
        });
        this.searchBar.current.value = '';
    }

    searchFiles() {
        this.setState({
            searchTerms: this.searchBar.current.value,
            searching: true,
            searchLoading: true,
        });
        axios.post('/api/files/search', {
            name: this.searchBar.current.value
        })
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
            <LoadingBox childLoading={this.state.loading} childError={this.state.error}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <div className="card">
                                <div className="card-header">
                                    <div className="input-group">
                                        <input type="text" className="form-input" placeholder="Search..." ref={this.searchBar}/>
                                        <button className="btn btn-primary input-group-btn" onClick={this.searchFiles}>Go</button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    { this.state.searching ? 
                                        (this.state.searchLoading ? 
                                            <div className="loading loading-lg"></div> :
                                            (
                                                <React.Fragment>
                                                    <div className="toast toast-primary">
                                                        Showing results for "{this.state.searchTerms}".
                                                        <a className="float-right c-hand" onClick={this.clearSearch}>Stop searching</a>
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