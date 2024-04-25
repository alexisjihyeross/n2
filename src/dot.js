// Store the original data of 2010 for sectors
var lightGreenColor = "#00A36C";
var lightGrayColor = "#989898";
var lightRedColor = "#E3735E";

var originalDataByNeighborhood = {};

function expandData(data) {
    var expandedData = [];
    data.forEach(function (d) {
        var numDots = d.est;
        for (var i = 0; i < numDots; i++) {
            var dCopy = Object.assign({}, d);
            dCopy.index = i;
            expandedData.push(dCopy);
        }
    });
    return expandedData;
}

d3.csv("../data/all_data.csv", function (error, data) {
    if (error) throw error;

    var width = 1200;
    var height = 800;

    var svg = d3.select("#vis")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var matrixGroup = svg.append("g");

    var yearSlider = d3.select("#yearSlider");
    yearSlider.on("input", updateVisualization);

    var neighborhoodDropdown = d3.select("#neighborhood-dropdown");
    neighborhoodDropdown.on("change", updateNeighborhood);

    var matrix = [];

    data = expandData(data);

    data.forEach(function (d) {
        d.est = +d.est;
        d.year = +d.year;
        if (!matrix[d.year]) matrix[d.year] = {}
        if (!matrix[d.year][d.sector]) matrix[d.year][d.sector] = []
        matrix[d.year][d.sector].push(d);

        if (d.year === 2010) {
            if (!originalDataByNeighborhood[d.neighborhood]) {
                originalDataByNeighborhood[d.neighborhood] = {};
            }
            if (!originalDataByNeighborhood[d.neighborhood][d.sector]) {
                originalDataByNeighborhood[d.neighborhood][d.sector] = d.est;
            }
        }
    });

    updateVisualization();

    function updateNeighborhood() {
        yearSlider.property("value", 2010);
        // remove all elements with dot class
        matrixGroup.selectAll(".dot").remove();
        updateVisualization();
    }

    function updateVisualization() {
        var selectedYear = yearSlider.property("value");
        d3.select("#selectedYear").text(selectedYear);

        var selectedNeighborhood = neighborhoodDropdown.property("value");
        console.log('selectedNeighborhood: ', selectedNeighborhood);

        var yearData = matrix[selectedYear] || {};

        if (selectedNeighborhood !== "All") {
            yearData = Object.keys(yearData).reduce(function (acc, sector) {
                acc[sector] = yearData[sector].filter(function (d) {
                    return d.neighborhood === selectedNeighborhood;
                });
                return acc;
            }, {});
        }

        var sectors = ['Leisure and Hospitality', 'Financial Activities', 'Trade, Transportation, and Utilities', 'Education and Health Services', 'Professional and Business Services'];

        // just consider Trade, Transportation, and Utilities
        // var sectors = ['Trade, Transportation, and Utilities'];

        var countAll = 0;

        sectors.forEach(function (sector, col) {
            var sectorData = yearData[sector];

            if (!Array.isArray(sectorData) || !sectorData.length) {
                return;
            }

            // var group = matrixGroup.selectAll(".group." + sector.replace(/ /g, "_"))
            // .data([sector]);
            // var group = matrixGroup.selectAll(".group")
            //     .data([sector], function (sector) { return sector; });

            // var enterGroup = group.enter()
            //     .append("g")
            //     .attr("class", "group " + sector.replace(/ /g, "_"));

            var group = matrixGroup.selectAll(".group")
                // Bind data using a key function to ensure each group has a unique sector key
                .data([sector], function (sector) { return sector; });

            var enterGroup = group.enter()
                .append("g")
                .attr("class", function (d) { return "group " + d.replace(/ /g, "_"); });

            console.log('enterGroup: ', enterGroup.size());

            var colSize = 225;
            var numPerRow = 20;
            var spaceBetween = 10;
            var LeftPadding = 50;

            var rad = 4;


            // Adding the neighborhood headers here
            enterGroup.append("text")
                .attr("class", "header")
                .attr("x", function () { return (col * colSize + numPerRow * 5) + 10; })
                .attr("y", 20)
                .text(sector)
                // center the text
                .attr("text-anchor", "middle")
                .attr("font-size", "14px");

            var exitGroup = group.exit()
            console.log('exitGroup: ', exitGroup.size());
            // TODO: don't understand why this is not working; if uncommented, it removes groups (shouldn't)
            // exitGroup.remove();

            console.log('sectorData: ', sectorData);

            var dots = group.merge(enterGroup).selectAll(".dot")
                .data(sectorData, function (d, i) {
                    var id = d.neighborhood + "-" + d.sector + "-" + d.index;
                    return id;
                });
            console.log('dots: ', dots.size());

            var enterDots = dots.enter()
                .append("circle")
                .style("fill", "transparent")
                .attr("class", "dot")
                .attr("cx", function (d, i) {
                    // console.log('Entering dot: ', d);
                    return (col * colSize) + (i % numPerRow) * spaceBetween + 15;
                })
                .attr("cy", function (d, i) { return 40 + 10 * Math.floor(i / numPerRow); })
                .style("stroke", "none")
                .attr("r", 3);

            console.log('num enter dots', enterDots.size());

            var exitDots = dots.exit();
            console.log('num exit dots', exitDots.size());

            var exitDotsToColor =
                exitDots.filter(function (d, i) {
                    var originalEst = originalDataByNeighborhood[selectedNeighborhood][d.sector];
                    return d.index < originalEst;
                });

            console.log('num exit dots to color', exitDotsToColor.size());
            exitDotsToColor
                .each(function (d, i) { // for each missing dot

                    var parent = d3.select(this.parentNode);
                    var cx = +d3.select(this).attr('cx');
                    var cy = +d3.select(this).attr('cy');

                    // Create the "X" with two lines 
                    parent.append("line")
                        .attr("x1", cx - 3)
                        .attr("y1", cy - 3)
                        .attr("x2", cx + 3)
                        .attr("y2", cy + 3)
                        .attr("class", "dot")
                        .style("stroke", lightRedColor)
                        .style("stroke-width", "2");

                    parent.append("line")
                        .attr("x1", cx - 3)
                        .attr("y1", cy + 3)
                        .attr("x2", cx + 3)
                        .attr("y2", cy - 3)
                        .attr("class", "dot")
                        .style("stroke", lightRedColor)
                        .style("stroke-width", "2");

                })
                .remove()
                .style("fill", lightRedColor);  // Change color to red

            var exitDotsToRemove = exitDots
                .filter(function (d, i) {
                    var originalEst = originalDataByNeighborhood[selectedNeighborhood][d.sector];
                    return d.index >= originalEst;
                });
            console.log('num exit dots to remove', exitDotsToRemove.size());
            exitDotsToRemove
                .style("opacity", 0)
                .remove();

            dots.merge(enterDots)
                // .transition()
                // .duration(1000)
                .style("fill", function (d, i) {
                    var est2010 = originalDataByNeighborhood[selectedNeighborhood][d.sector];
                    if (i >= est2010) {
                        return lightGreenColor;
                    }
                    else {
                        return lightGrayColor;
                    }
                });
            countAll += sectorData.length
        });
    }
});