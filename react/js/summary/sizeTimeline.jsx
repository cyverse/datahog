import React from 'react';
import * as d3 from 'd3';

export class SizeTimeline extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        // check for valid data
        let data;
        if (this.props.data) {
            data = JSON.parse(this.props.data);
            if (!data.length) return;
        } else {
            return;
        }
        // set up padding
        let svgWidth = 450, svgHeight = 290;
        let svgPadding = {top: 50, bottom: 40, left: 50, right: 30};
        
        let svg = d3.select('#' + this.props.id + '>svg')
            .attr("width", svgWidth)
            .attr("height", svgHeight);
            
        let graph = svg.append('g')
            .attr('transform', 'translate(' + svgPadding.left + ', ' + svgPadding.top + ')');
        
        // set up graph scaling
        let width = svgWidth - svgPadding.left - svgPadding.right;
        let height = svgHeight - svgPadding.bottom - svgPadding.top;

        let xScale = d3.scaleLinear()
            .rangeRound([0, width])
            .domain(d3.extent(data, function(d) { return d.date }));
        let yScale = d3.scaleLinear()
            .rangeRound([height, 0])
            .domain([0, d3.max(data, function(d) { return d.total_size })]);

        // set up axes and line
        function formatSize(bytes) {
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
            return Math.round(coefficient*100)/100 + ' ' + units;
        }

        function formatDate(seconds) {
            let date = new Date(seconds*1000);
            return date.toISOString().substring(0, 10);
        }

        let sizeAxis = d3.axisLeft(yScale).tickFormat(formatSize).ticks(5);
        let dateAxis = d3.axisBottom(xScale).tickFormat(formatDate).tickValues(xScale.domain());

        let line = d3.line()
            .x(function(d) { return xScale(d.date) })
            .y(function(d) { return yScale(d.total_size) });

        let bookendedData = [{
            date: d3.min(data, d => d.date),
            total_size: 0
        }].concat(data).concat([{
            date: d3.max(data, d => d.date),
            total_size: 0
        }]);
            
        
        graph.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#a1d99b")
        .attr("stroke-width", 4)
        .attr("d", line);
        
        graph.append('path')
        .datum(bookendedData)
        .attr("fill", "#e5f5e0")
        .attr("d", line);
        
        // add axes and line to graph
        graph.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(dateAxis);
        
        graph.append("g")
            .call(sizeAxis);

        graph.append("text")
            .attr("y", -25)
            .attr("text-anchor", "middle")
            .attr("x", width/2)
            .text("Total Space Occupied");

        graph.append("text")
            .attr("y", 230)
            .attr("text-anchor", "middle")
            .attr("x", width/2)
            .attr("class", "timeline-subtitle")
            .text("Estimation based on file creation time");
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