import React from 'react';
import { HashRouter, Route, Switch, NavLink } from 'react-router-dom';
import { UpdateBox } from './updateBox';

export const SearchContext = React.createContext({});

export class TabNav extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <SearchContext.Provider value={{}}>
                <HashRouter>
                    <UpdateBox>
                        <React.Fragment>
                            <ul className='tab tab-block'>
                                {this.props.tabs.map((tab, index) => {
                                    return (
                                        <li key={index} className='tab-item c-hand'>
                                            <NavLink to={tab.path}>
                                                {tab.name}
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                            <Switch>
                                {this.props.tabs.map((tab, index) => {
                                    return <Route key={index}  path={tab.path} component={tab.component} />;
                                })}
                            </Switch>
                        </React.Fragment>
                    </UpdateBox>
                </HashRouter>
            </SearchContext.Provider>
        );
    }
}