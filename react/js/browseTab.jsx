import React from 'react';
import axios from 'axios';

import { FileTree } from './fileTree'
import { LoadingBox } from './loadingBox';
import { SelectButton } from './util';

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

export class SearchForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchText: '',
            searchType: 'text',
            filters: []
        }

        this.searchBar = React.createRef();

        this.submitSearch = this.submitSearch.bind(this);
        this.changeSearchType = this.changeSearchType.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
    }

    submitSearch(event) {
        let params = {
            name: this.searchBar.current.value,
            type: this.state.searchType
        };
        for (let filter of this.state.filters) {
            let value = filter.value;
            if (filter.field === 'larger_than' || filter.field === 'smaller_than') {
                if      (filter.unit === 'kB') value *= 1000;
                else if (filter.unit === 'MB') value *= 1000000;
                else if (filter.unit === 'GB') value *= 1000000000;
                else if (filter.unit === 'TB') value *= 1000000000000;
            }
            params[filter.field] = value;
        }
        this.props.submit(params);
    }

    changeSearchType(type) {
        this.setState({
            searchType: type
        });
    }

    addFilter(event) {
        this.state.filters.push({
            field: 'created_after',
            value: '',
            unit: 'kB'
        });
        this.setState(this.state);
    }

    removeFilter() {
        this.state.filters.pop();
        this.setState(this.state);
    }

    render() {
        return (
            <form className="form-horizontal" onSubmit={this.submitForm}  onMouseLeave={this.hideFilters}>
                <div className="form-group">
                    <div className="has-btn-right col-11">
                        <input type="text" className="form-input" ref={this.searchBar} placeholder="Search files..." />
                        <span className="form-btn">
                            <SelectButton
                                target={this.state.searchType} 
                                value='text'
                                onClick={this.changeSearchType}>
                                    Text
                            </SelectButton>
                            <SelectButton
                                target={this.state.searchType}
                                value='regex'
                                onClick={this.changeSearchType}>
                                    Regex
                            </SelectButton>
                        </span>
                    </div>
                    <button className="btn btn-primary input-group-btn col-1" onClick={this.submitSearch}>
                        Go
                    </button>
                </div>
                {this.state.filters.map(filter =>
                    <FilterForm key={filter.field} filter={filter}/>
                )}
                <div className="form-group">
                    <button className="btn btn-sm btn-link" onClick={this.addFilter}>
                        <i className="fa fa-plus"></i> Add Filter
                    </button>
                    {this.state.filters.length > 0 && 
                        <button className="btn btn-sm btn-link" onClick={this.removeFilter}>
                            <i className="fa fa-minus"></i> Remove Filter
                        </button>
                    }
                </div>
            </form>
        );
    }
}

export class FilterForm extends React.Component {
    constructor(props) {
        super(props);
        this.changeField = this.changeField.bind(this);
        this.changeValue = this.changeValue.bind(this);
        this.changeUnit = this.changeUnit.bind(this);
        this.state = {};
    }

    changeField(event) {
        this.props.filter.field = event.target.value;
        this.setState({});
    }

    changeValue(event) {
        this.props.filter.value = event.target.value;
        this.setState({});
    }

    changeUnit(unit) {
        this.props.filter.unit = unit;
        this.setState({});
    }

    render() {
        return (
            <div className="form-group">
                <select value={this.props.filter.field} className="form-select col-3" onChange={this.changeField}>
                    <option value="created_after">Created after</option>
                    <option value="created_before">Created before</option>
                    <option value="larger_than">Larger than</option>
                    <option value="smaller_than">Smaller than</option>
                </select>
                <span className="col-1"></span>
                {(this.props.filter.field === 'created_before' || this.props.filter.field === 'created_after') && (
                    <input type="date" 
                        value={this.props.filter.value}
                        className="form-input col-3"
                        onChange={this.changeValue}
                    />
                )}
                {(this.props.filter.field === 'larger_than' || this.props.filter.field === 'smaller_than') && (
                    <div className="has-btn-right col-4">
                        <input type="text" className="form-input" placeholder="Size" onChange={this.changeValue}/>
                        <span className="form-btn">
                            <SelectButton
                                target={this.props.filter.unit}
                                value='kB'
                                onClick={this.changeUnit}>
                                    kB
                            </SelectButton>
                            <SelectButton
                                target={this.props.filter.unit}
                                value='MB'
                                onClick={this.changeUnit}>
                                    MB
                            </SelectButton>
                            <SelectButton
                                target={this.props.filter.unit}
                                value='GB'
                                onClick={this.changeUnit}>
                                    GB
                            </SelectButton>
                            <SelectButton
                                target={this.props.filter.unit}
                                value='TB'
                                onClick={this.changeUnit}>
                                    TB
                            </SelectButton>
                        </span>
                    </div>
                )}
            </div>
        )
    }
}