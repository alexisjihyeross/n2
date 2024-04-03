// set the dimensions and margins of the graph
const width = 460;
const height = 460;

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
    .style("padding", "5px");

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

let data = []; // Variable to store the loaded data

function initialize() {
    // Load data and initialize visualization
    d3.csv("../data/all_data.csv").then(function (csvData) {
        data = csvData;
        data = data.map(parseData);
        updateBubbles(initialYear);
    });
}

function parseData(d) {
    return {
        year: +d.year,
        sector: d.sector,
        est: +d.est,
        zipcode: d.zip,
    };
}

function updateBubbles(year) {
    // Filter the data by year and zipcode
    console.log(data);
    // const filteredData = data.filter(d => d.year == year && d.zipcode == zipCode);
    const filteredData = data.filter(d => d.year == year);

    console.log('updating Bubbles...');
    console.log(filteredData);

    // Color palette for sectors
    const color = d3.scaleOrdinal()
        .domain(["Asia", "Europe", "Africa", "Oceania", "Americas"])
        .range(d3.schemeSet1);

    const minEst = d3.min(filteredData, d => +d.est);
    const maxEst = d3.max(filteredData, d => +d.est);

    // Size scale for establishments
    const size = d3.scaleLinear()
        .domain([minEst, maxEst])
        .range([7, 15]);  // circle will be between 7 and 15 px wide

    // Update tooltip functions
    const mouseover = function (event, d) {
        Tooltip.style("opacity", 1);
    };
    const mousemove = function (event, d) {
        Tooltip
            .html('<u>' + d.sector + '</u>' + "<br>" + d.est + " establishments" + "<br>" + d.zipcode)
            .style("left", (event.x / 2 + 20) + "px")
            .style("top", (event.y / 2 - 30) + "px");
    };
    const mouseleave = function (event, d) {
        Tooltip.style("opacity", 0);
    };

    // Initialize circles
    const node = svg.selectAll(".node")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", d => size(d.est))
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .style("fill", d => color(d.sector))
        .style("fill-opacity", 0.8)
        .attr("stroke", "black")
        .style("stroke-width", 1)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Apply forces
    const simulation = d3.forceSimulation(filteredData)
        .force("center", d3.forceCenter().x(width / 2).y(height / 2))
        .force("charge", d3.forceManyBody().strength(0.1))
        .force("collide", d3.forceCollide().strength(0.5).radius(d => size(d.est) + 3).iterations(1))
        .on("tick", () => {
            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.03).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0.03);
        d.fx = null;
        d.fy = null;
    }
}

// Event listener for slider input
document.getElementById("yearSlider").addEventListener("input", function () {
    const selectedYear = +this.value;
    document.getElementById("selectedYear").textContent = selectedYear;
    updateBubbles(selectedYear);
});

initialize();
