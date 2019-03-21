import React from 'react';
import { HashRouter, Route, Switch, NavLink } from 'react-router-dom';
import { SummaryTab } from './summaryTab';
import { DuplicatesTab } from './duplicatesTab';
import { BrowseTab } from './browseTab';
import { UpdateTab } from './updateTab';

export const SearchContext = React.createContext({});

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
                            <NavLink to='/duplicates'>Duplicated Files</NavLink>
                        </li>
                        <li className='tab-item c-hand'>
                            <NavLink to='/browse'>Browse Files</NavLink>
                        </li>
                        <li className='tab-item c-hand'>
                            <NavLink to='/import'>Import File Data</NavLink>
                        </li>
                    </ul>
                    <Switch>
                        <Route path='/summary' component={SummaryTab} />
                        <Route path='/duplicates' component={DuplicatesTab} />
                        <Route path='/browse' component={BrowseTab} />
                        <Route path='/import' component={UpdateTab} />
                    </Switch>
                </React.Fragment>
            </HashRouter>
        );
    }
}