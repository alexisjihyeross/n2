// Store the original data of 2010
var originalData = {};

// create function expandData to expand the data (e.g. if est for row is 3, then create 3 rows with the same data)
function expandData(data) {
    var expandedData = [];
    data.forEach(function (d) {
        var numDots = d.est;
        for (var i = 0; i < numDots; i++) {
            expandedData.push(d);
        }
    });
    return expandedData;
}

d3.csv("../data/all_data.csv", function (error, data) {
    if (error) throw error;

    var width = 800;
    var height = 600;

    var svg = d3.select("#vis")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var matrixGroup = svg.append("g");

    var yearSlider = d3.select("#yearSlider");
    yearSlider.on("input", updateVisualization);

    // Create listener for sector-dropdown
    var sectorDropdown = d3.select("#sector-dropdown");
    sectorDropdown.on("change", updateSector);

    var matrix = [];

    data = expandData(data);

    data.forEach(function (d) {
        d.est = +d.est;
        d.year = +d.year;
        if (!matrix[d.year]) matrix[d.year] = {}
        if (!matrix[d.year][d.neighborhood]) matrix[d.year][d.neighborhood] = []
        matrix[d.year][d.neighborhood].push(d);

        // Store the original data 
        if (d.year === 2010) {
            if (d.sector === sectorDropdown.property("value")) { // Only considering the selected sector's data
                if (!originalData[d.neighborhood]) {
                    originalData[d.neighborhood] = d.est; // Store only if entry doesn't exist
                } else if (originalData[d.neighborhood].est < d.est) {
                    originalData[d.neighborhood] += d.est; // Replace if entry exists and current establishment has higher count
                }
            }
        }
    });

    console.log('originalData: ', originalData);


    updateVisualization();

    function updateSector() {
        // reset slider
        yearSlider.property("value", 2010);
        updateVisualization();
    }

    function updateVisualization() {
        var selectedYear = yearSlider.property("value");
        d3.select("#selectedYear").text(selectedYear);

        var selectedSector = sectorDropdown.property("value");

        console.log('selectedSector: ', selectedSector);

        var yearData = matrix[selectedYear] || {};

        if (selectedSector !== "All") {
            yearData = Object.keys(yearData).reduce(function (acc, neighborhood) {
                acc[neighborhood] = yearData[neighborhood].filter(function (d) {
                    return d.sector === selectedSector;
                });
                return acc;
            }, {});
        }

        var neighborhoods = Object.keys(yearData);

        // Add and update dots
        neighborhoods.forEach(function (neighborhood, col) {
            var neighborhoodData = yearData[neighborhood];

            if (!Array.isArray(neighborhoodData) || !neighborhoodData.length) {
                return; // skips to the next iteration if data not exist
            }

            var group = matrixGroup.selectAll(".group." + neighborhood.replace(/ /g, "_"))
                .data([neighborhood]);



            var enterGroup = group.enter()
                .append("g")
                .attr("class", "group " + neighborhood.replace(/ /g, "_"));

            var colSize = 300;
            var numPerRow = 15;
            var spaceBetween = 11;
            var LeftPadding = 50;

            // Draw a line to represent the original number of businesses
            // var originalEst = originalData[neighborhood] ? Math.round(originalData[neighborhood] / numPerRow) : 0;

            var originalEst = originalData[neighborhood] ? originalData[neighborhood] : 0;

            console.log('originalEst: ', originalEst);

            var rad = 5; //define the radius of the dots globally

            var Y = Math.round((originalEst / numPerRow)) * 10;

            var X = (col * colSize) + (originalEst % numPerRow * (spaceBetween + 1)) + 1;
            console.log('Y: ', Y);
            console.log('X: ', X);

            enterGroup.append("line")
                .attr("class", "start-line")
                // .attr("x1", (col * colSize) + LeftPadding)
                .attr("y1", 5 + Y)
                // .attr("x2", (col * colSize) + numPerRow * spaceBetween + LeftPadding)
                .attr("x1", X)
                .attr("x2", X)
                .attr("y2", 10 + Y)
                .style("stroke-width", "1.5px")
                .style("stroke", "red")
                .style("fill", "none");

            // Adding the neighborhood headers here
            enterGroup.append("text")
                .attr("class", "header")
                .attr("x", function () { return (col * colSize + numPerRow * 5) + 10; })
                .attr("y", 20)
                .text(neighborhood)
                // center the text
                .attr("text-anchor", "middle")
                .attr("font-size", "20px");

            group.exit().remove();

            var dots = group.merge(enterGroup).selectAll(".dot")
                .data(neighborhoodData);

            var enterDots = dots.enter()
                .append("circle")
                .attr("class", "dot")
                .attr("r", 4) // setting default radius to 5
                .style("fill", "steelblue");

            dots.exit().remove();


            dots.merge(enterDots)
                // use the index of the neighborhood and multiply it by a constant
                // to space out columns (e.g., 200 pixels apart)
                .attr("cx", function (d, i) { return (col * colSize) + (i % numPerRow) * spaceBetween + 15; })
                .attr("cy", function (d, i) { return 40 + 10 * Math.floor(i / numPerRow); });
        });
    }
}); 