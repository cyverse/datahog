import React from 'react';

/**
 * Converts size in bytes to a concise, readable format.
 */
export function Size(props) {
    let bytes = props.bytes;
    let coefficient, units;
    if (bytes < 1000) {
        coefficient = bytes;
        units = 'B';
    } else if (bytes < 1000000) {
        coefficient = bytes/1000;
        units = 'kB';
    } else if (bytes < 1000000000) {
        coefficient = bytes/1000000;
        units = 'MB';
    } else if (bytes < 1000000000000) {
        coefficient = bytes/1000000000;
        units = 'GB';
    } else {
        coefficient = bytes/1000000000000;
        units = 'TB';
    }
    let formattedSize = Math.round(coefficient*100)/100 + ' ' + units;
    return <span>{formattedSize}</span>;
}

/**
 * Copies a specific piece of text data to the clipboard when clicked.
 */
export class ClickToCopy extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            toolTipText: this.props.text
        }

        this.copyText = this.copyText.bind(this);
        this.resetText = this.resetText.bind(this);
    }

    copyText(event) {
        event.stopPropagation();
        navigator.clipboard.writeText(this.props.text).then(function() {
            this.setState({
                toolTipText: 'Copied to clipboard!'
            });
        }.bind(this), function() {
            this.setState({
                toolTipText: 'Could not copy text to clipboard.'
            });
        }.bind(this));
    }

    resetText() {
        this.setState({
            toolTipText: this.props.text
        });
    }

    render() {
        return (
            <a className="btn btn-link tooltip table-option"
                data-tooltip={this.state.toolTipText}
                onMouseEnter={this.resetText}
                onClick={this.copyText}>
                {this.props.children}
            </a>
        );
    }
}

/**
 * A form input with a flexible label.
 */
export function LabeledInput(props) {
    let labelPos = props.value.length > 0 ? 0 : 20;
    return (
        <React.Fragment>
            <label htmlFor={props.name} 
                className="form-input-hint" 
                style={{top: labelPos}}>
                    {props.label}
            </label>
            <input type={props.type || 'text'}
                className="form-input"
                name={props.name}
                placeholder={props.label}
                value={props.value}
                onChange={props.onChange}
            />
        </React.Fragment>
    );
}

/**
 * A selectable button within a text input.
 */
export class SelectButton extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        this.props.onClick(this.props.value);
    }

    render() {
        return (
            <button onClick={this.handleClick}
                className={this.props.target === this.props.value ? 'btn btn-sm' : 'btn btn-sm btn-link'}>
                {this.props.children}
            </button>
        )
    }
}

/**
 * Converts a long path into a short one.
 */
export function trimPath(path, max) {
    if (!path) path = '';
    if (!max)  max = 30;
    
    if (path.length <= max) {
        return path;
    } else {
        let sub = path.substring(path.length-max+1);
        let slashPos = sub.indexOf('/');
        if (slashPos === -1) return '…' + sub;
        else                 return '…' + sub.substring(slashPos);
    }
}

/**
 * The header for a sortable table column.
 */
export function SortHeader(props) {
    let sortDirection;
    if (props.currentSort === props.sortBy) {
        sortDirection = 1;
    } else if (props.currentSort === '-' + props.sortBy) {
        sortDirection = -1;
    } else {
        sortDirection = 0;
    }
    return (
        <th className={props.className}>
            <a className='btn btn-link'
                onClick={props.onClick}
                data-sort={sortDirection > 0 ? '-' + props.sortBy : props.sortBy}>
                {props.title} &nbsp;
                {sortDirection > 0 && <i className='fa fa-caret-up'></i>}
                {sortDirection < 0 && <i className='fa fa-caret-down'></i>}
            </a>
        </th>
    );
}

/**
 * A set of options that can be toggled in any combination.
 */
export class MultiSelect extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        let id = event.target.dataset.id;
        if (this.props.value.has(id)) {
            this.props.value.delete(id);
        } else {
            this.props.value.add(id);
        }
        this.props.onChange(event);
    }

    render() {
        return (
            <div className="multi-select">
                Include files from: &nbsp;
                {this.props.choices.map((choice, index) => {
                    let css = this.props.value.has(choice.id) ? 'chip active c-hand' : 'chip c-hand';
                    return (
                        <div className={css} data-id={choice.id} key={choice.id} onClick={this.handleClick}>
                            {choice.name}
                        </div>
                    );
                })}
            </div>
        )
    }
}