import React from 'react';
import d3 from 'd3';

export class FileVisualizer extends React.Component {
    render() {
        if (this.props.file) {
            return (
                <div>
                    <div class="container">
                        <div class="row">
                            {this.props.file.name}
                        </div>
                        <div class="row">
                            {this.props.file.size} bytes
                        </div>
                    </div>
                    <svg id="d3-visualization">
                    </svg>
                </div>
            );
        } else {
            
            return (
                <div>(No file or folder selected)</div>
            )
        }
    }
}