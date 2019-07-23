import React from 'react';
import * as d3 from 'd3';

/**
 * A D3 visualization for "space occupied over time" data.
 */
export class ActivityTimeline extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidUpdate() {
        
        let data = this.props.data;
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

        let scaleX = d3.scaleBand()
            .domain(d3.range(data.length))
            .range([0, width])
            .padding(0.1);
        
        let scaleY = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(d.created, d.modified, d.accessed))])
            .range([height, 0]);
        

        
        graph.append('g')
            .selectAll('rect')
            .data(data)
            .enter()
                .append('rect')
                .attr('fill', '#238b45')
                .attr('width', scaleX.bandwidth())
                .attr('height', d => height - scaleY(d.created))
                .attr('x', (d, i) => scaleX(i))
                .attr('y', d => scaleY(d.created));
        
        graph.append('g')
            .selectAll('rect')
            .data(data)
            .enter()
                .append('rect')
                .attr('fill', '#74c476')
                .attr('width', scaleX.bandwidth())
                .attr('height', d => height - scaleY(d.modified - d.created))
                .attr('x', (d, i) => scaleX(i))
                .attr('y', d => scaleY(d.modified));
        
        graph.append('g')
            .selectAll('rect')
            .data(data)
            .enter()
                .append('rect')
                .attr('fill', '#c7e9c0')
                .attr('width', scaleX.bandwidth())
                .attr('height', d => height - scaleY(d.accessed - d.modified))
                .attr('x', (d, i) => scaleX(i))
                .attr('y', d => scaleY(d.accessed));
        

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

        // let sizeAxis = d3.axisLeft(yScale).tickFormat(formatSize).ticks(5);
        // let dateAxis = d3.axisBottom(xScale).tickFormat(formatDate).tickValues(xScale.domain());

        // // add axes and line to graph
        // graph.append("g")
        //     .attr("transform", "translate(0," + height + ")")
        //     .call(dateAxis);
        
        // graph.append("g")
        //     .call(sizeAxis);

        // graph.append("text")
        //     .attr("y", -25)
        //     .attr("text-anchor", "middle")
        //     .attr("x", width/2)
        //     .text("Total Space Occupied");

        // graph.append("text")
        //     .attr("y", 230)
        //     .attr("text-anchor", "middle")
        //     .attr("x", width/2)
        //     .attr("class", "timeline-subtitle")
        //     .text("Estimation based on file creation time");
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