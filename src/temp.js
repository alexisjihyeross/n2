var uniqueSectors;
var uniqueZips;

var randomXArray;
var randomYArray;

var maxEstablishments;

var radiusScale;
var fillColor;

var pieChartZipcode;
var pieChartSector;

var pieChartDim = 200;

function bubbleChart() {
    console.log('bubbleChart function called');
    var width = 800;
    var height = 400;

    // Tooltip for mouseover functionality 
    var tooltip = floatingTooltip('tooltip', 240);

    // Locations to move bubbles towards, depending
    // on which view mode is selected.
    var center = { x: width / 2, y: height / 2 };

    const pieSvg = d3.select("#pieChart")
        .style("width", width + "px") // Set the width using style
        .style("height", height + "px") // Set the height using style
        .style("float", "right"); // Float the pie chart to the right

    // Create zipcodeCenters for 02109, 02125, 02127, "02118", "02128", "02228"
    var zipcodeCenters = {
        '02109': { x: 1 * width / 8, y: height / 2 },
        '02125': { x: 2 * width / 8, y: height / 2 },
        '02127': { x: 3 * width / 8, y: height / 2 },
        '02118': { x: 4 * width / 8, y: height / 2 },
        '02128': { x: 5 * width / 8, y: height / 2 },
        // '02228': { x: 6 * width / 8, y: height / 2 }
    };

    // X locations of the zipcode titles.
    var zipcodeTitlesX = {
        '02109': 1 * width / 8 - 15,
        '02125': 2 * width / 8 - 10,
        '02127': 3 * width / 8 - 5,
        '02118': 4 * width / 8 + 5,
        '02128': 5 * width / 8 + 10,
        // '02228': 6 * width / 8 + 15,
    };

    // @v4 strength to apply to the position forces
    var forceStrength = 0.03;

    // These will be set in create_nodes and create_vis
    var svg = null;
    var bubbles = null;
    var nodes = [];

    function charge(d) {
        return -Math.pow(d.radius, 2) * forceStrength;
    }

    var simulation = d3.forceSimulation()
        .velocityDecay(0.2)
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
            d.id = d.zipcode + d.sector;
            d.group = d.sector;
            d.color = fillColor(d.sector);

            return d;

            // return {
            //     id: d.zipcode + d.sector,
            //     radius: radiusScale(+d.est),
            //     value: +d.est,
            //     est: +d.est,
            //     color: fillColor(d.sector),
            //     zipcode: d.zipcode,
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
            .duration(2000)
            .attr('r', function (d) { return d.radius; });

        simulation.nodes(nodes);

        // Set initial layout to single group.
        groupBubbles();
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
        var filteredData = data.filter(function (d) { return d.year == d3.select("#yearSlider").node().value; });

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

        // Loop through the filteredData array and sum up the number of establishments for each size of business ('Small', 'Medium', 'Large', 'Unknown')
        filteredData.forEach(function (d) {
            // for each size of business, add the number of establishments to the sum
            sumEst['Small'] = (sumEst['Small'] || 0) + d.Small;
            sumEst['Medium'] = (sumEst['Medium'] || 0) + d.Medium;
            sumEst['Large'] = (sumEst['Large'] || 0) + d.Large;
            sumEst['Unknown'] = (sumEst['Unknown'] || 0) + d.Unknown;
        });

        // Add total
        sumEst['est'] = sumEst['Small'] + sumEst['Medium'] + sumEst['Large'] + sumEst['Unknown'];
        sumEst['year'] = d3.select("#yearSlider").node().value;

        // TODO: hacky, but add zipcode and sector to sumEst to match the format of the other data for the tooltip
        sumEst['zipcode'] = 'All';
        sumEst['sector'] = 'All';

        console.log('sumEst', sumEst);

        // Create a new pie chart with the sum of establishments for each sector
        createPieChart(sumEst, 225, 225);

        // Reset the pieChartZipcode and pieChartSector
        pieChartZipcode = null;
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

        // Set the pie chart zipcode and sector
        pieChartZipcode = d.zipcode;
        pieChartSector = d.sector;

        const rowData = [
            // { size: '1-4', est: +d.n1_4 },
            // { size: '5-9', est: +d.n5_9 },
            // { size: '10-19', est: +d.n10_19 },
            // { size: '20-49', est: +d.n20_49 },
            // { size: '50-99', est: +d.n50_99 },
            // { size: '100-249', est: +d.n100_249 },
            // { size: '250-499', est: +d.n250_499 },
            // { size: '500-999', est: +d.n500_999 },
            // { size: '1000+', est: +d.n1000 },
            // { size: 'Small', subest: +d.n1_4 + +d.n5_9 + +d.n10_19, sector: d.sector, zipcode: d.zipcode, year: d.year, est: d.est },
            // { size: 'Medium', subest: +d.n20_49 + +d.n50_99, sector: d.sector, zipcode: d.zipcode, year: d.year, est: d.est },
            // { size: 'Large', subest: +d.n100_249 + +d.n250_499 + +d.n500_999 + +d.n1000, sector: d.sector, zipcode: d.zipcode, year: d.year, est: d.est },
            // { size: 'Unknown', subest: +d.est - (+d.n1_4 + +d.n5_9 + +d.n10_19 + +d.n20_49 + +d.n50_99 + +d.n100_249 + +d.n250_499 + +d.n500_999 + +d.n1000), sector: d.sector, zipcode: d.zipcode, year: d.year, est: d.est }
            { size: 'Small', subest: d.Small, sector: d.sector, zipcode: d.zipcode, year: d.year, est: d.est },
            { size: 'Medium', subest: d.Medium, sector: d.sector, zipcode: d.zipcode, year: d.year, est: d.est },
            { size: 'Large', subest: d.Large, sector: d.sector, zipcode: d.zipcode, year: d.year, est: d.est },
            { size: 'Unknown', subest: d.Unknown, sector: d.sector, zipcode: d.zipcode, year: d.year, est: d.est },
        ];

        console.log('rowData', rowData);

        // Order the data by size of business (order: Small, Medium, Large, Unknown)
        order = ['Small', 'Medium', 'Large', 'Unknown'];
        rowData.sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size));

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
                const opacity = 0.2 + (0.95 / (rowData.length - 1)) * i; // Adjust opacity calculation
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
        if (pieChartZipcode && pieChartSector) {
            // Find the bubble in filteredData that matches the pie chart zipcode and sector AND the year
            const d = nodes.find(d => d.zipcode === pieChartZipcode && d.sector === pieChartSector);

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
        bubbles
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
    }

    /*
     * Provides a x value for each node to be used with the split by year
     * x force.
     */
    function nodeZipcodePos(d) {
        // console.log(d);
        // console.log(d.zipcode);
        // console.log(zipcodeCenters[d.zipcode]);
        // console.log(zipcodeCenters[d.zipcode].x);
        return zipcodeCenters[d.zipcode].x;
    }


    /*
     * Sets visualization in "single group mode".
     * The year labels are hidden and the force layout
     * tick function is set to move all nodes to the
     * center of the visualization.
     */
    function groupBubbles() {
        hideZipcodeTitles();

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
        showZipcodeTitles();

        // @v4 Reset the 'x' force to draw the bubbles to their year centers
        simulation.force('x', d3.forceX().strength(forceStrength).x(nodeZipcodePos));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
    }

    /*
     * Hides Zipcode title displays.
     */
    function hideZipcodeTitles() {
        svg.selectAll('.year').remove();
    }

    /*
     * Shows Zipcode title displays.
     */
    function showZipcodeTitles() {
        // Another way to do this would be to create
        // the year texts once and then just hide them.
        var yearsData = d3.keys(zipcodeTitlesX);
        var years = svg.selectAll('.year')
            .data(yearsData);

        years.enter().append('text')
            .attr('class', 'year')
            .attr('x', function (d) { return zipcodeTitlesX[d]; })
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(function (d) { return d; });
    }

    function getSharedTooltipContent(d) {
        // console.log("getting shared tooltip content");
        // console.log(d);
        // Describe the tooltip content: sector, number of establishments, zipcode, year, and x/y
        var content = '<span class="name">Sector: </span><span class="value">' +
            d.sector + '</span>' + '<br/>' + '<span class="name">Zipcode: </span><span class="value">' +
            d.zipcode + '</span>' + '<br/>' + '<span class="name">Year: </span><span class="value">' + d.year + '</span>' + '</br><span class="name">Total Establishments: </span><span class="value">' +
            d.est + '</span>';

        return content;
    }

    function showBubbleDetail(d) {
        // console.log(d);

        // change outline to indicate hover state.
        d3.select(this).attr('stroke', 'black');

        // Describe the tooltip content: sector, number of establishments, zipcode, year, and x/y
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
            } else {
                return 'Unknown Number of Employees';
            }
        }

        // Describe the tooltip content: sector, zipcode, year, and description of size of business
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
        console.log('filteredData', filteredData);

        // Update the existing nodes' data with filtered data
        nodes = createNodes(filteredData);

        // Update the bubbles data
        var bubbles = svg.selectAll('.bubble');

        // Set the data by joining the nodes with the data
        bubbles = bubbles.data(nodes, function (d) { return d.id; });

        // Remove bubbles that no longer exist in the filtered data
        bubbles.exit().remove();

        // Enter new bubbles
        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r', function (d) { return 0; }) // Set initial radius
            .attr('fill', function (d) { return d.color; })
            .attr('stroke', function (d) { return d3.rgb(d.color).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showBubbleDetail)
            .on('mouseout', hideBubbleDetail);

        // Merge the original empty selection and the enter selection
        bubbles = bubbles.merge(bubblesE);

        // Update the x and y properties of the nodes based on the current positions of bubbles
        bubbles.each(function (d, i) {
            var cx = +d3.select(this).attr('cx');
            var cy = +d3.select(this).attr('cy');
            nodes[i].x = cx;
            nodes[i].y = cy;
        });

        // Make sure the length of the nodes array is the same as the length of the bubbles array
        console.log('nodes', nodes.length);
        console.log('bubbles', bubbles.size());


        // Transition existing bubbles to new positions
        bubbles.transition()
            .duration(100)
            .attr('cx', function (d) { console.log(d.x); return d.x; })
            .attr('cy', function (d) { return d.y; })
            .attr('r', function (d) { return d.radius; });

        // Set the simulation's nodes to our newly created nodes array.
        simulation.nodes(nodes);

        // Restart the simulation
        simulation.alpha(1).restart();
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

    // remove zip 02228
    rawData = rawData.filter(function (d) { return d.zip != '02228'; });

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

    data = rawData;

    initialize(2010, data); // initial year to be displayed when page loads
}

function initialize(year, data) {
    // Load data and initialize visualization

    uniqueSectors = [...new Set(data.map(d => d.sector))];
    uniqueZips = [...new Set(data.map(d => d.zip))];

    numUniqueX = uniqueSectors.length * uniqueZips.length;

    randomXArray = Array.from({ length: numUniqueX }, () => Math.random() * 900);

    randomYArray = Array.from({ length: numUniqueX }, () => Math.random() * 800);

    maxEstablishments = d3.max(data, function (d) { return +d.est; });

    radiusScale = d3.scalePow()
        .exponent(0.5)
        .range([5, 30])
        .domain([0, maxEstablishments]);

    fillColor = d3.scaleOrdinal()
        .domain(uniqueSectors)
        .range(d3.schemeCategory20);
    // Parse the data, pass in the unique sectors and unique zipcodes
    parsedData = data.map(function (d) { return parseData(d); });

    console.log('parsedData', parsedData);

    var filteredData = parsedData.filter(function (d) { return d.year === year; });

    myBubbleChart('#vis', filteredData);
    myBubbleChart.createPieChartAll();
}

function update(year, data) {
    uniqueSectors = [...new Set(data.map(d => d.sector))];
    uniqueZips = [...new Set(data.map(d => d.zip))];

    // Parse the data, pass in the unique sectors and unique zipcodes
    parsedData = data.map(function (d) { return parseData(d); });

    console.log('parsedData', parsedData);

    var filteredData = parsedData.filter(function (d) { return d.year === year; });

    myBubbleChart.updateBubbles(filteredData);

    myBubbleChart.updatePieChart();

}

d3.select("#yearSlider")
    .on("input", function () {
        var selectedYear = this.value;

        // convert selectedZipcode to a number
        selectedYear = +selectedYear;

        console.log('selected', selectedYear);

        // Update the chart with the selected year
        update(selectedYear, data);

        // Update the year displayed next to the slider
        d3.select("#selectedYear").text(selectedYear);
    });

function getXY(d) {
    // Maps sector/zipcode to x position

    var xMap = {};

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
        year: +d.year,
        sector: d.sector,
        est: +d.est,
        zipcode: d.zip,
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

