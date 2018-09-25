import React from 'react';
import axios from 'axios';
import { FileTableRow } from './fileTableRow';

export class FileTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            files: [],
            filesLoading: true,
            searchTerms: ''
        }

        this.filterTable = this.filterTable.bind(this);
        this.searchTermsChanged = this.searchTermsChanged.bind(this);
        this.rowClicked = this.rowClicked.bind(this);
        this.apiResponse = this.apiResponse.bind(this);

        axios.get('/api/files/top')
        .then(this.apiResponse)
        .catch(function(error) {
            console.log(error);
        });
    }

    apiResponse(response) {
        this.setState({
            files: response.data,
            filesLoading: false,
            searchTerms: this.state.searchTerms
        });
    }

    searchTermsChanged(event) {
        this.setState({
            files: this.state.files,
            filesLoading: this.state.filesLoading,
            searchTerms: event.target.value
        });
    }

    filterTable() {
        this.setState({
            files: [],
            filesLoading: true,
            searchTerms: this.state.searchTerms
        });

        axios.post('/api/files/search', {
            name: this.state.searchTerms
        }).then(this.apiResponse)
        .catch(function(error) {
            console.log(error);
        });
    }

    rowClicked(component) {
        console.log(component);
    }

    render() {
        return (
            <table>
                <thead>
                    <tr>
                        <th>
                            <input type="text" onChange={this.searchTermsChanged}></input>
                        </th>
                        <th>
                            <button onClick={this.filterTable}>Search</button>
                        </th>
                    </tr>
                    <tr>
                        <th>Name</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.files.map(file => {
                        return <FileTableRow file={file} key={file.id} onRowClick={this.rowClicked} depth={0}/>
                    })}
                </tbody>
            </table>
        );
    }
}