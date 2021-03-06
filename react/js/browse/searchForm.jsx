import React from 'react';
import { SelectButton } from '../util';
import { SearchContext } from '../context';

/**
 * A form to create a search payload for the BrowseTab.
 * Uses SearchContext to save its state between mounts.
 */
export class SearchForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchType: 'text',
            searchText: '',
            filters: []
        };

        this.submitSearch = this.submitSearch.bind(this);
        this.changeSearchType = this.changeSearchType.bind(this);
        this.changeSearchText = this.changeSearchText.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.clearSearch = this.clearSearch.bind(this);
    }

    componentDidMount() {
        if (this.context.state) {
            this.setState(this.context.state);
        }
    }

    componentWillUnmount() {
        this.context.state = this.state;
    }

    submitSearch(event) {
        let params = {
            name: this.state.searchText,
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

    changeSearchText(event) {
        this.setState({
            searchText: event.target.value
        });
    }

    changeSearchType(type) {
        this.setState({
            searchType: type
        });
    }

    addFilter() {
        this.state.filters.push({
            field: 'created_after',
            value: '',
            unit: 'kB',
            id: Date.now()
        });
        this.setState(this.state);
    }

    removeFilter() {
        this.state.filters.pop();
        this.setState(this.state);
    }

    clearSearch() {
        this.setState({
            searchType: 'text',
            searchText: '',
            filters: []
        });
    }

    render() {
        return (
            <div className="form-horizontal">
                <div className="form-group">
                    <div className="has-btn-right col-11">
                        <input type="text" 
                            className="form-input"
                            placeholder="Search files..."
                            value={this.state.searchText}
                            onChange={this.changeSearchText}/>
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
                    <FilterForm key={filter.id} filter={filter}/>
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
            </div>
        );
    }
}

SearchForm.contextType = SearchContext;


/**
 * Form inputs to define a single search filter.
 */
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