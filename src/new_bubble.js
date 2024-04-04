/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
function bubbleChart() {
    // Constants for sizing
    var width = 500;
    var height = 500;

    // tooltip for mouseover functionality
    var tooltip = floatingTooltip('gates_tooltip', 240);

    // Locations to move bubbles towards, depending
    // on which view mode is selected.
    var center = { x: width / 2, y: height / 2 };

    // Create SVG element for the pie chart
    const pieSvg = d3.select("#pieChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

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
        '02228': { x: 6 * width / 8, y: height / 2 }
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
        '02228': 6 * width / 8 + 15,
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
        var maxEstablishments = d3.max(rawData, function (d) { return +d.est; });

        // Sizes bubbles based on area.
        // @v4: new flattened scale names.
        var radiusScale = d3.scalePow()
            .exponent(0.5)
            .range([2, 25])
            .domain([0, maxEstablishments]);

        uniqueSectors = [...new Set(rawData.map(d => d.sector))];

        console.log(uniqueSectors);

        var fillColor = d3.scaleOrdinal()
            .domain(uniqueSectors)
            .range(d3.schemeCategory20);

        // Use map() to convert raw data into node data.
        // Checkout http://learnjsdata.com/ for more on
        // working with data.
        var myNodes = rawData.map(function (d) {
            return {
                // id: d.id,
                radius: radiusScale(+d.est),
                value: +d.est,
                color: fillColor(d.sector),
                zipcode: d.zip,
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
                x: Math.random() * 900,
                y: Math.random() * 800
            };
        });

        // sort them to prevent occlusion of smaller nodes.
        myNodes.sort(function (a, b) { return b.value - a.value; });

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
        simulation.nodes(nodes);

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
                const opacity = 0.2 + (0.8 / rowData.length) * i;
                return d3.rgb(baseColor).toString().replace(")", `, ${opacity})`);
            })
            .attr("stroke", "white")
            .style("stroke-width", "2px");
    
        // Append text labels for the arcs
        arcs.append("text")
            .attr("transform", d => `translate(${arcGenerator.centroid(d)})`)
            .attr("text-anchor", "middle")
            .text(d => `${d.data.size}: ${d.data.est}`);
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
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
    }

    /*
     * Provides a x value for each node to be used with the split by year
     * x force.
     */
    function nodeYearPos(d) {
        console.log(d.zipcode);
        console.log(yearCenters[d.zipcode]);
        console.log(yearCenters[d.zipcode].x);
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

        // Describe the tooltip content: sector, number of establishments, zipcode, and year
        var content = '<span class="name">Sector: </span><span class="value">' +
            d.sector + '</span>' + '<br/>' + '<span class="name">Establishments: </span><span class="value">' +
            d.value + '</span>' + '<br/>' + '<span class="name">Zipcode: </span><span class="value">' +
            d.zipcode + '</span>' + '<br/>' + '<span class="name">Year: </span><span class="value">' +
            d.year + '</span>';
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


    // return the chart function from closure.
    return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
    if (error) {
        console.log(error);
    }

    console.log(data);

    // Filter by year
    data = data.filter(function (d) { return d.year == 2012; });

    myBubbleChart('#vis', data);
}

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

