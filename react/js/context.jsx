import React from 'react';

export const SearchContext = React.createContext({
    state: null
});

export const TaskContext = React.createContext({
    lastTask: null,
    taskStarted: null
});

export const ImportContext = React.createContext({
    lastAttempt: null
});