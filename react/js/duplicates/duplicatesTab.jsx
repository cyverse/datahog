import React from 'react';
import axios from '../axios';

import { DuplicateTable } from './duplicateTable';
import { LoadingWrapper } from '../loadingWrapper';
import { MultiSelect } from '../util';

export class DuplicatesTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sources: [],
            include: new Set(),
            allowDifferentNames: true,
            dupeGroups: [],
            searchLoading: false
        };

        this.cancelToken = null;
        this.onLoad = this.onLoad.bind(this);
        this.onSearchLoad = this.onSearchLoad.bind(this);
        this.onSearchError = this.onSearchError.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getDuplicates = this.getDuplicates.bind(this);
    }

    onLoad(response) {
        let include = new Set();
        for (let source of response.data) {
            include.add(source.id);
        }
        this.setState({
            sources: response.data,
            include: include
        });
        this.getDuplicates();
    }

    onSearchLoad(response) {
        let files = response.data;
        let dupeGroups = [];
        if (files.length) {
            let currentChecksum = files[0].checksum;
            let currentDupeGroup = [];
            for (let file of response.data) {
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
        this.setState({
            dupeGroups: dupeGroups,
            searchLoading: false
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

    getDuplicates() {
        if (this.cancelToken) this.cancelToken.cancel();
        this.cancelToken = axios.CancelToken.source();
        this.setState({
            searchLoading: true,
            error: false,
            dupeGroups: []
        });
        axios.get('/api/files/duplicates', {
            params: {
                sources: Array.from(this.state.include),
                allow_different_names: this.state.allowDifferentNames
            },
            cancelToken: this.cancelToken.token
        }).then(this.onSearchLoad)
        .catch(this.onSearchError);
    }

    handleChange(event) {
        if (event.target.type === 'checkbox') {
            this.state.allowDifferentNames = event.target.checked;
        }
        this.getDuplicates();
    }

    render() {
        return (
            <LoadingWrapper get="/api/filedata/sources" callback={this.onLoad}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <div className="panel fixed-height">
                                <div className="panel-header form-horizontal search-header">
                                    <div className="form-group">
                                        <MultiSelect choices={this.state.sources}
                                            value={this.state.include}
                                            onChange={this.handleChange}/>
                                    </div>
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
                                    <DuplicateTable dupeGroups={this.state.dupeGroups}/>
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
