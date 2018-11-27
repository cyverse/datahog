import React from 'react';
import { HashRouter, Route, Switch, NavLink, Redirect } from 'react-router-dom';
import { UpdateBox } from './updateBox';

export function TabNav(props) {
    return (
        <HashRouter>
            <UpdateBox>
                <React.Fragment>
                    <ul className='tab tab-block'>
                        {props.tabs.map((tab, index) => {
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
                        {props.tabs.map((tab, index) => {
                            return <Route key={index}  path={tab.path} component={tab.component} />;
                        })}
                        <Redirect to="/import" />
                    </Switch>
                </React.Fragment>
            </UpdateBox>
        </HashRouter>
    );
}