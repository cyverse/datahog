import React from 'react';
import { Paginator } from './paginator';
import { TypeChart } from './typeChart';
import { Size } from './util';

export class TypePanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            types: [],
            loading: true,
            error: false
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        this.setState({
            loading: true
        });
    }

    onLoad(types) {
        this.setState({
            types: types,
            loading: false,
            error: false
        });
    }

    onError(error) {
        this.setState({
            types: [],
            loading: false,
            error: true
        });
    }

    render() {
        let typeList;
        if (this.state.error) {
            typeList = <div>An error occurred.</div>
        } else if (this.state.loading) {
            typeList = <div className="loading"></div>
        } else {
            typeList = <TypeTable types={this.state.types}/>
        }

        return (
            <div className="card fixed-height">
                <div className="card-header">
                    <div className="card-title h5">Top File Types</div>
                </div>
                <div className="visualization">
                    <TypeChart id="typeChart" data={this.props.data}/>
                </div>
                <div className="card-body">
                    {typeList}
                </div>
                <div className="card-footer">
                    <Paginator
                        get="/api/files/biggestfiletypes"
                        limit={5}
                        onLoad={this.onLoad}
                        onError={this.onError}
                        onClick={this.onClick}
                    />
                </div>
            </div>
        );
    }
}

export function TypeTable(props) {
    return (
        <table className='table file-table table-hover'>
            <tbody>
                {props.types.map(type => {
                    return <TypeRow type={type} key={type.id} />
                })}
            </tbody>
        </table>
    );
}

export function TypeRow(props) {
    return (
        <tr>
            <td className="name-cell">
                {props.type.extension || '(no extension)'}
            </td>
            <td className="size-cell">
                <Size bytes={props.type.total_size}/>
            </td>
        </tr>
    );
}