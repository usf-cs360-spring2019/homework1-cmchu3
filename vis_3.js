
var weekDays = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday"
]

var processData = function(data) {
  let count = d3.map();

  for (row in data) {
    let category = data[row]["Incident Category"];
    let weekday = data[row]["Incident Day of Week"];

    if (weekday) {
      if (count.has(weekday)) {
        if (count.get(weekday).has(category)) {
          count.get(weekday).set(category, count.get(weekday).get(category) + 1);

        }
        else {
          count.get(weekday).set(category, 1);
        }
      }
      else {
        count.set(weekday, d3.map());
        count.get(weekday).set(category, 1);
      }
    }
  }

  return count;
};

var getTop5 = function(count) {
  let top = d3.map();
  let correctOrder = d3.map();

  for (i in weekDays) {
    let weekday = weekDays[i];
    let weekCategories = count.get(weekday).entries().sort(
      function(x,y) {
        return d3.descending(x.value, y.value);
      }
    );
    weekCategories = weekCategories.slice(0,5);
    let catOrdered = [];
    weekCategories.map(function(d, i) {
      catOrdered.push(d.key);
    });
    correctOrder.set(weekday, catOrdered);
    weekCategories.sort(
      function(x,y) {
        return d3.descending(x.key, y.key);
      }
    );
    top.set(weekday, weekCategories);
  }

  return [top, correctOrder];
};

var drawStackedBarChart = function(data) {
  let processed = processData(data);
  let topCategories = getTop5(processed);
  let indexOrder = topCategories[1];
  topCategories = topCategories[0];

  // Wednesday & Tuesday top 5 categories are wrong because spot 5 & 6 are the same value
  // fixing it here
  topCategories.get("Wednesday").splice(2,1);
  topCategories.get("Wednesday").unshift({key: "Warrant", value: 78});
  topCategories.get("Tuesday")[2] = topCategories.get("Tuesday")[3];
  topCategories.get("Tuesday")[3] = {key: "Burglary", value: 74};

  //also need to fix the indexOrder
  indexOrder.get("Tuesday")[4] = "Burglary";
  indexOrder.get("Wednesday")[4] = "Warrant";

  let svg = d3.select("body").select("svg");

  let countMin = 0;
  let countMax = 1200;

  let margin = {
    top:    70,
    right:  125,
    bottom: 30,
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

  let weekScale = d3.scaleBand()
    .domain(weekDays)
    .range([0, plotWidth])
    .paddingInner(0.16)
    .paddingOuter(.07);

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

  let xAxis = d3.axisBottom(weekScale).tickSize(0);
  let yAxis = d3.axisLeft(countScale).tickFormat(d3.format("d"));

  // check if we have already drawn our axes
  if (plot.select("g#y-axis").size() < 1) {
    let xGroup = plot.append("g").attr("id", "x-axis");

    // the drawing is triggered by call()
    xGroup.call(xAxis);

    // notice it is at the top of our svg
    // we need to translate/shift it down to the bottom
    xGroup.attr("transform", "translate(0," + plotHeight + ")");
    xGroup.selectAll("text")
      .style("font-size", 10)
      .attr("transform", "translate(0,5)");

    // do the same for our y axix
    let yGroup = plot.append("g").attr("id", "y-axis");
    yGroup.call(yAxis);
    yGroup.attr("transform", "translate(0,0)");
    yGroup.selectAll("text").style("font-size", 9);;
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

  let colors = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1"];
  let blackText = ["Burglary", "Malicious Mischief", "Other Miscellaneous"];

  let colorsCategories = {};
  colorsCategories["Assault"] = "#4E79A7";
  colorsCategories["Burglary"] = "#F28E2B";
  colorsCategories["Larceny Theft"] = "#E15759";
  colorsCategories["Malicious Mischief"] = "#76B7B2";
  colorsCategories["Non-Criminal"] = "#59A14F";
  colorsCategories["Other Miscellaneous"] = "#EDC948";
  colorsCategories["Warrant"] = "#B07AA1";

  let barHeights = {};
  let prevBarHeights = {};
  for (i in weekDays) {
    barHeights[weekDays[i]] = 0;
    prevBarHeights[weekDays[i]] = 0;
  }

  let bars = plot.selectAll("rect")
    .data(topCategories.entries(), function(d) { return d[d.key]; });

  let index = 0;
  while (index < 5) {
    bars.enter().append("rect")
      .style("fill", function(d) {
        return colorsCategories[d.value[index].key];
      })
      .attr("width", weekScale.bandwidth())
      .attr("x", function(d) {
        return weekScale(d.key);
      })
      .attr("y", function(d) {
        let rects = d.value;
        let returnVal = countScale(rects[index].value + barHeights[d.key]);
        prevBarHeights[d.key] = barHeights[d.key];
        barHeights[d.key] += rects[index].value;
        return returnVal;
      })
      .attr("height", function(d) {
        let rects = d.value;
        return plotHeight - countScale(rects[index].value) + 1;
      });
    bars.enter().append("text")
      .attr("x", function(d) {
        return weekScale(d.key) + (weekScale.bandwidth()/2);
      })
      .attr("y", function(d) {
        return countScale(prevBarHeights[d.key] + (d.value[index].value)/2);
      })
      .style("font-size", 10)
      .style("text-anchor", "middle")
      .style("fill", function(d) {
        if (blackText.includes(d.value[index].key))
          { return "black"; }
        else
          { return "white"; }
      })
      .text(function(d) {
        return d.value[index].key;
      });
    bars.enter().append("text")
      .attr("x", function(d) {
        return weekScale(d.key) + (weekScale.bandwidth()/2);
      })
      .attr("y", function(d) {
        return countScale(prevBarHeights[d.key] + (d.value[index].value)/2);
      })
      .attr("dy", "1.1em")
      .style("font-size", 10)
      .style("text-anchor", "middle")
      .style("fill", function(d) {
        if (blackText.includes(d.value[index].key))
          { return "black"; }
        else
          { return "white"; }
      })
      .text(function(d) {
        return indexOrder.get(d.key).indexOf(d.value[index].key)+1;
      });
    index++;
  }

  let legendTitle = plot.append("text")
    .style("font-size", "10")
    .style("text-anchor", "start")
    .style("font-weight", "bold")
    .attr("transform", "translate(" + (plotWidth + 13) + "," + -((margin.top/2) + 5) +  ")")
    .text("Incident Category");

  let legend = svg.selectAll(".legend")
    .data(colors)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(30," + i * 13 + ")"; });

  legend.append("rect")
    .attr("x", plotWidth - 10)
    .attr("width", 10)
    .attr("height", 10)
    .attr("transform", "translate(55,35)")
    .style("fill", function(d, i) {return colors.slice()[i];});

  legend.append("text")
    .style("font-size", "10")
    .style("text-anchor", "start")
    .attr("x", plotWidth + 5)
    .attr("y", 9)
    .attr("transform", "translate(55,35)")
    .text(function(d, i) {
      switch (i) {
        case 0: return "Assault";
        case 1: return "Burglary";
        case 2: return "Larceny Theft";
        case 3: return "Malicious Mischief";
        case 4: return "Non-Criminal";
        case 5: return "Other Miscellaneous";
        case 6: return "Warrant";
      }
    });

  svg.append("text")
  // .attr("id", "graph-title")
    .style("font-size", "22")
    .attr("y", margin.top/2)
    .attr("x", 10)
    .style("text-anchor", "start")
    .text("Top 5 Incident Categories per Day of the Week");

  plot.append("text")
    // .attr("id", "x-axis-title")
    .style("font-size", "12")
    .attr("transform",
        "translate(" + (plotWidth/2) + " ,"
        + "-10)")
    .style("text-anchor", "middle")
    .text("Incident Day of Week");

  plot.append("text")
    // .attr("id", "y-axis-title")
    .style("font-size", "12")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 8)
    .attr("x", -(plotHeight/2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of Incidents");

};
