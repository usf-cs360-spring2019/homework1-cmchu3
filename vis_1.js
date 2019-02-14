
var processData = function(data) {
  let count = d3.map();

  for (row in data) {
    var neighborhood = data[row]["Analysis Neighborhood"];

    // check if we have seen this letter before
    if (count.has(neighborhood)) {
      count.set(neighborhood, count.get(neighborhood) + 1);
    }
    else {
      count.set(neighborhood, 1);
    }
  }

  return count;
};

var drawScatterPlot = function(data) {
  let processed = processData(data);
  processed.remove(""); // get rid of null neighborhoods
  processed.remove("undefined"); // get rid of undefined neighborhoods

  let svg = d3.select("body").select("svg");

  let countMin = 0;
  let countMax = d3.max(processed.values());

  let margin = {
    top:    70,
    right:  15, // leave space for y-axis
    bottom: 50, // leave space for x-axis
    left:   180
  };

  // now we can calculate how much space we have to plot
  let bounds = svg.node().getBoundingClientRect();
  let plotWidth = bounds.width - margin.right - margin.left;
  let plotHeight = bounds.height - margin.top - margin.bottom;

  let numberScale = d3.scaleLinear()
    .domain([countMin, countMax])
    .rangeRound([0, plotWidth-margin.right])
    .nice(); // rounds the domain a bit for nicer output

  let sortedNeighbors = processed.entries().sort(function(x, y) {
    return d3.descending(x.value, y.value)
  });
  let dataPoints = [];
  for (let i = 0; i<sortedNeighbors.length; i++) {
    dataPoints.push([sortedNeighbors[i].key, sortedNeighbors[i].value]);
  };
  sortedNeighbors = d3.map(sortedNeighbors, function(d) {return d.key; });

  let neighborhoodScale = d3.scaleBand()
    .domain(sortedNeighbors.keys())
    .range([0, plotHeight])
    .paddingInner(5);

  let plot = svg.select("g#plot");

  if (plot.size() < 1) {
    // this is the first time we called this function
    // we need to steup the plot area
    plot = svg.append("g").attr("id", "plot");

    // notice in the "elements" view we now have a g element!

    // shift the plot area over by our margins to leave room
    // for the x- and y-axis
    plot.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }

  let xAxis = d3.axisBottom(numberScale);
  let yAxis = d3.axisLeft(neighborhoodScale)
    .tickSize(0);

  // check if we have already drawn our axes
  if (plot.select("g#y-axis").size() < 1) {
    let xGroup = plot.append("g").attr("id", "x-axis");

    // the drawing is triggered by call()
    xGroup.call(xAxis);

    // notice it is at the top of our svg
    // we need to translate/shift it down to the bottom
    xGroup.attr("transform", "translate(0," + plotHeight + ")");

    // do the same for our y axix
    let yGroup = plot.append("g").attr("id", "y-axis");
    yGroup.call(yAxis);
    yGroup.attr("transform", "translate(0,0)");
  }
  else {
    // we need to do this so our chart updates
    // as we type new letters in our box
    plot.select("g#y-axis").call(yAxis);
  }

  var gridlines = d3.axisBottom(numberScale)
    .tickFormat("")
    .tickSize(-plotHeight);

  plot.append("g")
     .call(gridlines)
     .attr("transform", "translate(0," + plotHeight + ")")
     .attr("color", "#E2E2E2");

  svg.selectAll("circle")
		.data(dataPoints)
		.enter()
		.append("circle")
		.attr("cx", function(d) {
			return margin.left + numberScale(d[1]);
		})
		.attr("cy", function(d) {
			return margin.top + neighborhoodScale(d[0]);
		})
		.attr("r", 2)
		.attr("fill", "#4E79A7");

  svg.append("text")
    // .attr("id", "graph-title")
    .style("font-size", "25")
    .attr("y", margin.top/2)
    .attr("x", 10)
    .style("text-anchor", "start")
    .text("Neighborhoods by Number of Incidents");

  plot.append("text")
    // .attr("id", "x-axis-title")
    .style("font-size", "14")
    .attr("transform",
        "translate(" + (plotWidth/2) + " ,"
        + (plotHeight + 40) + ")")
    .style("text-anchor", "middle")
    .text("Total Number of Incidents");

  plot.append("text")
    // .attr("id", "y-axis-title")
    .style("font-size", "14")
    .attr("y", -24)
    .attr("x", 0)
    .attr("dy", "1em")
    .style("text-anchor", "end")
    .text("Analysis Neighborhood");

};
