import React from 'react';
import { LoadingBox } from './loadingBox';
import { PaginatedPanel } from './paginatedPanel';
import { DuplicateTable } from './duplicateTable';

export class DuplicatesTab extends React.Component {

    constructor(props) {
        super(props);
        
        this.state = {
            summary: {}
        };

        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            summary: response.data
        });
    }

    render() {
        return (
            <LoadingBox get="/api/files/summary" callback={this.onLoad} checkForUpdate={true}>
                { this.state.summary.duplicate_count > 0 ?
                    <div className="container">
                        <div className="columns">
                            <div className="column col-9 col-mx-auto">
                                <PaginatedPanel title="Most Duplicated Files" get="/api/files/mostduped" component={DuplicateTable}/>
                            </div>
                        </div>
                        <div className="columns">
                            <div className="column col-9 col-mx-auto">
                                <PaginatedPanel title="Largest Duplicate Files" get="/api/files/biggestdupes" component={DuplicateTable}/>
                            </div>
                        </div>
                    </div> : 
                    <div className="empty">
                        <p className="empty-subtitle">You have no duplicate files!</p>
                    </div>
                }
            </LoadingBox>
        );
    }
}