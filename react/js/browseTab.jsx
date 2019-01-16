import React from 'react';
import axios from 'axios';

import { FileTree } from './fileTree'
import { LoadingBox } from './loadingBox';
import { LabeledInput } from './util';

export class SearchForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            filters: [
                {
                    field: 'name',
                    value: ''
                }
            ],
            showFilters: false
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.showFilters = this.showFilters.bind(this);
        this.hideFilters = this.hideFilters.bind(this);
        this.addFilter = this.addFilter.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.submit(this.state.props);
    }

    showFilters(event) {
        this.setState({
            showFilters: true
        });
    }

    hideFilters(event) {
        this.setState({
            showFilters: false
        });
    }

    addFilter(event) {
        this.state.filters.push({
            field: 'name',
            value: ''
        });
        this.state.showFilters = false;
        this.setState(this.state);
    }

    render() {
        return (
            <form className="form-horizontal" onSubmit={this.submitForm}>
                {this.state.filters.map(filter =>
                    <FilterForm key={filter.field} filter={filter}/>
                )}
                <div className="form-group" onMouseLeave={this.hideFilters}>
                    {this.state.showFilters ?
                        <React.Fragment>
                            <button className="btn btn-link" onClick={this.addFilter}>Path</button>
                            <button className="btn btn-link" onClick={this.addFilter}>File name</button>
                            <button className="btn btn-link" onClick={this.addFilter}>Regex pattern</button>
                            <button className="btn btn-link" onClick={this.addFilter}>Created before</button>
                            <button className="btn btn-link" onClick={this.addFilter}>Created after</button>
                            <button className="btn btn-link" onClick={this.addFilter}>Larger than</button>
                            <button className="btn btn-link" onClick={this.addFilter}>Smaller than</button>
                        </React.Fragment> :
                        <React.Fragment>
                            <button className="btn btn-link" onClick={this.showFilters}><i className="fa fa-plus"></i> Add Filter</button>
                            <button className="btn btn-link" onClick={this.showFilters}><i className="fa fa-minus"></i> Remove Filter</button>
                        </React.Fragment>
                    }
                    <input type="submit" className="btn btn-primary col-ml-auto" value="Go"/>
                </div>
            </form>
        );
    }
}

export class FilterForm extends React.Component {
    constructor(props) {
        super(props);
        this.changedField = this.changedField.bind(this);
        this.changedValue = this.changedValue.bind(this);
        this.state = {};
    }

    changedField(event) {
        this.props.filter.field = event.target.value;
        this.setState({});
    }

    changedValue(event) {
        this.props.filter.value = event.target.value;
        this.setState({});
    }

    render() {
        return (
            <div className="form-group">
                <select value={this.props.filter.field} className="form-select col-3" onChange={this.changedField}>
                    <option value='path'>Path</option>
                    <option value='name'>File name</option>
                    <option value='pattern'>Regex pattern</option>
                    <option value='created_before'>Created before</option>
                    <option value='created_after'>Created after</option>
                    <option value='larger_than'>Larger than</option>
                    <option value='smaller_than'>Smaller than</option>
                </select>
                <span className="col-1"></span>
                {(this.props.filter.field === 'path' || this.props.filter.field === 'name' || this.props.filter.field === 'pattern') && (
                    <input value={this.props.filter.value} type="text" className="form-input col-8" onChange={this.changedValue}/>
                )}
                {(this.props.filter.field === 'created_before' || this.props.filter.field === 'created_after') && (
                    <input value={this.props.filter.value} type="date" className="form-input col-8" onChange={this.changedValue}/>
                )}
                {(this.props.filter.field === 'larger_than' || this.props.filter.field === 'smaller_than') && (
                    <input value={this.props.filter.value} type="number" className="form-input col-8" onChange={this.changedValue}/>
                )}
            </div>
        )
    }
}

export class BrowseTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            files: [],
            searching: false,
            searchTerms: '',
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
            searchTerms: '',
            searching: false,
            searchLoading: false,
            searchResults: []
        });
        this.searchBar.current.value = '';
    }

    searchFiles(filters) {
        // this.setState({
        //     searchTerms: this.searchBar.current.value,
        //     searching: true,
        //     searchLoading: true,
        // });
        // axios.post('/api/files/search', {
        //     name: this.searchBar.current.value
        // })
        // .then(function(response) {
        //     this.setState({
        //         searchLoading: false,
        //         searchResults: response.data
        //     });
        // }.bind(this))
        // .catch(function(error) {
        //     this.setState({
        //         searchLoading: false,
        //         searchResults: []
        //     });
        // }.bind(this));
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
                                                    <div className="toast toast-primary">
                                                        Found {this.state.files.length} results.
                                                        <a className="float-right c-hand" onClick={this.clearSearch}>Clear search</a>
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