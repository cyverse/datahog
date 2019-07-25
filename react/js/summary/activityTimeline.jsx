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
        let svgWidth = 550, svgHeight = 350;
        let svgPadding = {top: 50, bottom: 40, left: 50, right: 30};
        
        let svg = d3.select('#' + this.props.id + '>svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);
        
        svg.selectAll('g').remove();
        
        let graph = svg.append('g')
            .attr('transform', 'translate(' + svgPadding.left + ', ' + svgPadding.top + ')');
        
        let tooltip = d3.select('#' + this.props.id + '>.tooltip')
            .style('visibility', 'hidden')
            .style('position', 'absolute')
            .style('width', 150)
            .style('text-align', 'center')
            .style('background-color', '#fff')
            .style('border', '1px solid #000');

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

        let scaleDate = d3.scaleLinear()
            .domain(d3.extent(data, function(d) { return d.date }))
            .rangeRound([0, width]);
        
        graph.append('g')
            .selectAll('rect')
            .data(data)
            .enter()
                .append('rect')
                .attr('fill', '#238b45')
                .attr('width', scaleX.bandwidth())
                .attr('height', d => height - scaleY(d.created))
                .attr('x', (d, i) => scaleX(i))
                .attr('y', d => scaleY(d.created))
                .on('mouseover', (d) => {
                    tooltip.style('visibility', 'visible')
                        .style('left', d3.event.pageX -400)
                        .style('top', d3.event.pageY + 'px')
                        .html(formatDate(d.date) + '<br>' + d.created + ' files created');
                })
                .on('mouseout', (d) => {
                    tooltip.style('visibility', 'hidden')
                });
        
        graph.append('g')
            .selectAll('rect')
            .data(data)
            .enter()
                .append('rect')
                .attr('fill', '#74c476')
                .attr('width', scaleX.bandwidth())
                .attr('height', d => height - scaleY(d.modified - d.created))
                .attr('x', (d, i) => scaleX(i))
                .attr('y', d => scaleY(d.modified))
                .on('mouseover', (d) => {
                    tooltip.style('visibility', 'visible')
                        .style('left', d3.event.pageX -400)
                        .style('top', d3.event.pageY + 'px')
                        .html(formatDate(d.date) + '<br>' + d.modified + ' files modified');
                })
                .on('mouseout', (d) => {
                    tooltip.style('visibility', 'hidden')
                });
        
        graph.append('g')
            .selectAll('rect')
            .data(data)
            .enter()
                .append('rect')
                .attr('fill', '#c7e9c0')
                .attr('width', scaleX.bandwidth())
                .attr('height', d => height - scaleY(d.accessed - d.modified))
                .attr('x', (d, i) => scaleX(i))
                .attr('y', d => scaleY(d.accessed))
                .on('mouseover', (d) => {
                    tooltip.style('visibility', 'visible')
                        .style('left', d3.event.pageX -400)
                        .style('top', d3.event.pageY + 'px')
                        .html(formatDate(d.date) + ': ' + d.accessed + ' files accessed');
                })
                .on('mouseout', (d) => {
                    tooltip.style('visibility', 'hidden')
                });


        function formatDate(seconds) {
            let date = new Date(seconds*1000);
            return date.toISOString().substring(5, 10);
        }

        let yAxis = d3.axisLeft(scaleY).ticks(5);
        let xAxis = d3.axisBottom(scaleDate).tickFormat(formatDate).ticks(8);

        graph.append("g")
            .call(yAxis);

        graph.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        // // add axes and line to graph
        

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
                <svg></svg>
                <div className="tooltip"></div>
            </div>
        );
    }
}