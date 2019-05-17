import React from 'react';
import axios from '../axios';

import { DuplicateTable } from './duplicateTable';
import { LoadingWrapper } from '../loadingWrapper';
import { MultiSelect } from '../util';
import { SourceContext } from '../context';

export class DuplicatesTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sources: [],
            include: new Set(),
            dupeGroups: [],
            allowDifferentNames: true,
            searchLoading: false,
            moreResults: false,
            sort: ''
        };

        this.cancelToken = null;

        this.onLoad = this.onLoad.bind(this);
        this.onSearchLoad = this.onSearchLoad.bind(this);
        this.onSearchError = this.onSearchError.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.getDuplicates = this.getDuplicates.bind(this);
        this.onResort = this.onResort.bind(this);
    }

    componentWillUnmount() {
        if (this.cancelToken) this.cancelToken.cancel();
        this.context.include = this.state.include;
    }

    onLoad(response) {
        let include;
        if (this.context.include) {
            include = this.context.include;
        } else {
            include = new Set();
            for (let source of response.data) {
                include.add(source.id);
            }
        }
        this.setState({
            sources: response.data,
            include: include
        });
        this.getDuplicates();
    }

    onSearchLoad(response) {
        let files = response.data.page;
        let dupeGroups = [];
        if (files.length) {
            let currentChecksum = files[0].checksum;
            let currentDupeGroup = [];
            for (let file of files) {
                if (file.checksum === currentChecksum) {
                    currentDupeGroup.push(file);
                } else {
                    dupeGroups.push(currentDupeGroup);
                    currentChecksum = file.checksum;
                    currentDupeGroup = [file];
                }
            }
            dupeGroups.push(currentDupeGroup);
        }

        if (this.state.sort === '-total_size') {
            dupeGroups.sort((a, b) => b[0].size*b.length - a[0].size*a.length);
        } else if (this.state.sort === 'total_size') {
            dupeGroups.sort((a, b) => a[0].size*a.length - b[0].size*b.length);
        } else if (this.state.sort === '-size') {
            dupeGroups.sort((a, b) => b[0].size - a[0].size);
        } else if (this.state.sort === 'size') {
            dupeGroups.sort((a, b) => a[0].size - b[0].size);
        } else if (this.state.sort === '-dupe_count') {
            dupeGroups.sort((a, b) => b.length - a.length);
        } else if (this.state.sort === 'dupe_count') {
            dupeGroups.sort((a, b) => a.length - b.length);
        }

        this.setState({
            dupeGroups: this.state.dupeGroups.concat(dupeGroups),
            searchLoading: false,
            moreResults: this.state.dupeGroups.length + dupeGroups.length < response.data.total
        });
    }

    onSearchError(error) {
        if (!axios.isCancel(error)) {
            this.setState({
                dupeGroups: [],
                searchLoading: false
            });
        }
    }

    getDuplicates(sortBy) {
        if (!sortBy) sortBy = this.state.sort;
        if (this.cancelToken) this.cancelToken.cancel();
        this.cancelToken = axios.CancelToken.source();
        this.setState({
            searchLoading: true,
            error: false,
            dupeGroups: [],
            sort: sortBy
        });
        axios.get('/api/filedata/duplicates', {
            params: {
                sources: Array.from(this.state.include),
                allow_different_names: this.state.allowDifferentNames,
                limit: 10,
                sort: sortBy
            },
            cancelToken: this.cancelToken.token
        }).then(this.onSearchLoad)
        .catch(this.onSearchError);
    }

    onResort(sortBy) {
        if (this.state.moreResults) {
            this.getDuplicates(sortBy);
        } else {
            this.setState({
                sort: sortBy
            });
        }
    }

    handleChange(event) {
        if (event.target.type === 'checkbox') {
            this.state.allowDifferentNames = event.target.checked;
        }
        this.getDuplicates();
    }

    handleScroll(event) {
        let hitBottom = event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;
        if (hitBottom && !this.state.searchLoading && this.state.moreResults) {
            this.setState({
                searchLoading: true
            });
            axios.get('/api/filedata/duplicates', {
                params: {
                    sources: Array.from(this.state.include),
                    allow_different_names: this.state.allowDifferentNames,
                    limit: 10,
                    offset: this.state.dupeGroups.length,
                    sort: this.state.sort
                }
            }).then(this.onSearchLoad)
            .catch(this.onError);
        }
    }

    render() {
        return (
            <LoadingWrapper get="/api/filedata/sources" callback={this.onLoad}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <div className="panel fixed-height">
                                <div className="panel-header form-horizontal search-header">
                                    { this.state.sources.length > 1 &&
                                        <div className="form-group">
                                            <MultiSelect choices={this.state.sources}
                                                value={this.state.include}
                                                onChange={this.handleChange}/>
                                        </div>
                                    }
                                    <div className="form-group">
                                        <label className="form-switch">
                                            <input type="checkbox"
                                                checked={this.state.allowDifferentNames}
                                                onChange={this.handleChange}/>
                                            <i className="form-icon"></i> Include differently-named duplicates
                                        </label>
                                    </div>
                                </div>
                                <div className="panel-body" onScroll={this.handleScroll}>
                                    <DuplicateTable dupeGroups={this.state.dupeGroups}
                                        searchOnSort={this.state.moreResults}
                                        onResort={this.onResort}
                                        sort={this.state.sort}/>
                                    {this.state.searchLoading && 
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

DuplicatesTab.contextType = SourceContext;