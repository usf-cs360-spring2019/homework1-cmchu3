/*
 * our massive function to draw a bar chart. note some stuff in here
 * is bonus material (for transitions and updating the text)
 */
var drawBarChart = function() {
  // get the data to visualize
  let letters = "abcdefghijklmnopqrstuvwxyz".split("");
  let count = d3.map();

  for (letter in letters) {
    count.set(letter, 2);
  }

  // get the svg to draw on
  let svg = d3.select("body").select("svg");
  console.log("SVGG");
  console.log(svg.style("width"));

  /*
   * we will need to map our data domain to our svg range, which
   * means we need to calculate the min and max of our data
   */

  let countMin = 0; // always include 0 in a bar chart!
  let countMax = d3.max(count.values());

  // this catches the case where all the bars are removed, so there
  // is no maximum value to compute
  if (isNaN(countMax)) {
    countMax = 0;
  }

  // console.log("count bounds:", [countMin, countMax]);

  /*
   * before we draw, we should decide what kind of margins we
   * want. this will be the space around the core plot area,
   * where the tick marks and axis labels will be placed
   * http://bl.ocks.org/mbostock/3019563
   */
  let margin = {
    top:    15,
    right:  35, // leave space for y-axis
    bottom: 30, // leave space for x-axis
    left:   10
  };

  // now we can calculate how much space we have to plot
  let bounds = svg.node().getBoundingClientRect();
  let plotWidth = bounds.width - margin.right - margin.left;
  let plotHeight = bounds.height - margin.top - margin.bottom;

  let countScale = d3.scaleLinear()
    .domain([countMin, countMax])
    .range([plotHeight, 0])
    .nice(); // rounds the domain a bit for nicer output

  let letterScale = d3.scaleBand()
    .domain(letters) // all letters (not using the count here)
    .rangeRound([0, plotWidth])
    .paddingInner(0.1); // space between bars

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

  // now lets draw our x- and y-axis
  // these require our x (letter) and y (count) scales
  let xAxis = d3.axisBottom(letterScale);
  let yAxis = d3.axisRight(countScale);

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
    yGroup.attr("transform", "translate(" + plotWidth + ",0)");
  }
  else {
    // we need to do this so our chart updates
    // as we type new letters in our box
    plot.select("g#y-axis").call(yAxis);
  }

  // now how about some bars!
  /*
   * time to bind each data element to a rectangle in our visualization
   * hence the name data-driven documents (d3)
   */
  let bars = plot.selectAll("rect")
    .data(count.entries(), function(d) { return d.key; });

  // setting the "key" is important... this is how d3 will tell
  // what is existing data, new data, or old data

  /*
   * okay, this is where things get weird. d3 uses an enter, update,
   * exit pattern for dealing with data. think of it as new data,
   * existing data, and old data. for the first time, everything is new!
   * http://bost.ocks.org/mike/join/
   */
  // we use the enter() selection to add new bars for new data
  bars.enter().append("rect")
    // we will style using css
    .attr("class", "bar")
    // the width of our bar is determined by our band scale
    .attr("width", letterScale.bandwidth())
    // we must now map our letter to an x pixel position
    .attr("x", function(d) {
      return letterScale(d.key);
    })
    // and do something similar for our y pixel position
    .attr("y", function(d) {
      return countScale(d.value);
    })
    // here it gets weird again, how do we set the bar height?
    .attr("height", function(d) {
      return plotHeight - countScale(d.value);
    })
    .each(function(d, i, nodes) {
      console.log("Added bar for:", d.key);
    });

  // notice there will not be bars created for missing letters!

  // so what happens when we change the text?
  // well our data changed, and there will be a new enter selection!
  // only new letters will get new bars

  // but we have to bind this draw function to textarea events
  // (see index.html)

  // for bars that already existed, we must use the update selection
  // and then update their height accordingly
  // we use transitions for this to avoid change blindness
  bars.transition()
    .attr("y", function(d) { return countScale(d.value); })
    .attr("height", function(d) { return plotHeight - countScale(d.value); });

  // what about letters that disappeared?
  // we use the exit selection for those to remove the bars
  bars.exit()
    .each(function(d, i, nodes) {
      console.log("Removing bar for:", d.key);
    })
    .transition()
    .attr("y", function(d) { return countScale(countMin); })
    .attr("height", function(d) { return plotHeight - countScale(countMin); })
    .remove();
};
