import React from 'react';
import { HashRouter, Route, Switch, NavLink } from 'react-router-dom';
import { SummaryTab } from './summary/summaryTab';
import { DuplicatesTab } from './duplicates/duplicatesTab';
import { BrowseTab } from './browse/browseTab';
import { SourceTab } from './sources/sourceTab';
import { ImportForm } from './sources/importForm';

/**
 * A navigation menu for the app's 4 main pages.
 */
export class TabNav extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <HashRouter>
                <React.Fragment>
                    <ul className='tab tab-block'>
                        <li className='tab-item c-hand'>
                            <NavLink to='/summary'>Summary</NavLink>
                        </li>
                        <li className='tab-item c-hand'>
                            <NavLink to='/browse'>Browse Files</NavLink>
                        </li>
                        <li className='tab-item c-hand'>
                            <NavLink to='/duplicates'>Duplicated Files</NavLink>
                        </li>
                        <li className='tab-item c-hand'>
                            <NavLink to='/sources'>Manage File Sources</NavLink>
                        </li>
                    </ul>
                    <Switch>
                        <Route path='/summary' component={SummaryTab} />
                        <Route path='/browse' component={BrowseTab} />
                        <Route path='/duplicates' component={DuplicatesTab} />
                        <Route path='/sources' component={SourceTab} />
                        <Route path='/import' component={ImportForm} />
                    </Switch>
                </React.Fragment>
            </HashRouter>
        );
    }
}