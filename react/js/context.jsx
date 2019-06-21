import React from 'react';

// current search form data
export const SearchContext = React.createContext({
    state: null
});

// list of file sources being viewed
export const SourceContext = React.createContext({
    include: null
});

// previous task, and task trigger callback function
export const TaskContext = React.createContext({
    lastTask: null,
    taskStarted: null
});

// previous import form data
export const ImportContext = React.createContext({
    lastAttempt: null
});