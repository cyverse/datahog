import React from 'react';

export const SearchContext = React.createContext({
    state: null
});

export const ImportContext = React.createContext({
    lastAttempt: null,
    updateTriggered: null
});