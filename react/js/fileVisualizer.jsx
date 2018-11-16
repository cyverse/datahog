import React from 'react';
import * as d3 from 'd3';

import { legendColor } from 'd3-svg-legend';
  

export class FileVisualizer extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidUpdate() {
        let svgWidth = 300,
            svgHeight = 500;

        let svg = d3.select('#d3-visualization')
            .attr('width', svgWidth)
            .attr('height', svgHeight)

        let pieChart = svg.append('g')
            .attr('transform', 'translate(' + svgWidth / 2 + ',' + (svgHeight / 2 - 100) + ')');

        let pieColors = d3.scaleOrdinal(d3.schemeGreens[7]);

        let pieSlices = d3.pie()
            .value(function(d) { return d.size; })
            .sort(null);

        let arcShape = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(svgWidth, svgHeight) / 2);

        let data = [
            {
                size: 421,
                type: '.csv'
            },
            {
                size: 323,
                type: '.png'
            },
            {
                size: 100,
                type: 'other'
            }
        ];

        pieChart.datum(data).selectAll('path')
            .data(pieSlices)
            .enter().append('path')
            .attr('fill', function(d, i) { return pieColors(i); })
            .attr('d', arcShape);
        
        let legendOrdinal = legendColor()
            .shape('path', d3.symbol().type(d3.symbolCircle).size(150)())
            .shapePadding(10)
            .labels(function(options) {
                return data[options.i].type;
            })
            .scale(pieColors);
        
        svg.append('g')
            .attr('class', 'legendOrdinal')
            .attr('transform', 'translate(20,300)')
            .call(legendOrdinal);
    }

    render() {
        let formattedSize = '';
        if (this.props.file) {
            let rawSize = this.props.file.size;
            if (rawSize < 1000)
                formattedSize = rawSize + ' B';
            else if (rawSize < 1000000)
                formattedSize = rawSize/1000 + ' kB';
            else if (rawSize < 1000000000)
                formattedSize = rawSize/1000000 + ' MB';
            else if (rawSize < 1000000000000)
                formattedSize = rawSize/1000000000 + ' GB';
            else if (rawSize < 1000000000000000)
                formattedSize = rawSize/1000000000000 + ' TB';
        }
        
        if (this.props.file) {
            return (
                <div>
                    <div>
                        <div className="float-left">
                            <i className={this.props.file.is_folder ? "fa fa-fw fa-folder-open-o fa-4x" : "fa fa-fw fa-file-text-o fa-4x"}></i>
                        </div>
                        <div className="file-name">
                            {this.props.file.name}
                        </div>
                        <div className="file-size">
                            {formattedSize} (1 file)
                        </div>
                    </div>
                    <div className="vis-title">
                        Example Visualization
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