import React from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';
import { TabNav } from './tabNav';
import { BrowseTab } from './browseTab';
import { SummaryTab } from './summaryTab';
import { UpdateTabWithContext } from './updateTab';

let tabs = [
    {
        name: 'Summary',
        path: '/summary',
        component: SummaryTab
    },
    {
        name: 'Browse Files',
        path: '/browse',
        component: BrowseTab
    },
    {
        name: 'Import File Data',
        path: '/import',
        component: UpdateTabWithContext
    }
];

axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
axios.defaults.xsrfCookieName = "csrftoken";

ReactDOM.render(<TabNav tabs={tabs} />, document.getElementById('main'));