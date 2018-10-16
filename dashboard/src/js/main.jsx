import { TabNav } from './tabNav';
import { BrowseTab } from './browseTab';
import { SummaryTab } from './summaryTab';
import { UpdateTab } from './updateTab';
import React from 'react';
import ReactDOM from 'react-dom';

let tabs = [
    {
        name: 'Summary',
        content: <SummaryTab />
    },
    {
        name: 'Browse Files',
        content: <BrowseTab />
    },
    {
        name: 'Update Files',
        content: <UpdateTab />
    }
];

ReactDOM.render(<TabNav tabs={tabs} />, document.getElementById('main'));