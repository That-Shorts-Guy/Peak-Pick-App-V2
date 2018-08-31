let dataPoints = []; //global array to store data in
let axisLabels = ["Channel Number","Frequency"]; //global array for axis titles; if none in text file, these are default.
let zoomEnabled = false;


//once upload button is pressed, open up file window
document.getElementById("uploadButton").addEventListener('click',uploadData);

function uploadData(){
  document.getElementById("uploadButton").style.background=''; 
  document.getElementById("input-file").click(); //open file explorer
  
}

document.getElementById("plotButton").onclick = function(){
  //if data array is not empty, then plot graph, else button is useless
  if (dataPoints.length != 0) {
    plotData(dataPoints);
  } else{
    //error message
    alert("Please upload some valid data before trying to plot");
  }
}

//enable zoom/panning functionality, disables peak selection
document.getElementById("zoomPanButton").onclick = function(){
  document.getElementById("zoomPanButton").style.border='4px solid red';
  document.getElementById("zoomPanButton").style.background='rgba(0,0,0,0.2)';
  document.getElementById("selectPeakButton").style.border='2px solid black';
  document.getElementById("selectPeakButton").style.background='rgba(0,0,0,0.5)';
  zoomEnabled = true;
}

//enable peak selection (default selection), disables zoom/panning
document.getElementById("selectPeakButton").onclick = function(){
  document.getElementById("selectPeakButton").style.border='4px solid red';
  document.getElementById("selectPeakButton").style.background='rgba(0,0,0,0.2)';
  document.getElementById("zoomPanButton").style.border='2px solid black';
  document.getElementById("zoomPanButton").style.background='rgba(0,0,0,0.5)';
  zoomEnabled = false;
}

//reading text file
document.getElementById('input-file').onchange = function(){
  document.getElementById('plotButton').style.background='rgba(0,0,0,0.2)'; 
  dataPoints = []; //resetting dataPoints array if uploading new data

  let file = this.files[0]; 

  let reader = new FileReader(); 
  reader.onload = function(progressEvent){ 

    let lines = this.result.split('\n'); //split file by lines

    let i1 = 0; //counter for each line in text file

    //checks if first line is text and then sets these as the axis titles
    if ( isNaN( parseFloat(lines))){
      let column = lines[0].split('\t');
      axisLabels[0] = column[0];
      axisLabels[1] = column[1];
      i1++;
    }

    for(i1; i1 < lines.length; i1++){
      let column = lines[i1].split('\t');
      if ( isNaN( parseFloat( column[0] ) ) || isNaN( parseFloat( column[1] ) ) ) continue; //if any text, skip this line
      dataPoints.push( [ parseFloat(column[0]), parseFloat(column[1]) ] );
    }
  };
  reader.readAsText(file); 
};

//plotting graph
function plotData(dataPoints) {
  d3.select("svg").remove(); //if chart already exists, remove this (stops plotting two graphs together)
   
  //set the dimensions of the canvas/graph
  let margin = {top: 20, right: 15, bottom: 60, left: 50}, 
                width = 920 - margin.left - margin.right, 
                height = 450 - margin.top - margin.bottom;

  //defining parameters for x-axis
  let x = d3.scale.linear() 
          .domain([0, 1.1*d3.max(dataPoints, function(d) { return d[0]; })]) //110% of max value
          .range([ 0, width ]); //span the entire width of the graph
    
  //defining parameters for y-axis
  let y = d3.scale.linear() 
          .domain([0, 1.1*d3.max(dataPoints, function(d) { return d[1]; })]) //110% of max value
          .range([ height, 0 ]); //span height of graph
          
  
  let svg = d3.select("#graph") //tells where to place graph
              .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr('class', 'chart')
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .style("pointer-events", "all")
                .call(d3.behavior.zoom().x(x).y(y).scaleExtent([1, 8]).on("zoom", zoom));
  
  //think this defines an area that shouldn't be drawn over
  svg.append("clipPath")
     .attr("id", "clip")
     .append("rect")
     .attr("width", width)
     .attr("height", height);

  svg.append("rect")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  function zoom() {
    if (zoomEnabled){ //only allows zoom if that option selected
      svg.select(".xAxis").call(xAxis); //".x.axis"
      svg.select(".yAxis").call(yAxis); //".y.axis"
      svg.selectAll("circle")
         .attr("cx", function(d) { return x(d[0]); })
         .attr("cy", function(d) { return y(d[1]); });

      //create connected lines when zooming
      graph.select("path")
           .attr("class", "line")
           .attr("d", valueLine(dataPoints));
    }
  }

  // create main and group with svg
  let main = svg.append('g') 
              .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
              .attr('width', width)
              .attr('height', height)
              .attr('class', 'main');
              
  // define the x axis
  let xAxis = d3.svg.axis()
              .scale(x)
              .orient('bottom');

  // add x axis label
  svg.append("text") 
     .attr("x", width/2 + margin.left ) 
     .attr("y",  height + margin.bottom ) 
     .style("text-anchor", "middle") 
     .text(axisLabels[0]);

  // define the y axis
  let yAxis = d3.svg.axis()
              .scale(y)
              .orient('left');

  //add y axis label
  svg.append("text") 
     .attr("transform", "rotate(-90)") //rotate text (note: changes coordinate reference point)
     .attr("y", 0 - margin.left) //horizontal position
     .attr("x",0 - (height / 2)) //vertical position
     .attr("dy", "1em") //pushes text to the right by the height of the text - ensures its on the screen
     .style("text-anchor", "middle") 
     .text(axisLabels[1]); 

  // Define the line connecting points
  let valueLine = d3.svg.line()
                  .x(function(d) { return x(d[0]); })
                  .y(function(d) { return y(d[1]); });


  // drawing the x-axis and grouping to main
  main.append('g')
	    .attr('transform', 'translate(0,' + height + ')')
	    .attr('class', 'main axis date') //not quite sure why this has this class name but it makes the axes not blue
	    .call(xAxis); 

  // drawing the y-axis and grouping to main
  main.append('g')
	    .attr('transform', 'translate(0,0)')
	    .attr('class', 'main axis date') //same as above, stops being blue...
	    .call(yAxis); 

  let graph = main.append("svg:g"); //create a new svg element and group to main?

  // Add lines between data points
  graph.append("path")
    .attr("class", "line")
    .attr("d", valueLine(dataPoints)); //draw the lines defined by valueLine().


  graph.selectAll("scatter-dots")
    .data(dataPoints)
    .enter().append("svg:circle")
    .attr("cx", function (d) { return x(d[0]); } )
    .attr("cy", function (d) { return y(d[1]); } )
    .attr("r", 1);
}
