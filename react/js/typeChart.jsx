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
            if (!data.length) return;
        } else {
            return;
        }

        let svgWidth = 450, svgHeight = 200;

        let svg = d3.select('#' + this.props.id + '>svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);

        svg.selectAll('g').remove();
        let pieChart = svg.append('g')
            .attr('transform', 'translate(' + svgWidth / 2 + ',' + (svgHeight / 2) + ')');

        let pieSlices = d3.pie().value(d => d.total_size);

        let pieColors = d3.scaleOrdinal(this.props.colors);

        let arcShape = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(svgWidth, svgHeight) / 2);

        pieChart.datum(data).selectAll('path')
            .data(pieSlices)
            .enter().append('path')
            .attr('fill', (d, i) => pieColors(i))
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