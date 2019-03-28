import React from 'react';
import { PaginatedPanel } from './paginatedPanel';
import { DuplicateTable } from './duplicateTable';
import { DirectoryContext } from './context';

export class DuplicatesTab extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                { this.context.directory.duplicate_count > 0 ?
                    <div className="container">
                        <div className="columns">
                            <div className="column col-9 col-mx-auto">
                                <PaginatedPanel scroll={true} title="Most Duplicated Files" get="/api/files/mostduped" component={DuplicateTable}/>
                            </div>
                        </div>
                        <div className="columns">
                            <div className="column col-9 col-mx-auto">
                                <PaginatedPanel scroll={true} title="Largest Duplicate Files" get="/api/files/biggestdupes" component={DuplicateTable}/>
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

DuplicatesTab.contextType = DirectoryContext;