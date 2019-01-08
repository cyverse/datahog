import React from 'react';
import * as d3 from 'd3';

export class TypeChart extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidUpdate() {
        let data;
        if (this.props.data) {
            data = JSON.parse(this.props.data);
            console.log(data);
        } else {
            return;
        }

        let svgWidth = 450, svgHeight = 200;

        let svg = d3.select('#' + this.props.id + '>svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight)

        let pieChart = svg.append('g')
            .attr('transform', 'translate(' + svgWidth / 2 + ',' + (svgHeight / 2) + ')');

        let pieColors = d3.scaleOrdinal(d3.schemeGreens[data.length + 1]);

        let pieSlices = d3.pie()
            .value(function(d) { return d.total_size; })
            .sort(null);

        let arcShape = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(svgWidth, svgHeight) / 2);

        pieChart.datum(data).selectAll('path')
            .data(pieSlices)
            .enter().append('path')
            .attr('fill', function(d, i) { return pieColors(i); })
            .attr('d', arcShape);
    }

    render() {
        return (
            <div id={this.props.id}>
                <svg>
                </svg>
            </div>
        );
    }
}