import React from 'react';
import { Paginator } from './paginator';
import { TypeChart } from './typeChart';
import { Size } from '../util';

const PIE_COLORS = [
    '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', 
];
const HOVER_COLOR = '#7e7ddb'

export class TypePanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            page: 0,
            types: [],
            loading: true,
            error: false,
            colors: Array.from(PIE_COLORS)
        };
        
        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
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

    onMouseEnter(index) {
        if (this.state.page === 0) {
            this.state.colors[index] = HOVER_COLOR
        } else {
            this.state.colors[5] = HOVER_COLOR;
        }
        this.setState({})
    }

    onMouseLeave(index) {
        if (this.state.page === 0) {
            this.state.colors[index] = PIE_COLORS[index];
        } else {
            this.state.colors[5] = PIE_COLORS[5];
        }
        this.setState({})
    }

    render() {
        let typeList;
        if (this.state.error) {
            typeList = <div>An error occurred.</div>
        } else if (this.state.loading) {
            typeList = <div className="loading"></div>
        } else {
            typeList = <TypeTable types={this.state.types}
                colors={this.state.colors}
                page={this.state.page}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}/>;
        }

        return (
            <div className="card fixed-height">
                <div className="card-header">
                    <div className="card-title h5">File Type Breakdown</div>
                </div>
                <div className="visualization">
                    <TypeChart id="typeChart" data={this.props.source.type_chart_data} colors={this.state.colors}/>
                </div>
                <div className="card-body">
                    {typeList}
                </div>
                <div className="card-footer">
                    <Paginator
                        get="/api/filedata/types"
                        pageSize={5}
                        params={{ source: this.props.source.id }}
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
                    return (
                        <TypeRow key={type.id}
                            index={index}
                            type={type}
                            color={(props.page > 0) ? props.colors[5] : props.colors[index]}
                            onMouseEnter={props.onMouseEnter}
                            onMouseLeave={props.onMouseLeave}
                        />
                    );
                })}
            </tbody>
        </table>
    );
}

export class TypeRow extends React.Component {
    constructor(props) {
        super(props);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
    }

    handleMouseEnter(event) { this.props.onMouseEnter(this.props.index); }
    handleMouseLeave(event) { this.props.onMouseLeave(this.props.index); }

    render() {
        return (
            <tr onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
                <td className="name-cell">
                    <svg width="20" height="10">
                        <rect width="10" height="10" style={{'fill': this.props.color}}></rect>
                    </svg>
                    {this.props.type.extension || '(no extension)'}
                </td>
                <td className="size-cell">
                    <Size bytes={this.props.type.total_size}/>
                </td>
            </tr>
        );
    }
}