var uniqueSectors;
var uniqueneighborhoods;

var randomXArray;
var randomYArray;

var maxEstablishments;

var radiusScale;
var fillColor;

var pieChartneighborhood;
var pieChartSector;

var pieChartDim = 200;

var currentYear = 2010;
var currentSector = 'All';

var idToX = {};
var idToY = {};

function bubbleChart() {
    console.log('bubbleChart function called');
    var width = 650;
    var height = 300;

    // Tooltip for mouseover functionality 
    var tooltip = floatingTooltip('tooltip', 240);

    // Locations to move bubbles towards, depending
    // on which view mode is selected.
    var center = { x: width / 2, y: height / 2 };

    const pieSvg = d3.select("#pieChart")
        .style("width", width + "px") // Set the width using style
        .style("height", height + "px") // Set the height using style
        .style("float", "right"); // Float the pie chart to the right

    var neighborhoodCenters = {
        'South Boston': { x: 1 * width / 4, y: height / 2 },
        'East Boston': { x: 2 * width / 4, y: height / 2 },
        'South End': { x: 3 * width / 4, y: height / 2 },
    }

    // X locations of the neighborhood titles.
    var neighborhoodTitlesX = {
        'South Boston': 1 * width / 4 - 15,
        'East Boston': 2 * width / 4,
        'South End': 3 * width / 4 + 15,
    };

    // @v4 strength to apply to the position forces
    var forceStrength = 0.017;

    // These will be set in create_nodes and create_vis
    var svg = null;
    var bubbles = null;
    var nodes = [];

    function charge(d) {
        return -Math.pow(d.radius, 2) * forceStrength;
    }

    var simulation = d3.forceSimulation()
        .velocityDecay(0.19)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

    simulation.stop();

    function createNodes(rawData) {
        // Use the max total_amount in the data as the max in the scale's domain
        // note we have to ensure the total_amount is a number.

        var myNodes = rawData.map(function (d) {
            // add id, radius, and x/y properties to each node
            d.radius = radiusScale(+d.est);
            d.value = +d.est;
            d.id = d.neighborhood + d.sector;
            d.group = d.sector;
            d.color = fillColor(d.sector);

            return d;

            // return {
            //     id: d.neighborhood + d.sector,
            //     radius: radiusScale(+d.est),
            //     value: +d.est,
            //     est: +d.est,
            //     color: fillColor(d.sector),
            //     neighborhood: d.neighborhood,
            //     year: +d.year,
            //     sector: d.sector,
            //     group: d.sector,
            //     n1_4: +d.n1_4,
            //     n5_9: +d.n5_9,
            //     n10_19: +d.n10_19,
            //     n20_49: +d.n20_49,
            //     n50_99: +d.n50_99,
            //     n100_249: +d.n100_249,
            //     n250_499: +d.n250_499,
            //     n500_999: +d.n500_999,
            //     n1000: +d.n1000,
            //     Small: +d.n1_4 + d.n5_9 + d.n10_19,
            //     Medium: +d.n20_49 + d.n50_99,
            //     Large: +d.n100_249 + d.n250_499 + d.n500_999 + d.n1000,
            //     Unknown: +d.est - (+d.n1_4 + d.n5_9 + d.n10_19 + d.n20_49 + d.n50_99 + d.n100_249 + d.n250_499 + d.n500_999 + d.n1000),
            //     x: d.x,
            //     y: d.y,
            // };
        });

        // Sort them so that the smaller nodes are on top of the larger nodes 
        myNodes.sort(function (a, b) { return b.value - a.value; });
        // console.log('nodes', myNodes)
        return myNodes;
    }



    function unclickedBubble() {
        // function to call when a bubble is unclicked (i.e. white space is clicked)
        console.log('unclicked bubble');
        // Remove everything except h3
        pieSvg.selectAll("*:not(h3)").remove();

        chart.createPieChartAll();
    }


    // functon to call when a bubble is clicked
    function clickedBubble(d) {
        console.log('clicked bubble');
        console.log(d);
        createPieChart(d, pieChartDim, pieChartDim);

        // select the bubble that matches the clicked bubble
        // var selectedBubble = d3.select(`circle.bubble[id='${d.id}']`);
        // console.log(selectedBubble);
    }

    var chart = function chart(selector, rawData) {
        nodes = createNodes(rawData);

        svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        bubbles = svg.selectAll('.bubble')
            .data(nodes, function (d) { return d.id; });

        // Create new circle elements each with class `bubble`.
        // There will be one circle.bubble for each object in the nodes array.
        // Initially, their radius (r attribute) will be 0.
        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r', 0)
            .attr('fill', function (d) { return d.color; })
            .attr('stroke', function (d) { return d3.rgb(d.color).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showBubbleDetail)
            .on('mouseout', hideBubbleDetail)
            .on('click', function (event) { clickedBubble(event); });

        bubbles = bubbles.merge(bubblesE);

        bubbles.transition()
            .duration(100)
            .attr('r', function (d) { return d.radius; });

        simulation.nodes(nodes);


        console.log(simulation);


        // Set initial layout to single group.
        groupBubbles();

        // console.log('storing x/y coordinates...');
        // for all bubbles, add the x/y coordinates to the idToX and idToY objects
        // bubbles.each(function (d) {
        //     idToX[d.id] = d.x;
        //     idToY[d.id] = d.y;
        // });
        console.log('idToX', idToX);
    };

    // when the user clicks outside of a bubble, the pie chart should be removed
    document.addEventListener('click', function (event) {
        // If the user clicks outside of the bubble, remove the pie chart (except if the user has clicked the slider)
        if (!event.target.closest('.bubble') && !event.target.closest('.slider')) {
            // also check if clicked on the pie chart
            if (!event.target.closest('.pie')) {
                unclickedBubble();
            }
        }
    });

    // function to create a pie chart with all data
    chart.createPieChartAll = function () {
        console.log('creating pie chart with all data');

        // Create a new pie chart with *all* data for the selected year

        // First need to create a new filteredData array with all data for the selected year and sum up the number of establishments
        currentYear = d3.select("#yearSlider").node().value;
        var filteredData = data.filter(function (d) {
            return d.year == currentYear
        });

        if (currentSector != 'All') {
            filteredData = filteredData.filter(function (d) {
                return d.sector == currentSector;
            });
        }

        // parse
        filteredData = filteredData.map(function (d) { return parseData(d); });

        // console.log('filteredData', filteredData);

        // Create a temporary object to store the sum of establishments for each size of business
        var sumEst = {};
        // initialize
        sumEst['Small'] = 0;
        sumEst['Medium'] = 0;
        sumEst['Large'] = 0;
        sumEst['Unknown'] = 0;

        sumEst['n1_4'] = 0;
        sumEst['n5_9'] = 0;
        sumEst['n10_19'] = 0;
        sumEst['n20_49'] = 0;
        sumEst['n50_99'] = 0;
        sumEst['n100_249'] = 0;
        sumEst['n250_499'] = 0;
        sumEst['n500_999'] = 0;
        sumEst['n1000'] = 0;


        // Loop through the filteredData array and sum up the number of establishments for each size of business ('Small', 'Medium', 'Large', 'Unknown')
        filteredData.forEach(function (d) {
            // for each size of business, add the number of establishments to the sum
            sumEst['Small'] = (sumEst['Small'] || 0) + d.Small;
            sumEst['Medium'] = (sumEst['Medium'] || 0) + d.Medium;
            sumEst['Large'] = (sumEst['Large'] || 0) + d.Large;
            sumEst['Unknown'] = (sumEst['Unknown'] || 0) + d.Unknown;

            sumEst['n1_4'] = (sumEst['n1_4'] || 0) + d.n1_4;
            sumEst['n5_9'] = (sumEst['n5_9'] || 0) + d.n5_9;
            sumEst['n10_19'] = (sumEst['n10_19'] || 0) + d.n10_19;
            sumEst['n20_49'] = (sumEst['n20_49'] || 0) + d.n20_49;
            sumEst['n50_99'] = (sumEst['n50_99'] || 0) + d.n50_99;
            sumEst['n100_249'] = (sumEst['n100_249'] || 0) + d.n100_249;
            sumEst['n250_499'] = (sumEst['n250_499'] || 0) + d.n250_499;
            sumEst['n500_999'] = (sumEst['n500_999'] || 0) + d.n500_999;
            sumEst['n1000'] = (sumEst['n1000'] || 0) + d.n1000;
        });

        // Add total
        sumEst['est'] = sumEst['Small'] + sumEst['Medium'] + sumEst['Large'] + sumEst['Unknown'];
        sumEst['year'] = d3.select("#yearSlider").node().value;

        // TODO: hacky, but add neighborhood and sector to sumEst to match the format of the other data for the tooltip
        sumEst['neighborhood'] = 'All';

        sumEst['sector'] = currentSector;

        console.log('sumEst', sumEst);

        // Create a new pie chart with the sum of establishments for each sector
        createPieChart(sumEst, 225, 225);

        // Reset the pieChartneighborhood and pieChartSector
        pieChartneighborhood = null;
        pieChartSector = null;

    }

    function createPieChart(d, pieWidth, pieHeight) {

        // Remove any existing pie chart except h3
        pieSvg.selectAll("*:not(h3)").remove();

        // console.log('creating pie chart');
        // set the item with class pie-chart-title to have display visible
        pieSvg.select('.pie-chart-title').style('display', 'block');

        // pieSvg.append('text')
        //     .attr('x', pieWidth / 3)
        //     .attr('y', -10) // Position above the pie chart
        //     .attr('text-anchor', 'middle')
        //     // centered
        //     .style('font-size', '13px')
        //     .style('font-weight', 'bold')
        //     .text('Proportion of Establishments by Size of Business');

        // Set the pie chart neighborhood and sector
        pieChartneighborhood = d.neighborhood;
        pieChartSector = d.sector;

        const rowData = [
            // { size: '1-4', subest: +d.n1_4, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            // { size: '5-9', subest: +d.n5_9, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            // { size: '10-19', subest: +d.n10_19, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            // { size: '20-49', subest: +d.n20_49, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            // { size: '50-99', subest: +d.n50_99, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            // { size: '100-249', subest: +d.n100_249, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            // { size: '250-499', subest: +d.n250_499, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            // { size: '500-999', subest: +d.n500_999, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            // { size: '1000+', subest: +d.n1000, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            { size: 'Small', subest: d.Small, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            { size: 'Medium', subest: d.Medium, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
            { size: 'Large', subest: d.Large, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },

            // TODO: for now, ignoring unknown
            { size: 'Unknown', subest: d.Unknown, sector: d.sector, neighborhood: d.neighborhood, year: d.year, est: d.est },
        ];

        // console.log('rowData', rowData);

        // Order the data by size of business (order: Small, Medium, Large, Unknown)
        order = ['Small', 'Medium', 'Large', 'Unknown'];
        rowData.sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size));

        console.log('rowData', rowData);

        // Set up dimensions for the pie chart
        // const pieWidth = 300;
        // const pieHeight = 300;
        const radius = Math.min(pieWidth - 20, pieHeight - 20) / 2;

        // Create SVG for the pie chart
        const svgPie = pieSvg.append("svg")
            .attr('class', 'pie')
            .attr("width", pieWidth)
            .attr("height", pieHeight)
            .append("g")
            .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);

        // Set up the pie layout
        const pieLayout = d3.pie()
            .value(d => d.subest);

        // Set up the arc generator
        const arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        // Get the color of the clicked bubble
        const baseColor = d.color;

        // Generate arcs and bind pie data to them; make sure to preserve order of data
        const arcs = svgPie.selectAll(".arc")
            .data(pieLayout(rowData))
            .enter()
            .append("g")
            .on('mouseover', showPieDetail)
            .on('mouseout', hidePieDetail)
            .attr("class", "arc");


        function getColor(d, opacity) {
            // if unknown, return light grey
            if (d.data.size === 'Unknown') {
                // return d3.rgb('lightgrey').toString()
                return d3.rgb('white').toString()
            } else {
                return d3.rgb(baseColor).toString().replace(")", `, ${opacity})`);
            }
        }

        // Append paths for the arcs with varying opacity
        arcs.append("path")
            .attr("d", arcGenerator)
            .attr("fill", (d, i) => {
                // const opacity = 0.1 + (0.9 / rowData.length) * i; // Adjust opacity calculation
                // return d3.rgb(baseColor).toString().replace(")", `, ${opacity})`);
                const opacity = 0.1 + (0.95 / (rowData.length - 1)) * i; // Adjust opacity calculation
                return getColor(d, opacity);
                // return d3.rgb(baseColor).toString().replace(")", `, ${opacity})`);
            })
            .attr("stroke", "black") // Add stroke color
            .style("stroke-width", "2px") // Set stroke width
            .style("opacity", 1); // Fade in the arcs
        // .transition() // Apply transition for better visual effect
        // .duration(1000)
        // .attrTween("d", function (d) {
        //     var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        //     return function (t) {
        //         return arcGenerator(interpolate(t));
        //     };
        // });

        // // Append text labels for the arcs outside the pie chart
        // arcs.append("text")
        //     .attr("transform", function (d) {
        //         var pos = arcGenerator.centroid(d);
        //         var midAngle = Math.atan2(pos[1], pos[0]);
        //         var x = Math.cos(midAngle) * (radius + 20); // 20 is the distance from the pie
        //         var y = Math.sin(midAngle) * (radius + 20); // 20 is the distance from the pie
        //         return "translate(" + x + "," + y + ")";
        //     })
        //     .attr("text-anchor", function (d) {
        //         // If the label is on the left side, anchor it end
        //         // If the label is on the right side, anchor it start
        //         return (d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : "start";
        //     })
        //     .text(function (d) {
        //         if (!isNaN(d.data.est) && d.data.est !== 0) {
        //             return `${d.data.size}`;
        //         } else {
        //             return ''; // Return empty string for NaN or zero values
        //         }
        //     });

        // // // Append text labels for the arcs
        arcs.append("text")
            .attr("transform", d => {
                const centroid = arcGenerator.centroid(d);
                const newX = centroid[0] * 1.2; // Adjust this factor to control the distance from the edge
                const newY = centroid[1] * 1.2; // Adjust this factor to control the distance from the edge
                return `translate(${newX}, ${newY})`;
            })
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text(d => {
                if (!isNaN(d.data.subest) && d.data.subest !== 0) {
                    // return `${d.data.size}: ${d.data.subest}`;

                    // Check if the arc is at least 5% of the total
                    if (d.endAngle - d.startAngle > 0.5) {
                        return `${d.data.size}`;
                    } else {
                        return '';
                    }
                    // return `${d.data.size}`;
                } else {
                    return ''; // Return empty string for NaN or zero values
                }
            });
    }

    chart.updatePieChart = function () {
        // If a pie chart has been created, update it
        if (pieChartneighborhood && pieChartSector) {
            // Find the bubble in filteredData that matches the pie chart neighborhood and sector AND the year
            const d = nodes.find(d => d.neighborhood === pieChartneighborhood && d.sector === pieChartSector);

            // If the bubble is found, recreate the pie chart
            if (d) {
                console.log('Bubble found');
                console.log(d);
                createPieChart(d, pieChartDim, pieChartDim);
            }
            else {
                console.log('Bubble not found');

                pieSvg.selectAll("*:not(h3)").remove();
                // set the item with class pie-chart-title to have display invisible
                pieSvg.select('.pie-chart-title').style('display', 'none');
                // Remove the pie chart if the bubble is not found
                console.log('Pie chart removed');

                // create a new pie chart with all data
                chart.createPieChartAll();
            }
        }
        else {
            console.log('Pie chart not created');
            pieSvg.selectAll("*:not(h3)").remove();
            // set the item with class pie-chart-title to have display invisible
            pieSvg.select('.pie-chart-title').style('display', 'none');
            // Remove the pie chart if the bubble is not found
            console.log('Pie chart removed');

            // create a new pie chart with all data
            chart.createPieChartAll();
        }
    };


    function ticked() {
        // https://stackoverflow.com/questions/51153379/getting-d3-force-to-work-in-update-pattern

        d3.selectAll('.bubble')
            .attr('cx', function (d) { idToX[d.id] = d.x; return d.x; })
            .attr('cy', function (d) { idToY[d.id] = d.y; return d.y; });
    };


    /*
     * Provides a x value for each node to be used with the split by year
     * x force.
     */
    function nodeneighborhoodPos(d) {
        // console.log(d);
        // console.log(d.neighborhood);
        // console.log(neighborhoodCenters[d.neighborhood]);
        // console.log(neighborhoodCenters[d.neighborhood].x);
        return neighborhoodCenters[d.neighborhood].x;
    }


    /*
     * Sets visualization in "single group mode".
     * The year labels are hidden and the force layout
     * tick function is set to move all nodes to the
     * center of the visualization.
     */
    function groupBubbles() {
        hideneighborhoodTitles();

        // @v4 Reset the 'x' force to draw the bubbles to the center.
        simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
    }


    /*
     * Sets visualization in "split by year mode".
     * The year labels are shown and the force layout
     * tick function is set to move nodes to the
     * yearCenter of their data's year.
     */
    function splitBubbles() {
        console.log('splitting bubbles...');
        showneighborhoodTitles();

        splitForceStrength = 0.03;
        // @v4 Reset the 'x' force to draw the bubbles to their year centers
        simulation.force('x', d3.forceX().strength(splitForceStrength).x(nodeneighborhoodPos));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
    }

    /*
     * Hides neighborhood title displays.
     */
    function hideneighborhoodTitles() {
        svg.selectAll('.year').remove();
    }

    /*
     * Shows neighborhood title displays.
     */
    function showneighborhoodTitles() {
        // Another way to do this would be to create
        // the year texts once and then just hide them.
        var yearsData = d3.keys(neighborhoodTitlesX);
        var years = svg.selectAll('.year')
            .data(yearsData);

        years.enter().append('text')
            .attr('class', 'year')
            .attr('x', function (d) { return neighborhoodTitlesX[d]; })
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(function (d) { return d; });
    }

    function getSharedTooltipContent(d) {
        // console.log("getting shared tooltip content");
        // console.log(d);
        // Describe the tooltip content: sector, number of establishments, neighborhood, year, and x/y
        var content = '<span class="name">Sector: </span><span class="value">' +
            d.sector + '</span>' + '<br/>' + '<span class="name">neighborhood: </span><span class="value">' +
            d.neighborhood + '</span>' + '<br/>' + '<span class="name">Year: </span><span class="value">' + d.year + '</span>' + '</br><span class="name">Total Establishments: </span><span class="value">' +
            d.est + '</span>';

        // Add x/y coordinates
        // content = content + '<br><br>' + '<span class="name">x: </span><span class="value">' + d.x + '</span>' + '<br/>' + '<span class="name">y: </span><span class="value">' + d.y + '</span>';

        return content;
    }

    function showBubbleDetail(d) {
        // console.log(d);

        // change outline to indicate hover state.
        d3.select(this).attr('stroke', 'black');

        // Describe the tooltip content: sector, number of establishments, neighborhood, year, and x/y
        var content = getSharedTooltipContent(d);

        tooltip.showTooltip(content, d3.event);
    }

    function hideBubbleDetail(d) {
        // reset outline
        d3.select(this)
            .attr('stroke', d3.rgb(d.color).darker());

        tooltip.hideTooltip();
    }

    // Function to show tooltip on mouseover for the pie chart
    function showPieDetail(d) {
        // change outline to indicate hover state.
        // d3.select(this).attr('stroke', 'black');

        // function to get description of size of business
        function getDescription(size) {
            if (size === 'Small') {
                return 'Small Business (1-19 employees)';
            } else if (size === 'Medium') {
                return 'Medium Business (20-99 employees)';
            } else if (size === 'Large') {
                return 'Large Business (100+ employees)';
            } else if (size == 'Unknown') {
                return 'Unknown Number of Employees';
            } else if (size === '1-4') {
                return '1-4 employees';
            } else if (size === '5-9') {
                return '5-9 employees';
            } else if (size === '10-19') {
                return '10-19 employees';
            } else if (size === '20-49') {
                return '20-49 employees';
            } else if (size === '50-99') {
                return '50-99 employees';
            } else if (size === '100-249') {
                return '100-249 employees';
            } else if (size === '250-499') {
                return '250-499 employees';
            } else if (size === '500-999') {
                return '500-999 employees';
            } else if (size === '1000+') {
                return '1000+ employees';
            }

        }

        // Describe the tooltip content: sector, neighborhood, year, and description of size of business
        var sharedContent = getSharedTooltipContent(d.data);
        console.log('sharedContent', sharedContent);
        // var content = '<span class="name">Business Size: </span><span class="value">' +
        //     getDescription(d.data.size) + '</span>' + '<br/>' + '<span class="name">Number of Establishments: </span><span class="value">' +
        //     d.data.subest + '</span>';
        var content = '<span class="name">' +
            getDescription(d.data.size) + '</span>' + '<br/>' + '<span class="name">' +
            d.data.subest + ' establishments </span>';

        content = content + '<br><br>' + sharedContent;

        tooltip.showTooltip(content, d3.event);
    }

    // Function to hide tooltip on mouseout for the pie chart
    function hidePieDetail(d) {
        // reset outline
        // d3.select(this)
        // .attr('stroke', d3.rgb(d.color).darker());

        tooltip.hideTooltip();
    }

    chart.toggleDisplay = function (displayName) {
        if (displayName === 'year') {
            splitBubbles();
        } else {
            groupBubbles();
        }
    };

    // Update function to update the bubbles based on filtered data
    chart.updateBubbles = function (filteredData) {
        console.log('updating bubbles...');
        console.log('filteredData', filteredData);

        // Update the existing nodes' data with filtered data
        nodes = createNodes(filteredData);

        // Update the bubbles data
        var bubbles = svg.selectAll('.bubble');

        // Set the data by joining the nodes with the data
        bubbles = bubbles.data(nodes, function (d) { return d.id; });
        // bubbles = bubbles.data(nodes);

        console.log('num bubbles before exit', bubbles.size())
        // Remove bubbles that no longer exist in the filtered data
        bubbles.exit().remove();

        console.log('num bubbles after exit', bubbles.size())

        // Enter new bubbles
        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r', function (d) { return 0; }) // Set initial radius
            .attr('cx', function (d) { console.log('new d:', d); return d.x; })
            .attr('cy', function (d) { return d.y; })
            .attr('fill', function (d) { return d.color; })
            .attr('stroke', function (d) { return d3.rgb(d.color).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showBubbleDetail)
            .on('mouseout', hideBubbleDetail)
            .on('click', function (event) { clickedBubble(event); });

        console.log('new bubbles:', bubblesE.size());

        // Merge the original empty selection and the enter selection
        bubbles = bubbles.merge(bubblesE);

        console.log("total bubbles", bubbles.size());

        console.log('idToX', idToX);

        // Update the x and y properties of the nodes based on the current positions of bubbles
        bubbles.each(function (d, i) {
            var cx = +d3.select(this).attr('cx');
            var cy = +d3.select(this).attr('cy');

            nodes[i].x = cx;
            nodes[i].y = cy;

            // if d.id not in idToX, add it
            if (!idToX[d.id]) {
                idToX[d.id] = cx;
            }
            if (!idToY[d.id]) {
                idToY[d.id] = cy;
            }
        });

        // Make sure the length of the nodes array is the same as the length of the bubbles array
        console.log('nodes', nodes.length);
        console.log('bubbles', bubbles.size());

        function getX(d) {
            if (d.id in idToX) {
                // console.log('idToX[d.id]', idToX[d.id]);
                return idToX[d.id];
            } else {
                console.log('id not in idToX', d.id);
                return d.x;
            }
        }

        function getY(d) {
            if (d.id in idToY) {
                // console.log('idToY[d.id]', idToY[d.id]);
                return idToY[d.id];
            } else {
                console.log('id not in idToY', d.id);
                return d.y;
            }
        }

        // Transition existing bubbles to new positions
        bubbles.transition()
            .duration(100)
            .attr('cx', function (d) { return getX(d); })
            .attr('cy', function (d) { return getY(d); })
            .attr('r', function (d) { return d.radius; });

        // Set the simulation's nodes to our newly created nodes array.

        // if nodes is not empty
        console.log('simulation...');
        console.log(nodes);
        simulation.nodes(nodes);
        // reset the charge force based on the current nodes
        // simulation.force('charge', null);

        // simulation.force('charge', d3.forceManyBody().strength(charge));
        // simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

        console.log('restart simulation...');
        // Restart the simulation
        simulation.alpha(1).restart();

        // groupBubbles();
    };


    // return the chart function from closure.
    return chart;
}


function setupButtons() {
    d3.select('#toolbar')
        .selectAll('.button')
        .on('click', function () {
            // Remove active class from all buttons
            d3.selectAll('.button').classed('active', false);
            // Find the button just clicked
            var button = d3.select(this);

            // Set it as the active button
            button.classed('active', true);

            // Get the id of the button
            var buttonId = button.attr('id');

            // Toggle the bubble chart based on
            // the currently clicked button.
            myBubbleChart.toggleDisplay(buttonId);
        });
}

// Load the data.
d3.csv('../data/all_data.csv', display);

// setup the buttons.
setupButtons();

// We define data here so it's accessible within update function and the load function.
var data;

function display(error, rawData) {
    if (error) {
        console.log(error);
    }

    // remove neighborhood 02228
    // rawData = rawData.filter(function (d) { return d.neighborhood != '02228'; });

    // Only consider the top 10 sectors
    // Get the top 10 sectors by number of establishments across all years
    var topSectors = rawData.reduce(function (acc, curr) {
        if (acc[curr.sector]) {
            acc[curr.sector] += +curr.est;
        } else {
            acc[curr.sector] = +curr.est;
        }
        return acc;
    }, {});

    // Sort the sectors by number of establishments
    topSectors = Object.keys(topSectors).sort(function (a, b) {
        return topSectors[b] - topSectors[a];
    });

    // Get the top 10 sectors
    topSectors = topSectors.slice(0, 20);

    // Filter the data to only include the top 10 sectors
    rawData = rawData.filter(function (d) { return topSectors.includes(d.sector); });

    // Only include Utilities sector
    // rawData = rawData.filter(function (d) { return d.sector === 'Utilities'; });

    // remove unclassified; TODO: want this?
    rawData = rawData.filter(function (d) { return d.sector != 'Unclassified'; });

    data = rawData;

    initialize(currentYear, data); // initial year to be displayed when page loads
}

function initialize(year, data) {
    // Load data and initialize visualization

    uniqueSectors = [...new Set(data.map(d => d.sector))];



    uniqueneighborhoods = [...new Set(data.map(d => d.neighborhood))];

    numUniqueX = uniqueSectors.length * uniqueneighborhoods.length;

    randomXArray = Array.from({ length: numUniqueX }, () => Math.random() * 900);

    randomYArray = Array.from({ length: numUniqueX }, () => Math.random() * 800);

    maxEstablishments = d3.max(data, function (d) { return +d.est; });
    console.log('maxEstablishments', maxEstablishments);

    radiusScale = d3.scalePow()
        .exponent(1)
        .range([5, 50])
        .domain([0, maxEstablishments]);

    // get colors in d3.schemeCategory20, but map #c7c7c7 and #7f7f7f to different colors 
    colors = d3.schemeCategory20.map(function (d) {
        if (d === '#c7c7c7') {
            return '#FDDA0D';
        }
        if (d === '#7f7f7f') {
            return '#FFFF00';
        }
        return d;
    });

    console.log('length of colors', colors.length);

    fillColor = d3.scaleOrdinal()
        .domain(uniqueSectors)
        .range(colors);
    // Parse the data, pass in the unique sectors and unique neighborhoods
    parsedData = data.map(function (d) { return parseData(d); });

    console.log('parsedData', parsedData);

    var filteredData = parsedData.filter(function (d) { return d.year === year; });


    // populate the #sector-dropdown with the unique sectors
    // set the color of the dropdown to match the color of the sector
    var sectorDropdown = d3.select('#sector-dropdown');
    sectorDropdown.selectAll('option')
        .data(uniqueSectors)
        .enter()
        .append('option')
        .text(function (d) { return d; })
        .style('background', function (d) { return fillColor(d); });

    myBubbleChart('#vis', filteredData);
    myBubbleChart.createPieChartAll();
}

function update(data) {
    // uniqueSectors = [...new Set(data.map(d => d.sector))];
    // uniqueneighborhoods = [...new Set(data.map(d => d.neighborhood))];

    // Parse the data, pass in the unique sectors and unique neighborhoods
    parsedData = data.map(function (d) { return parseData(d); });

    console.log('parsedData', parsedData);

    var filteredData = parsedData.filter(function (d) { return d.year === currentYear; });

    if (currentSector != 'All') {
        filteredData = filteredData.filter(function (d) { return d.sector === currentSector; });
    }

    myBubbleChart.updateBubbles(filteredData);

    myBubbleChart.updatePieChart();

}

d3.select("#yearSlider")
    .on("input", function () {
        var selectedYear = this.value;

        // convert selectedneighborhood to a number
        selectedYear = +selectedYear;

        currentYear = selectedYear;
        console.log('selected', selectedYear);

        // Update the chart with the selected year
        update(data);

        // Update the year displayed next to the slider
        d3.select("#selectedYear").text(selectedYear);
    });

d3.select("#sector-dropdown")
    .on("change", function () {
        var selectedSector = d3.select(this).property('value');

        currentSector = selectedSector;
        console.log('currentYear', currentYear);
        console.log('currentSector', currentSector);

        // Update the chart with the selected sector
        parsedData = data.map(function (d) { return parseData(d); });
        console.log('parsedData', parsedData);
        var filteredData = parsedData.filter(function (d) { return d.year == currentYear; });

        if (selectedSector != 'All') {
            filteredData = filteredData.filter(function (d) { return d.sector == currentSector; });
        }

        console.log('filteredData', filteredData);

        myBubbleChart.updateBubbles(filteredData);
        myBubbleChart.updatePieChart();
    }
    );

function getXY(d) {
    // Maps sector/neighborhood to x position

    index = 0;

    for (var i = 0; i < uniqueSectors.length; i++) {
        sector = uniqueSectors[i];

        if (sector == d.sector) {
            x = randomXArray[index];
            y = randomYArray[index];

            return { x: x, y: y };
        }
        index++;
    }
    console.log('no match for sector');
    console.log('d.sector', d.sector);
    console.log('uniqueSectors', uniqueSectors);
}

function parseData(d) {
    // Map nan to 0
    d.n1_4 = isNaN(d.n1_4) ? 0 : d.n1_4;
    d.n5_9 = isNaN(d.n5_9) ? 0 : d.n5_9;
    d.n10_19 = isNaN(d.n10_19) ? 0 : d.n10_19;
    d.n20_49 = isNaN(d.n20_49) ? 0 : d.n20_49;
    d.n50_99 = isNaN(d.n50_99) ? 0 : d.n50_99;
    d.n100_249 = isNaN(d.n100_249) ? 0 : d.n100_249;
    d.n250_499 = isNaN(d.n250_499) ? 0 : d.n250_499;
    d.n500_999 = isNaN(d.n500_999) ? 0 : d.n500_999;
    d.n1000 = isNaN(d.n1000) ? 0 : d.n1000;

    return {
        id: d.neighborhood + d.sector,
        year: +d.year,
        sector: d.sector,
        est: +d.est,
        neighborhood: d.neighborhood,
        x: getXY(d).x,
        y: getXY(d).y,
        n1_4: +d.n1_4,
        n5_9: +d.n5_9,
        n10_19: +d.n10_19,
        n20_49: +d.n20_49,
        n50_99: +d.n50_99,
        n100_249: +d.n100_249,
        n250_499: +d.n250_499,
        n500_999: +d.n500_999,
        n1000: +d.n1000,
        Small: +d.n1_4 + +d.n5_9 + +d.n10_19,
        Medium: +d.n20_49 + +d.n50_99,
        Large: +d.n100_249 + +d.n250_499 + +d.n500_999 + +d.n1000,
        Unknown: +d.est - (+d.n1_4 + +d.n5_9 + +d.n10_19 + +d.n20_49 + +d.n50_99 + +d.n100_249 + +d.n250_499 + +d.n500_999 + +d.n1000),
    };
}

var myBubbleChart = bubbleChart();

