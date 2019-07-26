import React from 'react';
import * as d3 from 'd3';


function formatDate(seconds) {
    let date = new Date(seconds*1000);
    return date.toISOString().substring(5, 10);
}

/**
 * A D3 visualization for "space occupied over time" data.
 */
export class ActivityTimeline extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        let svgWidth = 550, svgHeight = 350;
        let svgPadding = {top: 50, bottom: 40, left: 50, right: 30};
        
        let svg = d3.select('#' + this.props.id + '>svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);

        let graph = svg.append('g')
            .attr('transform', 'translate(' + svgPadding.left + ', ' + svgPadding.top + ')');

        this.tooltip = d3.select('#' + this.props.id + '>.tooltip')
            .style('visibility', 'hidden')
            .style('position', 'absolute')
            .style('width', 150)
            .style('text-align', 'center')
            .style('background-color', '#fff')
            .style('border', '1px solid #000');

        // set up graph scaling
        this.width = svgWidth - svgPadding.left - svgPadding.right;
        this.height = svgHeight - svgPadding.bottom - svgPadding.top;

        this.createdBars = graph.append('g');
        this.modifiedBars = graph.append('g');
        this.accessedBars = graph.append('g');

        this.yAxisCall = d3.axisLeft().ticks(5);
        this.xAxisCall = d3.axisBottom().tickFormat(formatDate).ticks(8);

        this.yAxis = graph.append("g");
        this.xAxis = graph.append("g")
            .attr("transform", "translate(0," + this.height + ")");

        this.scaleX = d3.scaleBand()
            .range([0, this.width])
            .padding(0.1);

        this.scaleDate = d3.scaleLinear()
            .rangeRound([0, this.width]);

        this.scaleY = d3.scaleLinear()
            .range([this.height, 0]);
    }

    componentDidUpdate() {

        let data = this.props.data.slice(this.props.data.length-this.props.days, this.props.data.length);

        console.log(data);

        this.scaleX.domain(d3.range(data.length));
        this.scaleY.domain([0, d3.max(data, d => Math.max(d.created, d.modified, d.accessed))]);
        this.scaleDate.domain(d3.extent(data, function(d) { return d.date }));
        
        let c = this.createdBars
            .selectAll('rect')
            .data(data);

        let tooltip = this.tooltip;
        let height = this.height;
        let scaleY = this.scaleY;
        let scaleX = this.scaleX;

        let t = d3.transition().duration(500);

        c.enter()
            .append('rect')
            .merge(c)
            .attr('fill', '#238b45')
            .attr('width', scaleX.bandwidth())
            .attr('height', d => height - scaleY(d.created))
            .attr('x', (d, i) => scaleX(i))
            .attr('y', d => scaleY(d.created))
            .on('mouseover', function(d) {
                d3.select(this).attr('fill', '#7e7ddb');

                tooltip.style('visibility', 'visible')
                    .style('left', d3.event.pageX -400)
                    .style('top', d3.event.pageY + 'px')
                    .html(formatDate(d.date) + '<br>' + d.created + ' files created');
            })
            .on('mouseout', function(d) {

                d3.select(this).attr('fill', '#238b45');
                tooltip.style('visibility', 'hidden')
            });
        
        c.exit().remove();



        
        let m = this.modifiedBars
            .selectAll('rect')
            .data(data);

        m.enter()
            .enter()
            .append('rect')
            .merge(m)
            .attr('fill', '#74c476')
            .attr('width', scaleX.bandwidth())
            .attr('height', d => height - scaleY(d.modified - d.created))
            .attr('x', (d, i) => scaleX(i))
            .attr('y', d => scaleY(d.modified))
            .on('mouseover', function(d) {
                tooltip.style('visibility', 'visible')
                    .style('left', d3.event.pageX -400)
                    .style('top', d3.event.pageY + 'px')
                    .html(formatDate(d.date) + '<br>' + d.modified + ' files modified');
            })
            .on('mouseout', function(d) {

                tooltip.style('visibility', 'hidden')
            });
        m.exit().remove();
        


        let a = this.accessedBars
            .selectAll('rect')
            .data(data);
        
        a.enter()
            .append('rect')
            .merge(a)
            .attr('fill', '#c7e9c0')
            .attr('width', scaleX.bandwidth())
            .attr('height', d => height - scaleY(d.accessed - d.modified))
            .attr('x', (d, i) => scaleX(i))
            .attr('y', d => scaleY(d.accessed))
            .on('mouseover', function(d) {
                tooltip.style('visibility', 'visible')
                    .style('left', d3.event.pageX -400)
                    .style('top', d3.event.pageY + 'px')
                    .html(formatDate(d.date) + ': ' + d.accessed + ' files accessed');
            })
            .on('mouseout', function(d) {
                tooltip.style('visibility', 'hidden')
            });
        a.exit().remove();

        this.yAxisCall.scale(this.scaleY);
        this.yAxis.transition(t).call(this.yAxisCall);

        this.xAxisCall.scale(this.scaleX);
        this.xAxis.transition(t).call(this.xAxisCall);
        // add axes and line to graph

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