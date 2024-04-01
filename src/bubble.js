// set the dimensions and margins of the graph
const width = 460
const height = 460

const initialYear = 2019;
const zipCode = '02118';

// create a tooltip
const Tooltip = d3.select("#my_dataviz")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

function initialize() {
    // Initial data load for default year
    updateBubbles(initialYear);

}

function updateBubbles(year) {
    // Read data
    d3.csv("../data/all_data.csv").then(function (data) {

        // Filter a bit the data by year; TODO: eventually make this dynamic 
        filteredData = data.filter(function (d) { return d.year == year; })

        // Map the data to an array of objects
        // est should be numbers
        filteredData = filteredData.map(function (d) {
            return {
                sector: d.sector,
                est: +d.est,
                zipcode: d.zip,
            };
        });

        console.log(filteredData);

        // Filter by zipcode
        filteredData = filteredData.filter(function (d) { return d.zipcode == zipCode; })

        // Color palette for continents?
        const color = d3.scaleOrdinal()
            .domain(["Asia", "Europe", "Africa", "Oceania", "Americas"])
            .range(d3.schemeSet1);

        minEst = d3.min(data, function (d) { return d.est; })
        maxEst = d3.max(data, function (d) { return d.est; })

        console.log(minEst);
        console.log(maxEst);

        // Size scale for countries
        const size = d3.scaleLinear()
            .domain([minEst, maxEst])
            .range([7, 15])  // circle will be between 7 and 55 px wide



        // Three function that change the tooltip when user hover / move / leave a cell
        const mouseover = function (event, d) {
            Tooltip
                .style("opacity", 1)
        }
        const mousemove = function (event, d) {
            Tooltip
                .html('<u>' + d.sector + '</u>' + "<br>" + d.est + " establishments")
                .style("left", (event.x / 2 + 20) + "px")
                .style("top", (event.y / 2 - 30) + "px")
        }
        var mouseleave = function (event, d) {
            Tooltip
                .style("opacity", 0)
        }

        // Initialize the circle: all located at the center of the svg area
        var node = svg.append("g")
            .selectAll("circle")
            .data(filteredData)
            .join("circle")
            .attr("class", "node")
            .attr("r", d => size(d.est))
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .style("fill", d => color(d.sector))
            .style("fill-opacity", 0.8)
            .attr("stroke", "black")
            .style("stroke-width", 1)
            .on("mouseover", mouseover) // What to do when hovered
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .call(d3.drag() // call specific function when circle is dragged
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Features of the forces applied to the nodes:
        const simulation = d3.forceSimulation()
            .force("center", d3.forceCenter().x(width / 2).y(height / 2)) // Attraction to the center of the svg area
            .force("charge", d3.forceManyBody().strength(.1)) // Nodes are attracted one each other of value is > 0
            .force("collide", d3.forceCollide().strength(0.5).radius(function (d) { return size(d.est) + 3; }).iterations(1)) // Force that avoids circle overlapping

        // Apply these forces to the nodes and update their positions.
        // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
        simulation
            .nodes(filteredData)
            .on("tick", function (d) {
                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
            });

        // What happens when a circle is dragged?
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(.03).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(.03);
            d.fx = null;
            d.fy = null;
        }

    })
}

// Event listener for slider input
document.getElementById("yearSlider").addEventListener("input", function () {
    // Get the value of the slider
    var selectedYear = +this.value;

    // Update the displayed year
    document.getElementById("selectedYear").textContent = selectedYear;

    // Call readData function with the selected year
    updateData(selectedYear);
});

function updateData(selectedYear) {

    // Remove the previous bubble chart
    d3.selectAll("circle").remove();

    // Call the initialize function with the selected year
    updateBubbles(selectedYear);
}

initialize();