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
        let svgWidth = 415, svgHeight = 350;
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
        this.xAxisCall = d3.axisBottom().tickFormat(formatDate).ticks(7);

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
        let viewCreated = this.props.viewCreated;
        let viewModified = this.props.viewModified;
        let viewAccessed = this.props.viewAccessed;
        let data = this.props.data.slice(this.props.data.length-this.props.days, this.props.data.length);


        this.scaleX.domain(d3.range(data.length));
        this.scaleY.domain([0, d3.max(data, function(d) {
            let max = d.modified;
            if (viewCreated) max = Math.max(max, d.modified);
            if (viewAccessed) max = Math.max(max, d.accessed);
            return max;
        })]);
        this.scaleDate.domain(d3.extent(data, function(d) { return d.date }));
        
        
        let tooltip = this.tooltip;
        let height = this.height;
        let scaleY = this.scaleY;
        let scaleX = this.scaleX;
        let t = d3.transition().duration(500);

        let c = this.createdBars
            .selectAll('rect')
            .data(data, d => d.date);

        c.enter()
            .append('rect')
            .merge(c)
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
            })
            .transition(t)
            .attr('fill', '#238b45')
            .attr('width', scaleX.bandwidth())
            .attr('height', d => viewCreated ? height - scaleY(d.modified) : 0)
            .attr('x', (d, i) => scaleX(i))
            .attr('y', d => viewCreated ? scaleY(d.created) : height);
        
        c.exit().remove();
        
        

        let mFloor = d => viewCreated ? scaleY(d.created) : height;

        let m = this.modifiedBars
            .selectAll('rect')
            .data(data, d => d.date);

        m.enter()
            .enter()
            .append('rect')
            .merge(m)
            .on('mouseover', function(d) {
                d3.select(this).attr('fill', '#7e7ddb');
                tooltip.style('visibility', 'visible')
                    .style('left', d3.event.pageX -400)
                    .style('top', d3.event.pageY + 'px')
                    .html(formatDate(d.date) + '<br>' + d.modified + ' files modified');
            })
            .on('mouseout', function(d) {
                d3.select(this).attr('fill', '#74c476');
                tooltip.style('visibility', 'hidden')
            })
            .transition(t)
            .attr('fill', '#74c476')
            .attr('width', scaleX.bandwidth())
            .attr('height', d => viewModified ? mFloor(d) - scaleY(d.modified) : 0)
            .attr('x', (d, i) => scaleX(i))
            .attr('y', d => viewModified ? scaleY(d.modified) : mFloor(d))
        m.exit().remove();
        


        let a = this.accessedBars
            .selectAll('rect')
            .data(data, d => d.date);

        let aFloor = d => viewModified ? scaleY(d.modified) : viewCreated ? scaleY(d.created) : height;
        
        a.enter()
            .append('rect')
            .merge(a)
            .on('mouseover', function(d) {
                d3.select(this).attr('fill', '#7e7ddb');
                tooltip.style('visibility', 'visible')
                    .style('left', d3.event.pageX -400)
                    .style('top', d3.event.pageY + 'px')
                    .html(formatDate(d.date) + ': ' + d.accessed + ' files accessed');
            })
            .on('mouseout', function(d) {
                d3.select(this).attr('fill', '#c7e9c0');
                
                tooltip.style('visibility', 'hidden')
            })
            .transition(t)
            .attr('fill', '#c7e9c0')
            .attr('width', scaleX.bandwidth())
            .attr('height', d => viewAccessed ? aFloor(d) - scaleY(d.accessed) : 0)
            .attr('x', (d, i) => scaleX(i))
            .attr('y', d => viewAccessed ? scaleY(d.accessed) : aFloor(d));
        a.exit().remove();


        this.yAxisCall.scale(this.scaleY);
        this.yAxis.transition(t).call(this.yAxisCall); [].concat

        this.xAxisCall.scale(this.scaleDate).tickValues(data.map(d => d.date));
        this.xAxis.transition(t).call(this.xAxisCall);
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