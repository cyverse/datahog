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