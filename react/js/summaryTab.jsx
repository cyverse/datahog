import React from 'react';
import { FileTable } from './fileTable';
import { Size } from './util';
import { LoadingBox } from './loadingBox';

export class SummaryTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            topTenFiles: [],
            topTenFolders: [],
            topTenTypes: [],
            totals: {}
        };

        this.onLoad = this.onLoad.bind(this);
    }

    onLoad(response) {
        this.setState({
            topTenFolders: response.data.top_ten_folders,
            topTenFiles: response.data.top_ten_files,
            topTenTypes: response.data.top_ten_types,
            totals: response.data.summary
        });
    }

    render() {
        return (
            <LoadingBox get="/api/files/summary" callback={this.onLoad} checkForUpdate={true}>
                <div className="container">
                    <div className="columns">
                        <div className="column">
                            {this.state.totals &&
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title h5">You have...</div>
                                    </div>
                                    <div className="card-body">
                                        <p>
                                            <i className="fa fa-fw fa-file"></i>
                                            {this.state.totals.file_count} files
                                        </p>
                                        <p>
                                            <i className="fa fa-fw fa-folder-open"></i>
                                            {this.state.totals.folder_count} folders
                                        </p>
                                        <p>
                                            <i className="fa fa-fw fa-area-chart"></i>
                                                <Size bytes={this.state.totals.total_size}/> occupied
                                        </p>
                                    </div>
                                    <div className="card-footer">
                                        Last updated {this.state.totals.timestamp}
                                    </div>
                                </div>
                            }
                        </div>
                        <div className="column">
                            {this.state.topTenTypes &&
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title h5">Top File Types</div>
                                    </div>
                                    <div className="card-body">
                                        <table className='table file-table'>
                                            <tbody>
                                                {this.state.topTenTypes.map(type =>
                                                    <tr key={type.id}>
                                                        <td className="name-cell">
                                                            {type.extension}
                                                        </td>
                                                        <td className="size-cell">
                                                            <Size bytes={type.total_size} />
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                    <div className="columns">
                        <div className="column">
                            {this.state.topTenFiles &&
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title h5">Largest Files</div>
                                    </div>
                                    <div className="card-body">
                                        <FileTable
                                            title={'Largest Files'}
                                            files={this.state.topTenFiles}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                        <div className="column">
                            {this.state.topTenFolders &&
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title h5">Largest Folders</div>
                                    </div>
                                    <div className="card-body">
                                        <FileTable
                                            title={'Largest Folders'}
                                            files={this.state.topTenFolders}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </LoadingBox>
        );
    }
}