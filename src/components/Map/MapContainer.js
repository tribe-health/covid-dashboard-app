import React, { Component } from 'react';
import Map from '../Map/Map';
import { STATS } from '../../utils/constants';
import { getDateIdx, getReadableDate, formatTitle } from '../../utils/utils';
import { COUNTYNAMES } from '../../utils/geoids';
import { mapHighColorPalette, mapLowColorPalette } from '../../utils/colors';
import { scalePow } from 'd3-scale';
import { select } from 'd3-selection';

class MapContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            children: [],
            scaleColors: [],
            numMaps: 4, // number of individual maps to display in Map View
            strokeWidth: 0.8,
            strokeHoverWidth: 1.8
        }
        this.mapRefContainer = React.createRef();

        this.strokeWidthScale = scalePow().exponent(0.25)
            .range([0.1, 0.8]).domain([9, 1])
        this.strokeHoverWidthScale = scalePow().exponent(0.25)
            .range([0.25, 1.8]).domain([9, 1])
    }

    componentDidMount() {
        const { geoid, scenario, firstDate, selectedDate, width, height } = this.props;
        this.initializeMaps(geoid, scenario, firstDate, selectedDate, width, height);
    }

    componentDidUpdate(prevProps, prevState) {

        if (this.props.geoid !== prevProps.geoid
            || this.props.selectedDate !== prevProps.selectedDate
            || this.props.countyBoundaries !== prevProps.countyBoundaries
            || this.props.scenario !== prevProps.scenario
            || this.props.width !== prevProps.width
            || this.props.height !== prevProps.height
            || this.state.strokeWidth !== prevState.strokeWidth) {

            const { geoid, scenario, firstDate, selectedDate, width, height } = this.props;
            this.initializeMaps(geoid, scenario, firstDate, selectedDate, width, height);
        }
    }

    initializeMaps = (geoid, scenario, firstDate, selectedDate, width, height) => {
        const children = [];
        const dateIdx = getDateIdx(firstDate, selectedDate);
        const { numMaps, strokeWidth, strokeHoverWidth } = this.state;

        for (let stat of STATS.slice(0, numMaps)) {
            const child = {
                key: `${stat.key}-map`,
                map: [],
            }
            child.map.push(
                <Map
                    key={`${stat.key}-map`}
                    stat={stat}
                    geoid={geoid}
                    scenario={scenario}
                    dateIdx={dateIdx}
                    countyBoundaries={this.props.countyBoundaries}
                    statsForCounty={this.props.statsForCounty}
                    width={width / 2}
                    height={height}
                    lowColor={mapLowColorPalette[stat.id]}
                    highColor={mapHighColorPalette[stat.id]}
                    strokeWidth={strokeWidth}
                    strokeHoverWidth={strokeHoverWidth}
                    handleZoom={this.handleZoom}
                />
            )
            children.push(child);
        }
        this.setState({ children });
    }

    handleZoom = (event) => {
        // console.log(event)
        if (this.mapRefContainer.current) {
            const mapNode = select(this.mapRefContainer.current)
            mapNode.selectAll('path')
                .attr('transform', event.transform)
            const strokeWidth = this.strokeWidthScale(event.transform.k)
            const strokeHoverWidth = this.strokeHoverWidthScale(event.transform.k)
            this.setState({ strokeWidth, strokeHoverWidth })
        }
    }

    render() {
        const scenarioTitle = formatTitle(this.props.scenario);
        const countyName = `${COUNTYNAMES[this.props.geoid]}`;
        return (
            <div>
                <div className="scenario-title titleNarrow">{countyName}</div>
                <div className="scenario-title">{scenarioTitle}</div>
                <div className="filter-label threshold-label callout callout-row">
                    {`Snapshot on `}
                    {/*TS migration: Use getClassForActiveState(this.props.dateSliderActive)*/}
                    <span className={this.props.dateSliderActive ? 'underline-active' : 'bold underline'}>
                        {getReadableDate(this.props.selectedDate)}
                    </span>
                </div>
                <div className="map-wrapper" ref={this.mapRefContainer}>
                    {this.state.children.map(child => {
                        return (
                            <div className="map" key={child.key}>
                                {child.map}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}

export default MapContainer
