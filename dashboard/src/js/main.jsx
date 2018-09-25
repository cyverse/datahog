import { FileTable } from './fileTable';
import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

axios.get('/api/files/top')
.then(function(response) {
    ReactDOM.render(<FileTable files={response.data}/>, document.getElementById('fileTable'))
})
.catch(function(error) {
    console.log(error);
});