import React from 'react';
import axios from 'axios';
import { FileTableRow } from './fileTableRow';
import { FileVisualizer } from './fileVisualizer';

export class FileTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            files: [],
            filesLoading: true,
            searchTerms: '',
            selectedRow: null
        }

        this.filterTable = this.filterTable.bind(this);
        this.searchTermsChanged = this.searchTermsChanged.bind(this);
        this.rowClicked = this.rowClicked.bind(this);
        this.apiResponse = this.apiResponse.bind(this);

        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
        axios.defaults.xsrfCookieName = "csrftoken";

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
            searchTerms: event.target.value,
            selectedRow: this.state.selectedRow
        });
    }

    filterTable() {
        this.setState({
            files: this.state.files,
            filesLoading: true,
            searchTerms: this.state.searchTerms,
            selectedRow: null
        });

        axios.post('/api/files/search', {
            name: this.state.searchTerms
        }).then(this.apiResponse)
        .catch(function(error) {
            console.log(error);
        });
    }

    rowClicked(component) {
        this.setState({
            files: this.state.files,
            filesLoading: false,
            searchTerms: this.state.searchTerms,
            selectedRow: component
        });
    }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="column">
                        <div className="container">
                            <div className="row">
                                <div className="column">
                                    <input type="text" onChange={this.searchTermsChanged}></input>
                                </div>
                                <div className="column">
                                    <button onClick={this.filterTable}>Search</button>
                                </div>
                            </div>
                            <div className="row">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Size</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.files.map(file => {
                                            return <FileTableRow 
                                                    file={file} 
                                                    key={file.id} 
                                                    onRowClick={this.rowClicked} 
                                                    selectedRow={this.state.selectedRow}
                                                    depth={0}/>
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="column">
                        <FileVisualizer file={this.state.selectedRow ? this.state.selectedRow.props.file : null}/>
                    </div>
                </div>
            </div>
        );
    }
}