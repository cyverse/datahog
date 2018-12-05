import React from 'react';
import axios from 'axios';
import { Size, ClickToCopy } from './util';

export class PaginatedFileTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            loading: true,
            error: false,
            prev: null,
            next: null,
            page: 0
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.prevPage = this.prevPage.bind(this);
        this.nextPage = this.nextPage.bind(this);

        axios.get(this.props.get + '?limit=10')
        .then(this.onLoad)
        .catch(this.onError);
    }

    onLoad(response) {
        this.setState({
            files: response.data.results,
            loading: false,
            error: false,
            prev: response.data.previous,
            next: response.data.next
        });
    }

    onError(error) {
        this.setState({
            files: [],
            loading: false,
            error: true,
            prev: null,
            next: null
        });
    }

    nextPage() {
        this.setState({
            loading: true,
            page: this.state.page + 1
        });
        axios.get(this.state.next)
        .then(this.onLoad)
        .catch(this.onError);
    }

    prevPage() {
        this.setState({
            loading: true,
            page: this.state.page - 1
        });
        axios.get(this.state.prev)
        .then(this.onLoad)
        .catch(this.onError);
    }

    render() {
        let cardBody;
        if (this.state.error) {
            cardBody = <div>An error occurred.</div>
        } else if (this.state.loading) {
            cardBody = <div className="loading"></div>
        } else {
            cardBody = <FileTable files={this.state.files}/>
        }
        
        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-title h5">{this.props.title}</div>
                </div>
                <div className="card-body">
                    {cardBody}
                </div>
                <div className="card-footer">
                    <div className="float-left text-gray">
                        {!this.state.loading && (this.state.page*10 + 1) + '-' + (this.state.page*10 + this.state.files.length)}
                    </div>
                    <div className="btn-group float-right">
                        <button className="btn btn-action btn-sm" onClick={this.prevPage} disabled={this.state.loading || !this.state.prev}><i className="fa fa-caret-left"></i></button>
                        <button className="btn btn-action btn-sm" onClick={this.nextPage} disabled={this.state.loading || !this.state.next}><i className="fa fa-caret-right"></i></button>
                    </div>
                </div>
            </div>
        );
    }
}

export function FileTable(props) {
    return (
        <table className='table file-table table-hover'>
            <tbody>
                {props.files.map(file => {
                    return <FileRow 
                            file={file} 
                            key={file.id} />
                })}
            </tbody>
        </table>
    );
}

export function FileRow(props) {
    return (
        <tr>
            <td className="name-cell" style={props.depth ? {paddingLeft: 30*props.depth} : null}>
                {props.file.name || props.file.extension}
            </td>
            { props.file.path && 
                <td className="options-cell">
                    <ClickToCopy text={props.file.path}>Copy path</ClickToCopy>
                </td>
            }
            <td className="size-cell">
                <Size bytes={props.file.size || props.file.total_size}/>
            </td>
        </tr>
    );
}

