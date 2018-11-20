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

    copyText() {
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
        let snippedText;
        if (this.props.text.length > 20) {
            snippedText = this.props.text.substring(0, 19) + '…';
        } else {
            snippedText = this.props.text;
        }
        return (
            <a className="btn btn-link tooltip click-to-copy" data-tooltip={this.state.toolTipText} onMouseEnter={this.resetText} onClick={this.copyText}>{snippedText}</a>
        );
    }
}

export function LabeledInput(props) {
    let labelPos = props.value.length > 0 ? 0 : 20;
    return (
        <React.Fragment>
            <label htmlFor={props.name} className="form-input-hint" style={{top: labelPos}}>{props.label}</label>
            <input type={props.type || 'text'} className="form-input" name={props.name} placeholder={props.label} value={props.value} onChange={props.onChange}/>
        </React.Fragment>
    );
}