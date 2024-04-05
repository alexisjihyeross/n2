var uniqueSectors;
var uniqueZips;

var randomXArray;
var randomYArray;

var maxEstablishments;

var radiusScale;
var fillColor;

/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
function bubbleChart() {
    console.log('bubbleChart function called');
    // Constants for sizing
    var width = 800;
    var height = 400;

    // tooltip for mouseover functionality
    var tooltip = floatingTooltip('gates_tooltip', 240);

    // Locations to move bubbles towards, depending
    // on which view mode is selected.
    var center = { x: width / 2, y: height / 2 };

    const pieSvg = d3.select("#pieChart")
    .style("width", width + "px") // Set the width using style
    .style("height", height + "px") // Set the height using style
    .style("float", "right"); // Float the pie chart to the right

    // var yearCenters = {
    //     '02109': { x: width / 3, y: height / 2 },
    //     '02125': { x: width / 2, y: height / 2 },
    //     '02127': { x: 2 * width / 3, y: height / 2 }
    // };

    // Create yearCenters for 02109, 02125, 02127, "02118", "02128", "02228"
    var yearCenters = {
        '02109': { x: 1 * width / 8, y: height / 2 },
        '02125': { x: 2 * width / 8, y: height / 2 },
        '02127': { x: 3 * width / 8, y: height / 2 },
        '02118': { x: 4 * width / 8, y: height / 2 },
        '02128': { x: 5 * width / 8, y: height / 2 },
        // '02228': { x: 6 * width / 8, y: height / 2 }
    };

    // // X locations of the year titles.
    // var yearsTitleX = {
    //     '02109': 160,
    //     '02125': width / 2,
    //     '02127': width - 160
    // };

    // X locations of the year titles.
    var yearsTitleX = {
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

    // Charge function that is called for each node.
    // As part of the ManyBody force.
    // This is what creates the repulsion between nodes.
    //
    // Charge is proportional to the diameter of the
    // circle (which is stored in the radius attribute
    // of the circle's associated data.
    //
    // This is done to allow for accurate collision
    // detection with nodes of different sizes.
    //
    // Charge is negative because we want nodes to repel.
    // @v4 Before the charge was a stand-alone attribute
    //  of the force layout. Now we can use it as a separate force!
    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }

    // Here we create a force layout and
    // @v4 We create a force simulation now and
    //  add forces to it.
    var simulation = d3.forceSimulation()
        .velocityDecay(0.2)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

    // @v4 Force starts up automatically,
    //  which we don't want as there aren't any nodes yet.
    simulation.stop();



    // Nice looking colors - no reason to buck the trend
    // @v4 scales now have a flattened naming scheme
    // var fillColor = d3.scaleOrdinal()
    //     .domain(['low', 'medium', 'high'])
    //     .range(['#d84b2a', '#beccae', '#7aa25c']);


    /*
     * This data manipulation function takes the raw data from
     * the CSV file and converts it into an array of node objects.
     * Each node will store data and visualization values to visualize
     * a bubble.
     *
     * rawData is expected to be an array of data objects, read in from
     * one of d3's loading functions like d3.csv.
     *
     * This function returns the new node array, with a node in that
     * array for each element in the rawData input.
     */
    function createNodes(rawData) {
        // Use the max total_amount in the data as the max in the scale's domain
        // note we have to ensure the total_amount is a number.

        // Sizes bubbles based on area.
        // @v4: new flattened scale names.


        // Use map() to convert raw data into node data.
        // Checkout http://learnjsdata.com/ for more on
        // working with data.
        var myNodes = rawData.map(function (d) {
            return {
                id: d.zipcode + d.sector,
                radius: radiusScale(+d.est),
                value: +d.est,
                color: fillColor(d.sector),
                zipcode: d.zipcode,
                year: +d.year,
                sector: d.sector,
                group: d.sector,
                n1_4: +d.n1_4,
                n5_9: +d.n5_9,
                n10_19: +d.n10_19,
                n20_49: +d.n20_49,
                n50_99: +d.n50_99,
                n100_249: +d.n100_249,
                n250_499: +d.n250_499,
                n500_999: +d.n500_999,
                n1000: +d.n1000,
                // name: d.grant_title,
                // org: d.organization,
                // group: d.group,
                // year: d.start_year,
                x: d.x,
                y: d.y,
            };
        });

        // sort them to prevent occlusion of smaller nodes.
        myNodes.sort(function (a, b) { return b.value - a.value; });
        console.log('nodes', myNodes)
        return myNodes;
    }

    /*
     * Main entry point to the bubble chart. This function is returned
     * by the parent closure. It prepares the rawData for visualization
     * and adds an svg element to the provided selector and starts the
     * visualization creation process.
     *
     * selector is expected to be a DOM element or CSS selector that
     * points to the parent element of the bubble chart. Inside this
     * element, the code will add the SVG continer for the visualization.
     *
     * rawData is expected to be an array of data objects as provided by
     * a d3 loading function like d3.csv.
     */
    var chart = function chart(selector, rawData) {
        // convert raw data into nodes data
        nodes = createNodes(rawData);
        // Create a SVG element inside the provided selector
        // with desired size.
        svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Bind nodes data to what will become DOM elements to represent them.
        bubbles = svg.selectAll('.bubble')
            .data(nodes, function (d) { return d.id; });

        // Create new circle elements each with class `bubble`.
        // There will be one circle.bubble for each object in the nodes array.
        // Initially, their radius (r attribute) will be 0.
        // @v4 Selections are immutable, so lets capture the
        //  enter selection to apply our transtition to below.
        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r', 0)
            .attr('fill', function (d) { return d.color; })
            .attr('stroke', function (d) { return d3.rgb(d.color).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showDetail)
            .on('mouseout', hideDetail)
            .on('click', function(event, d) {clicked(event, d);});

        // @v4 Merge the original empty selection and the enter selection
        bubbles = bubbles.merge(bubblesE);

        // Fancy transition to make bubbles appear, ending with the
        // correct radius
        bubbles.transition()
            .duration(2000)
            .attr('r', function (d) { return d.radius; });


        // Set the simulation's nodes to our newly created nodes array.
        // @v4 Once we set the nodes, the simulation will start running automatically!

        // Log first node before simulation
        console.log('First node before simulation', nodes[0]);

        simulation.nodes(nodes);

        // Log first node after simulation
        console.log('First node after simulation', nodes[0]);

        // Set initial layout to single group.
        groupBubbles();
    };
    
    function clicked(d) {
        // Remove any existing pie chart
        pieSvg.selectAll("*").remove();
    
        // Extract data for the clicked bubble
        const rowData = [
            { size: '1-4', est: +d.n1_4 },
            { size: '5-9', est: +d.n5_9 },
            { size: '10-19', est: +d.n10_19 },
            { size: '20-49', est: +d.n20_49 },
            { size: '50-99', est: +d.n50_99 },
            { size: '100-249', est: +d.n100_249 },
            { size: '250-499', est: +d.n250_499 },
            { size: '500-999', est: +d.n500_999 },
            { size: '1000+', est: +d.n1000 }
        ];

        // Set up dimensions for the pie chart
        const pieWidth = 300;
        const pieHeight = 300;
        const radius = Math.min(pieWidth, pieHeight) / 2;
    
        // Create SVG for the pie chart
        const svgPie = pieSvg.append("svg")
            .attr("width", pieWidth)
            .attr("height", pieHeight)
            .append("g")
            .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);
    
        // Set up the pie layout
        const pieLayout = d3.pie()
            .value(d => d.est);
    
        // Set up the arc generator
        const arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);
    
        // Get the color of the clicked bubble
        const baseColor = d.color;
    
        // Generate arcs and bind pie data to them
        const arcs = svgPie.selectAll(".arc")
            .data(pieLayout(rowData))
            .enter()
            .append("g")
            .attr("class", "arc");
    
        // Append paths for the arcs with varying opacity
        arcs.append("path")
        .attr("d", arcGenerator)
        .attr("fill", (d, i) => {
            const opacity = 0.1 + (0.9 / rowData.length) * i; // Adjust opacity calculation
            return d3.rgb(baseColor).toString().replace(")", `, ${opacity})`);
        })
        .attr("stroke", "black") // Add stroke color
        .style("stroke-width", "2px") // Set stroke width
        .style("opacity", 1) // Fade in the arcs
        .transition() // Apply transition for better visual effect
        .duration(1000)
        .attrTween("d", function(d) {
            var interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
            return function(t) {
                return arcGenerator(interpolate(t));
            };
        });
    
        // // Append text labels for the arcs
        arcs.append("text")
        .attr("transform", d => `translate(${arcGenerator.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => {
            if (!isNaN(d.data.est) && d.data.est !== 0) {
                return `${d.data.size}: ${d.data.est}`;
            } else {
                return ''; // Return empty string for NaN or zero values
            }
        });
        //Append text labels for the arcs


    }
    /*
     * Callback function that is called after every tick of the
     * force simulation.
     * Here we do the acutal repositioning of the SVG circles
     * based on the current x and y values of their bound node data.
     * These x and y values are modified by the force simulation.
     */
    function ticked() {
        bubbles
            .each(function (d) {
                d.previousX = d.x; // Store the previous x position
                d.previousY = d.y; // Store the previous y position
            })
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
    }

    /*
     * Provides a x value for each node to be used with the split by year
     * x force.
     */
    function nodeYearPos(d) {
        // console.log(d);
        // console.log(d.zipcode);
        // console.log(yearCenters[d.zipcode]);
        // console.log(yearCenters[d.zipcode].x);
        return yearCenters[d.zipcode].x;
    }


    /*
     * Sets visualization in "single group mode".
     * The year labels are hidden and the force layout
     * tick function is set to move all nodes to the
     * center of the visualization.
     */
    function groupBubbles() {
        hideYearTitles();

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
        showYearTitles();

        // @v4 Reset the 'x' force to draw the bubbles to their year centers
        simulation.force('x', d3.forceX().strength(forceStrength).x(nodeYearPos));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
    }

    /*
     * Hides Year title displays.
     */
    function hideYearTitles() {
        svg.selectAll('.year').remove();
    }

    /*
     * Shows Year title displays.
     */
    function showYearTitles() {
        // Another way to do this would be to create
        // the year texts once and then just hide them.
        var yearsData = d3.keys(yearsTitleX);
        var years = svg.selectAll('.year')
            .data(yearsData);

        years.enter().append('text')
            .attr('class', 'year')
            .attr('x', function (d) { return yearsTitleX[d]; })
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(function (d) { return d; });
    }


    /*
     * Function called on mouseover to display the
     * details of a bubble in the tooltip.
     */
    function showDetail(d) {
        // change outline to indicate hover state.
        d3.select(this).attr('stroke', 'black');

        // Describe the tooltip content: sector, number of establishments, zipcode, year, and x/y
        var content = '<span class="name">Sector: </span><span class="value">' +
            d.sector + '</span>' + '<br/>' + '<span class="name">Establishments: </span><span class="value">' +
            d.value + '</span>' + '<br/>' + '<span class="name">Zipcode: </span><span class="value">' +
            d.zipcode + '</span>' + '<br/>' + '<span class="name">Year: </span><span class="value">' +
            d.year + '</span>' + '<br/>' + '<span class="name">X: </span><span class="value">' +
            d.x + '</span>' + '<br/>' + '<span class="name">Y: </span><span class="value">' +
            d.y + '</span>';
        // var content = '<span class="name">Zipcode: </span><span class="value">' + d.zipcode + '</span>' + '<br/>' + '<span class="name">Establishments: </span><span class="value">' + d.value + '</span>' + '<br/>' + '<span class="name">Year: </span><span class="value">' + d.year + '</span>';
        // var content = '<span class="name">Title: </span><span class="value">' +
        //     d.name +
        //     '</span><br/>' +
        //     '<span class="name">Amount: </span><span class="value">$' +
        //     addCommas(d.value) +
        //     '</span><br/>' +
        //     '<span class="name">Year: </span><span class="value">' +
        //     d.year +
        //     '</span>';

        tooltip.showTooltip(content, d3.event);
    }

    /*
     * Hides tooltip
     */
    function hideDetail(d) {
        // reset outline
        d3.select(this)
            .attr('stroke', d3.rgb(d.color).darker());

        tooltip.hideTooltip();
    }

    /*
     * Externally accessible function (this is attached to the
     * returned chart function). Allows the visualization to toggle
     * between "single group" and "split by year" modes.
     *
     * displayName is expected to be a string and either 'year' or 'all'.
     */
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
        // .data(nodes);

        // Remove bubbles that no longer exist in the filtered data
        bubbles.exit().remove();

        console.log('updating nodes...');

        // Enter new bubbles
        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r', function (d) { return 0; }) // Set initial radius
            .attr('fill', function (d) { return d.color; })
            .attr('stroke', function (d) { return d3.rgb(d.color).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showDetail)
            .on('mouseout', hideDetail);

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
            .duration(1000)
            // .attr('cx', function (d) { return d.x; })
            // .attr('cy', function (d) { return d.y; })
            .attr('r', function (d) { return d.radius; });

        // Set the simulation's nodes to our newly created nodes array.
        simulation.nodes(nodes);

        // Restart the simulation
        simulation.alpha(1).restart();
    };


    // return the chart function from closure.
    return chart;
}





/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
// function display(error, data) {
//     if (error) {
//         console.log(error);
//     }

//     console.log(data);

//     // Filter by year
//     // data = data.filter(function (d) { return d.year == 2012; });

//     myBubbleChart('#vis', data);
// }

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
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

/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }

    return x1 + x2;
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

    // Assign loaded data to the data variable. Now it is globally accessible.

    // console.log(data);

    // remove zip 02228
    rawData = rawData.filter(function (d) { return d.zip != '02228'; });

    data = rawData;
    console.log('data', data);

    initialize(2015, data); // initial year to be displayed when page loads
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
        // .exponent(0.5)
        .range([5, 50])
        .domain([0, maxEstablishments]);

    fillColor = d3.scaleOrdinal()
        .domain(uniqueSectors)
        .range(d3.schemeCategory20);
    // Parse the data, pass in the unique sectors and unique zipcodes
    parsedData = data.map(function (d) { return parseData(d); });

    console.log('parsedData', parsedData);

    var filteredData = parsedData.filter(function (d) { return d.year === year; });

    myBubbleChart('#vis', filteredData);
}

function update(year, data) {
    uniqueSectors = [...new Set(data.map(d => d.sector))];
    uniqueZips = [...new Set(data.map(d => d.zip))];

    // Parse the data, pass in the unique sectors and unique zipcodes
    parsedData = data.map(function (d) { return parseData(d); });

    console.log('parsedData', parsedData);

    var filteredData = parsedData.filter(function (d) { return d.year === year; });

    myBubbleChart.updateBubbles(filteredData);
}

d3.select("#yearSlider")
    .on("input", function () {
        var selectedYear = this.value;

        // convert selectedYear to a number
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

    // for (var i = 0; i < uniqueSectors.length; i++) {
    //     for (var j = 0; j < uniqueZips.length; j++) {
    //         sector = uniqueSectors[i];
    //         zip = uniqueZips[j];

    //         if (sector == d.sector && zip == d.zip) {
    //             x = randomXArray[index];
    //             y = randomYArray[index];

    //             console.log('x', x);
    //             console.log('sector', sector);
    //             console.log('zip', zip);
    //             // console.log('y', y);

    //             return { x: x, y: y };
    //         }
    //         index++;
    //     }
    // }

    for (var i = 0; i < uniqueSectors.length; i++) {
        sector = uniqueSectors[i];

        if (sector == d.sector) {
            x = randomXArray[index];
            y = randomYArray[index];

            // console.log('x', x);
            // console.log('sector', sector);
            // console.log('y', y);

            return { x: x, y: y };
        }
        index++;
    }

}

function parseData(d) {
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
        // x: Math.random() * 900,
        // y: Math.random() * 800
    };
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();