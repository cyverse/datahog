import React from 'react';

export class Size extends React.Component {
    render() {
        let bytes = this.props.bytes;
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
        return <span>{formattedSize}</span>
    }
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
        if (this.props.text.length > 15) {
            snippedText = this.props.text.substring(0, 14) + '…';
        } else {
            snippedText = this.props.text;
        }
        return (
            <button className="btn btn-link tooltip" data-tooltip={this.state.toolTipText} onMouseEnter={this.resetText} onClick={this.copyText}>{snippedText}</button>
        )
    }
}