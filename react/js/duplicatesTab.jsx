import React from 'react';
import { DuplicateTable } from './duplicateTable';


export class DuplicatesTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            dupeGroups: [],
            moreResults: false,
            loading: true,
            error: false,
            params: {}
        };

        this.searchForm = React.createRef();
        
        this.searchFiles = this.searchFiles.bind(this);
        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onSearchError.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
    }

    onLoad(response) {
        this.setState({
            dupeGroups: this.state.dupeGroups.concat(response.data),
            loading: false,
            moreResults: response.data.length >= 100
        });
    }

    onError(error) {
        this.setState({
            dupeGroups: [],
            error: true,
            loading: false,
            moreResults: false
        });
    }

    getDupeGroups(params) {
        this.setState({
            loading: true,
            error: false,
            dupeGroups: [],
            moreResults: false
        });
        axios.get('/api/files/dupegroups', {
            params: params
        }).then(this.onLoad)
        .catch(this.onError);
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
            <React.Fragment>
                { this.context.directory.duplicate_count > 0 ?
                    <div className="container">
                        <div className="columns">
                            <div className="column col-9 col-mx-auto">
                                <div className="panel fixed-height">
                                    <div className="panel-header search-header form-horizontal">
                                        <DuplicatesForm state={null} submit={this.getDupeGroups}/>
                                    </div>
                                    <div className="panel-body" onScroll={this.handleScroll}>
                                        <React.Fragment>
                                            <DuplicateTable dupeGroups={this.state.dupeGroups}
                                                searchOnSort={this.state.moreResults}
                                                searchCallback={this.searchFiles}
                                                searchParams={this.state.searchParams}/>
                                            {this.state.loading && 
                                                <div className="loading loading-lg"></div>
                                            }
                                        </React.Fragment>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> : 
                    <div className="empty">
                        <p className="empty-subtitle">You have no duplicate files!</p>
                    </div>
                }
            </React.Fragment>
        );
    }
}