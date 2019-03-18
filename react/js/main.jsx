import axios from 'axios';
import ReactDOM from 'react-dom';
import React from 'react';

import { ImportWrapper } from './importWrapper';

axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
axios.defaults.xsrfCookieName = "csrftoken";

ReactDOM.render(<ImportWrapper />, document.getElementById('app'));