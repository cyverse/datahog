import React from 'react';
import { Paginator } from './paginator';
import { TypeChart } from './typeChart';
import { Size } from '../util';

const PIE_COLORS = [
    "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45"
];

export class TypePanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            page: 0,
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

    onLoad(types, page) {
        this.setState({
            page: page,
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
            typeList = <TypeTable types={this.state.types} colors={PIE_COLORS} page={this.state.page}/>
        }

        return (
            <div className="card fixed-height">
                <div className="card-header">
                    <div className="card-title h5">Top File Types</div>
                </div>
                <div className="visualization">
                    <TypeChart id="typeChart" data={this.props.data} colors={PIE_COLORS}/>
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
                {props.types.map((type, index) => {
                    return <TypeRow type={type} key={type.id} color={props.page > 0 ? props.colors[5] : props.colors[index]}/>
                })}
            </tbody>
        </table>
    );
}

export function TypeRow(props) {
    return (
        <tr>
            <td className="name-cell">
                <svg width="20" height="10">
                    <rect width="10" height="10" style={{'fill': props.color}}></rect>
                </svg>
                {props.type.extension || '(no extension)'}
            </td>
            <td className="size-cell">
                <Size bytes={props.type.total_size}/>
            </td>
        </tr>
    );
}