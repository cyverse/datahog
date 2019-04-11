import React from 'react';
import axios from 'axios';
import { DuplicateTable } from './duplicateTable';
import { LoadingWrapper } from '../loadingWrapper';

export class DuplicatesTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sources: [],
            include: new Set(),
            dupeGroups: [],
            searchLoading: true,
            moreResults: false
        };

        this.onLoad = this.onLoad.bind(this);
        this.onSearchLoad = this.onSearchLoad.bind(this);
        this.onSearchError = this.onSearchError.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.getDuplicates = this.getDuplicates.bind(this);
    }

    onLoad(response) {
        let include = new Set();
        for (let source of response.data) {
            include.add(source.id);
        }
        this.setState({
            sources: response.data,
            searchLoading: true,
            include: include
        });
        axios.get('/api/files/duplicates')
        .then(this.onSearchLoad)
        .catch(this.onSearcherror);
    }

    onSearchLoad(response) {
        let files = response.data;
        let dupeGroups = [];
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
        this.setState({
            dupeGroups: dupeGroups,
            loading: false,
            moreResults: response.data.length >= 100
        });
    }

    onSearchError(error) {
        this.setState({
            dupeGroups: [],
            error: true,
            loading: false,
            moreResults: false
        });
    }

    getDuplicates(params) {
        this.setState({
            loading: true,
            error: false,
            dupeGroups: [],
            moreResults: false
        });
        axios.get('/api/files/duplicates', {
            params: params
        }).then(this.onSearchLoad)
        .catch(this.onSearchError);
    }

    handleScroll(event) {
        let hitBottom = event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;
        if (hitBottom && !this.state.loading && this.state.moreResults) {
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
            <LoadingWrapper get="/api/files/directories" callback={this.onLoad}>
                <div className="container">
                    <div className="columns">
                        <div className="column col-9 col-mx-auto">
                            <div className="panel fixed-height">
                                <div className="panel-body" onScroll={this.handleScroll}>
                                    <React.Fragment>
                                        <MultiSelect choices={this.state.sources}
                                            value={this.state.include}
                                            onChange={this.getDuplicates}/>
                                        <DuplicateTable dupeGroups={this.state.dupeGroups}/>
                                        {this.state.loading && 
                                            <div className="loading loading-lg"></div>
                                        }
                                    </React.Fragment>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LoadingWrapper>
        );
    }
}

export class MultiSelect extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        let id = event.target.dataset.id;
        if (this.props.value.has(id)) {
            this.props.value.delete(id);
        } else {
            this.props.value.add(id);
        }
        this.props.onChange(this.props.value);
    }

    render() {
        return (
            <div>
                Include files from: 
                {this.props.choices.map((choice, index) => {
                    let css = this.props.value.has(choice.id) ? 'chip active c-hand' : 'chip c-hand';
                    return (
                        <div className={css} data-id={choice.id} key={choice.id} onClick={this.handleClick}>
                            {choice.name}
                        </div>
                    );
                })}
            </div>
        )
    }
}