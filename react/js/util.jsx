import React from 'react';

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
            <a className="btn btn-link tooltip click-to-copy"
                data-tooltip={this.state.toolTipText}
                onMouseEnter={this.resetText}
                onClick={this.copyText}>
                {this.props.children}
            </a>
        );
    }
}

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