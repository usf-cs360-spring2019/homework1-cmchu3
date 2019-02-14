
var processData = function(data) {
  let count = d3.map();

  for (row in data) {
    let time = data[row]["Incident Time"];

    if (time) {
      time = parseInt(time.slice(0,2));

      if (count.has(time)) {
        count.set(time, count.get(time) + 1);
      }
      else {
        count.set(time, 1);
      }
    }
  }

  return count;
};

var drawScatterPlot = function(data) {
  let processed = processData(data);
  let sortedPoints = processed.keys().sort(function(x, y) {
    return d3.ascending(parseInt(x), parseInt(y))
  });
  let dataPoints = [];
  for (let i = 0; i<sortedPoints.length; i++) {
    dataPoints.push({ "x": i, "y": processed.get(i)});
  };

  let svg = d3.select("body").select("svg");

  let countMin = 0;
  let countMax = d3.max(processed.values());

  let margin = {
    top:    60,
    right:  15,
    bottom: 50,
    left:   60
  };

  // now we can calculate how much space we have to plot
  let bounds = svg.node().getBoundingClientRect();
  let plotWidth = bounds.width - margin.right - margin.left;
  let plotHeight = bounds.height - margin.top - margin.bottom;

  let countScale = d3.scaleLinear()
    .domain([countMin, countMax])
    .rangeRound([plotHeight, 0])
    .nice();

  let timeScale = d3.scaleBand()
    .domain(sortedPoints)
    .range([0, plotWidth])
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

  let xAxis = d3.axisBottom(timeScale);
  let yAxis = d3.axisLeft(countScale);

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

  var gridlines = d3.axisLeft(countScale)
    .tickFormat("")
    .tickSize(-plotWidth);

  plot.append("g")
    .call(gridlines)
    .attr("color", "#E2E2E2");

  var lineFunction = d3.line()
    .x(function(d) { return timeScale(d.x); })
    .y(function(d) { return countScale(d.y); });

  var lineGraph = plot.append("path")
    .attr("d", lineFunction(dataPoints))
    .attr("stroke", "#4E79A7")
    .attr("stroke-width", 2)
    .attr("fill", "none");

  svg.append("text")
  // .attr("id", "graph-title")
    .style("font-size", "25")
    .attr("y", margin.top/2)
    .attr("x", 10)
    .style("text-anchor", "start")
    .text("Number of Incidents by Hour");

  plot.append("text")
    // .attr("id", "x-axis-title")
    .style("font-size", "14")
    .attr("transform",
        "translate(" + (plotWidth/2) + " ,"
        + (plotHeight + 40) + ")")
    .style("text-anchor", "middle")
    .text("Hour of Incident");

  plot.append("text")
    // .attr("id", "y-axis-title")
    .style("font-size", "14")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 8)
    .attr("x", -(plotHeight/2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of Incidents");

};
