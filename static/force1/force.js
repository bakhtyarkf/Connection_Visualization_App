var id = 0,
    srchVal,
    srchCat,
    HSwitch = false;




// load first degree data
// var dataTarget = "/static/data2.json";
// var strmands;
// $.ajax({
//     url: 'static/strmnd.json',
//     async: false,
//     dataType: 'json',
//     success: function (response) {
//         s = response
//     }
// });

var sim1, nodes1, links1;
var sim2, nodes2, links2;
var sim3, nodes3, links3;
// loading the first degree data on the load of the page
d3.json(dataTarget = "static/data1.json", function (error, graph) {
    // graph.nodes[id].x = width / 2;
    // graph.nodes[id].y = height / 2;
    // graph.nodes[id].fx = width / 2;
    // graph.nodes[id].fy = height / 2;
    // graph.nodes[id].root = true
    // graph.nodes[id].fixed = true
    if (error) throw error;
    var tableID = "#deg1"
    update(graph, '.chart1', sim1, nodes1, links1, tableID);
});

var intval = setInterval(() => {

    $.ajax({
        url:"static/data2.json",
        type:'HEAD',
        error: function()
        {
        },
        success: function()
        {
            setTimeout(() => {
                console.log("Loading ....");
                d3.json(dataTarget = "/static/data2.json", function (error, graph) {
                    // graph.nodes[id].x = width / 2;
                    // graph.nodes[id].y = height / 2;
                    // graph.nodes[id].fx = width / 2;
                    // graph.nodes[id].fy = height / 2;
                    // graph.nodes[id].root = true
                    // graph.nodes[id].fixed = true
                    if (error) { }
                    else {
                        document.getElementById("deg2b").disabled = false;
                        var tableID = "#deg2"
                        sim2 = update(graph, '.chart2', sim2, nodes2, links2, tableID)
                        clearInterval(intval)
                    }
            
                });
            }, 1000);
            
        }
    });
    
    
}, 2100)

  
// async function getJson() {
//     $.ajax({
//         url:"/static/data2.json",
//         type:'HEAD',
//         error: function()
//         {
//             setTimeout(getJson(), 1000)
//         },
//         success: function()
//         {
//             d3.json(dataTarget = "/static/data2.json", function (error, graph) {
//                 // graph.nodes[id].x = width / 2;
//                 // graph.nodes[id].y = height / 2;
//                 // graph.nodes[id].fx = width / 2;
//                 // graph.nodes[id].fy = height / 2;
//                 // graph.nodes[id].root = true
//                 // graph.nodes[id].fixed = true
//                 if (error) { }
//                 else {
//                     document.getElementById("deg2b").disabled = false;
//                     var tableID = "#deg2"
//                     sim2 = update(graph, '.chart2', sim2, nodes2, links2, tableID)
//                     // clearInterval(intval)
//                 }
        
//             });
//         }
//     });
// }
// getJson()


// var intval3 = setInterval(() => {
//     d3.json(dataTarget = "/static/data3.json", function (error, graph) {
//         // graph.nodes[id].x = width / 2;
//         // graph.nodes[id].y = height / 2;
//         // graph.nodes[id].fx = width / 2;
//         // graph.nodes[id].fy = height / 2;
//         // graph.nodes[id].root = true
//         // graph.nodes[id].fixed = true
//         if (error) {}
//         else {
//             document.getElementById("deg3b").disabled = false;
//             var tableID = "#deg3"
//             sim3 = update(graph, '.chart3', sim3, nodes3, links3, tableID)
//             clearInterval(intval3)
//         }

//     });        
// }, 1000)


// check if this part needed
// d3.select('#submit').on('click', function () {
// d3.json(dataTarget, function (error, graph) {
//     graph.nodes[id].x = width / 2;
//     graph.nodes[id].y = height / 2;
//     graph.nodes[id].fx = width / 2;
//     graph.nodes[id].fy = height / 2;
//     graph.nodes[id].root = true
//     graph.nodes[id].fixed = true
//     if (error) throw error;
//     update(graph)
// })
// });


// setting the dimensions and introducing required variables
var margin = { top: 10, right: 10, bottom: 10, left: 10 },
    width = 990 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom,
    node,
    link;



// colors of the links
var colorSeg = {
    "empleder": "red",
    "h": "blue",
    "o": "orange",
}

// colors of the resource nodes
var resColors = {
    "address": "#d8e500",
    "employee": "#ee66ff",
    "ejer": "#7f4cff",
    "leder": "#66ff9e",
    "henids": "#00e5bd",
    "overids": "#00abff"
}
















// update function that update the whole svg
function update(graph, chart, simulation, node, link, tableID) {

    // setting the domain for the Scale, determining the size of R
    minConnections = d3.min(graph.nodes, d => d['connected_nodes'] > 50 ? 10 : d['connected_nodes']);
    maxConnections = d3.max(graph.nodes, d => d['connected_nodes'] > 50 ? 10 : d['connected_nodes']);

    // domain range for width of links
    minStrngth = d3.min(graph.links, d => d['strength']);
    maxStrength = d3.max(graph.links, d => d['strength']);

    // Setting the range Size of the Nodes Dynamically
    var minRrange = Math.min(3, (3 * 80) / graph.nodes.length);
    var maxRrange = Math.min(10, (8 * 80) / graph.nodes.length);
    var HubSize = Math.min(15, (12 * 80) / graph.nodes.length);


    var rScale = d3.scaleSqrt()
        .domain([minConnections, maxConnections])
        .range([3, 10]);

    // Setting the range Length of the Links Dynamically
    var minLrange = Math.min(1, (1 * 80) / graph.nodes.length);
    var maxLrange = Math.min(3, (3 * 80) / graph.nodes.length);

    var linkScale = d3.scaleLinear()
        .domain([minStrngth, maxStrength])
        .range([1, 3]);


    d3.select(chart).selectAll("svg").remove();

    // zooming and dragging function
    var zoom = d3.zoom()
        .scaleExtent([0.1, 40])
        .on("zoom", zoomed);



    var svg = d3.select(chart).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .call(zoom)

    // this rectangle is for enabling clicking to remove highlight
    var rect = svg.append('rect')
        .attr('fill', '#F1F1F1')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .on("click", function (d) {
            unHighlight()
            $('circle').removeClass('selectedNode');
        })

    var g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


    // if (chart == '.chart1') {
    // deffinition of the Force network
    simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) { return d.id; }).distance(30).strength(1))
        .force("charge", d3.forceManyBody().strength(-20))
        .force("collide", d3.forceCollide(5))
        .force("gravity", d3.forceManyBody(40))
        .force("x", d3.forceX(width / 2).strength(0.03))
        .force("y", d3.forceY(height / 2).strength(0.03))
    // .force("center", d3.forceCenter(width / 2, height / 2));
    // }



    // links and their properties
    // tooltip property has been commented
    link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr('stroke', function (l) {
            if (l.type == 'res') {
                return resColors[l.resource];
            } else {
                return colorSeg[l.type]
            }
        })
        .attr("stroke-width", d => linkScale(d['strength']))
    // .on("mouseover", Linktooltip)
    // .on("mouseout", function(d) {
    //     d3.select("body").select('#Linktooltip').remove()
    //     var g = d3.select(this);
    // })
    // .on("click", shLinkTable)


    // group containing Nodes and their lables
    node = g.append("g")
        .attr("class", "nodes")
        .selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", d => d.id)
        // .on("mouseover", tooltip)
        // .on("mouseout", d => d3.select("body").select('#tooltip').remove())
        .on("click", shTable)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // adding the Nodes
    node.append("circle")
        .attr("r", d => d.hub == 'y' ? HubSize : rScale(parseInt(d['connected_nodes']) + 3 * parseInt(d['node_members'])))
        .attr('id', (d, i) => i)
        .attr('class', (d, i) => 'circle' + i)
        .attr("fill", colorize)

    // adding Nodes lables
    node.append("text")
        .text(d => d.group.substr(0, 1).toUpperCase())
        .attr("text-anchor", "middle")
        .style("font-size", 8)
        .style("font-color", "#686868")
        .style("font-weight", "bold")
        .attr("dy", 2)


    // starting the simulation
    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);





    function zoomed() {

        g.attr("transform", d3.event.transform);
        // d3.event.transform.rescaleX();
        // d3.event.transform.rescaleY();

    }


    // highlighting capabilities
    var linkedByIndex = {};

    function Highlight(d) {

        var circle = d3.select(this);

        var resLinks = []
        var ConnectedThroughRes = []

        // adding links to the index and highlighting them
        link
            .each(function (o) {

                linkedByIndex[o.source.index + "," + o.target.index] = true;

                if (o.source.id === d.id) {
                    if (o.type == 'res') {
                        resLinks.push(o.target.id)
                    }
                }
            })
            .transition(500)
            .style("stroke-opacity", function (o) {

                var opVal = o.source === d || o.target === d ? 1 : 0.2;
                if (resLinks.indexOf(o.target.id) != -1) {
                    opVal = 1
                }
                return opVal
            });

        // adding Nodes connected through resources to the index
        link
            .each(function (o) {
                if (resLinks.indexOf(o.target.id) != -1) {
                    ConnectedThroughRes.push(o.source.index)
                }
            })

        node
            .transition(500)
            .style("opacity", function (o) {
                var opVal = isConnected(o, d) ? 1.0 : 0.2;
                if (ConnectedThroughRes.indexOf(o.index) != -1) {
                    opVal = 1
                }
                return opVal
            })

    }

    var unHighlight = function () {
        var circle = d3.select(this);

        node
            .transition(500)
            .style("opacity", 1);

        link
            .transition(500)
            .style("stroke-opacity", 1);
        // circle
        //   .transition(500)
        //     .attr("r", node_radius);
    }


    function isConnected(a, b) {
        return isConnectedAsTarget(a, b) || isConnectedAsSource(a, b) || isEqual(a, b);
    }

    function isConnectedAsSource(a, b) {
        return linkedByIndex[a.index + "," + b.index];
    }

    function isConnectedAsTarget(a, b) {
        return linkedByIndex[b.index + "," + a.index];
    }

    function isEqual(a, b) {
        return a.index == b.index;
    }


    // this function clears all the highlight then adds Hightlighting for the selected node and then creates the table 
    function shTable(d) {

        // 
        // id = this.id;
        srchVal = d.id;
        srchCat = d.group;
        var selOps = document.getElementById('hchoice');
        var valOps = document.getElementById('hvalue');
        selOps.value = srchCat;
        valOps.value = srchVal;
        d3.select("body").select('#tooltip').remove();
        var containedClass = this.getElementsByTagName("circle")[0].getAttribute("class")
        var selClass = '.' + containedClass;


        unHighlight()
        $('circle').removeClass('selectedNode');
        Highlight(d)
        if (containedClass.includes('selectedNode')) {
            d3.select(selClass).classed('selectedNode', false);
        } else {
            d3.select(selClass).classed('selectedNode', true);
        }


        createTable(d, tableID);
    }



    function colorize(d) {

        if (d.type == 'res') {
            if (d.stmand) {
                return '#6d3100'
            }
            return resColors[d.group]
        }
        else {
            if (d['Fradulancy'] < 0.5) {
                return '#007f00';
            } else if (d['Fradulancy'] == 1) {
                return '#d20000'
            } else {
                var frColors = ['#5C5C5C', '#474747', '#333333', '#1F1F1F', '#0A0A0A']
                var sc = Math.floor((d['Fradulancy'] - 0.5) / 0.2)
                console.log(sc);
                return frColors[sc]
            }

        }
    }


    function ticked() {


        link
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        // this way of setting node position is for whene the nodes are in a containing group
        node.attr("transform", function (d) {

            // the commented code is used for constraining the nodes inside the box, so there will be no need for scrolling
            // but the network looses tidyness

            // return "translate(" + Math.max(maxRadius, Math.min(width - maxRadius, d.x)) + "," + 
            //                     Math.max(maxRadius, Math.min(height - maxRadius, d.y)) + ")";
            return "translate(" + d.x + "," + d.y + ")";
        });

        // this way of setting node position is for whene the nodes are not in a containing group
        // node
        //     .attr("cx", function(d) { return d.x = Math.max(maxRadius, Math.min(width - maxRadius, d.x)); })
        //     .attr("cy", function(d) { return d.y = Math.max(maxRadius, Math.min(height - maxRadius, d.y)); });
        // .attr("cx", function(d) { return d.x; })
        // .attr("cy", function(d) { return d.y; });

    }


    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;

        // $(document).on('keydown', (e) => {
        //     if(e.altKey) {
        //         d.fx = d.x;
        //         d.fy = d.y;
        //     }
        // })
    }

    return simulation

}






















// showing tooltip for nodes
// currently not being used
function tooltip(d) {
    var g = d3.select(this); // The node
    var r;
    if (d.root) {
        r = 'root';
    }
    var div = d3.select("body").append("div")
        .attr('pointer-events', 'none')
        .attr("id", "tooltip")
        .style("opacity", 1)
        .html(d.id + "<br>" + d.group + "<br>" + r)
        .style("left", (d.x + 180 + "px"))
        .style("top", (d.y + 15 + "px"));
}

// creates the table
function createTable(d, tableID) {
    var vlaue;
    var key;
    d3.selectAll('.new').remove();
    var tb = d3.select(tableID).select('tbody')

    key = 'group';

    if (d.hasOwnProperty(key) && d[key] && d[key] != ""  && d[key] != "virksomhed") {
        var tr = tb.append("tr")
            .attr('class', 'new');
        tr.append("td")
            .html('Kategori');
        if (typeof (d[key]) == 'object') {
            tr.append("td").html(d[key].join("<br>"))
        } else {
            tr.append("td").html(d[key])
        }
    }


    key = 'id';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        var tr = tb.append("tr")
            .attr('class', 'new');
        tr.append("td")
            .html(key);
        if (typeof (d[key]) == 'object') {
            tr.append("td").html(d[key].join("<br>"))
        } else {
            tr.append("td").html(d[key])
        }
    }

    key = 'name';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        var tr = tb.append("tr")
            .attr('class', 'new');
        tr.append("td")
            .html(key);
        if (typeof (d[key]) == 'object') {
            tr.append("td").html(d[key].join("<br>"))
        } else {
            tr.append("td").html(d[key])
        }
    }

    key = 'Branche';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        var tr = tb.append("tr")
            .attr('class', 'new');
        tr.append("td")
            .html(key);
        if (typeof (d[key]) == 'object') {
            tr.append("td").html(d[key].join("<br>"))
        } else {
            tr.append("td").html(d[key])
        }
    }

    key = 'Start_date';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        var tr = tb.append("tr")
            .attr('class', 'new');
        tr.append("td")
            .html(key);
        if (typeof (d[key]) == 'object') {
            tr.append("td").html(d[key].join("<br>"))
        } else {
            tr.append("td").html(d[key])
        }
    }

    key = 'Status';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        var tr = tb.append("tr")
            .attr('class', 'new');
        tr.append("td")
            .html(key);
        if (typeof (d[key]) == 'object') {
            tr.append("td").html(d[key].join("<br>"))
        } else {
            tr.append("td").html(d[key])
        }
    }

    key = 'Fradulancy';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        var tr = tb.append("tr")
            .attr('class', 'new');
        tr.append("td")
            .html('Snyds score');
        if (typeof (d[key]) == 'object') {
            tr.append("td").html(d[key].join("<br>"))
        } else {
            tr.append("td").html(d[key])
        }
    }

    // key = 'FradulantCount';
    // if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //     var tr = tb.append("tr")
    //         .attr('class', 'new');
    //     tr.append("td")
    //         .html(key);
    //     if (typeof (d[key]) == 'object') {
    //         tr.append("td").html(d[key].join("<br>"))
    //     } else {
    //         tr.append("td").html(d[key])
    //     }
    // }

    // key = 'employees_count_code';
    // if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //     var tr = tb.append("tr")
    //         .attr('class', 'new');
    //     tr.append("td")
    //         .html(key);
    //     if (typeof (d[key]) == 'object') {
    //         tr.append("td").html(d[key].join("<br>"))
    //     } else {
    //         tr.append("td").html(d[key])
    //     }
    // }

    // key = 'hub';
    // if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //     var tr = tb.append("tr")
    //         .attr('class', 'new');
    //     tr.append("td")
    //         .html(key);
    //     if (typeof (d[key]) == 'object') {
    //         tr.append("td").html(d[key].join("<br>"))
    //     } else {
    //         tr.append("td").html(d[key])
    //     }
    // }

    key = 'connected_nodes';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        var tr = tb.append("tr")
            .attr('class', 'new');
        tr.append("td")
            .html(key);
        if (typeof (d[key]) == 'object') {
            tr.append("td").html(d[key].join("<br>"))
        } else {
            tr.append("td").html(d[key])
        }
    }

    // key = 'overids';
    // if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //     var tr = tb.append("tr")
    //         .attr('class', 'new');
    //     tr.append("td")
    //         .html(key);
    //     if (typeof (d[key]) == 'object') {
    //         tr.append("td").html(d[key].join("<br>"))
    //     } else {
    //         tr.append("td").html(d[key])
    //     }
    // }

    // key = 'henids';
    // if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //     var tr = tb.append("tr")
    //         .attr('class', 'new');
    //     tr.append("td")
    //         .html(key);
    //     if (typeof (d[key]) == 'object') {
    //         tr.append("td").html(d[key].join("<br>"))
    //     } else {
    //         tr.append("td").html(d[key])
    //     }
    // }

    // key = 'ejers';
    // if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //     var tr = tb.append("tr")
    //         .attr('class', 'new');
    //     tr.append("td")
    //         .html(key);
    //     if (typeof (d[key]) == 'object') {
    //         tr.append("td").html(d[key].join("<br>"))
    //     } else {
    //         tr.append("td").html(d[key])
    //     }
    // }

    key = 'ejerinfo';
    if (d.hasOwnProperty(key) && d[key] && d[key] != ""  && d[key] && d[key] != "" ) {
        let arr = [];
        if (typeof (d[key][0]) != "object") {
            arr.push(d[key])
        } else {
            arr = d[key]
        }
        arr.forEach(el => {
            var tr = tb.append("tr").attr('class', 'new').attr("id", el[0] + "ej");
            tr.append("td").html('Ejer');
            let tdInfo = tr.append("td").attr("id", el[0]).html("CPR: " + el[0] + "<br>")
            var htmlVal = '';
            for (let i = 1; i < el.length; i++) {
                const element = el[i];
                var title;
                // if (i == 0) title = "CPR";
                if (i == 1) title = "Name";
                if (i == 2) title = "Nationality";
                if (i == 3) title = "Address";
                if (i == 4) title = "Number of Companies";
                if (i == 5) title = "Statsborgerskab";

                htmlVal += title + " : " + el[i] + "<br>"

            }
            // document.getElementById("cont").append("div").attr("id", el[0]+"ej").attr("class", "hidtag tooltip")
            tdInfo.append("div").attr("id", el[0] + "ejel").attr("class", 'hidtag').html(htmlVal);
            document.getElementById(el[0] + "ej").addEventListener("click", () => {
                let divElem = document.getElementById(el[0] + "ejel")
                if (divElem.style.display == "inline") {
                    divElem.style.display = "none"
                } else {
                    divElem.style.display = "inline"
                }

            })

            // document.getElementById(el[0]+"ej").addEventListener("mouseout", () => {
            //     let divElem = document.getElementById(el[0]+"ej")
            //     divElem.style.display = "none"
            // })

        })
    }


    // key = 'leders';
    // if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //     var tr = tb.append("tr")
    //         .attr('class', 'new');
    //     tr.append("td")
    //         .html(key);
    //     if (typeof (d[key]) == 'object') {
    //         tr.append("td").html(d[key].join("<br>"))
    //     } else {
    //         tr.append("td").html(d[key])
    //     }
    // }


    key = 'ledersinfo';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        let arr = [];
        if (typeof (d[key][0]) != "object") {
            arr.push(d[key])
        } else {
            arr = d[key]
        }
        arr.forEach(el => {
            var tr = tb.append("tr").attr('class', 'new').attr("id", el[0] + "led");
            tr.append("td").html('Leder');
            let tdInfo = tr.append("td").html("CPR: " + el[0] + "<br>")
            var htmlVal = '';
            for (let i = 1; i < el.length; i++) {
                const element = el[i];
                var title;
                // if (i == 0) title = "CPR";
                if (i == 1) title = "Name";
                if (i == 2) title = "Nationality";
                if (i == 3) title = "Type";
                if (i == 4) title = "Address";
                if (i == 5) title = "Number of Companies";
                if (i == 6) title = "Statsborgerskab";
                if (i == 7) title = "Stråmand";

                htmlVal += title + " : " + el[i] + "<br>"

            }

            tdInfo.append("div").attr("id", el[0] + "ledel").attr("class", 'hidtag').html(htmlVal);
            document.getElementById(el[0] + "led").addEventListener("click", () => {
                let divElem = document.getElementById(el[0] + "ledel")
                if (divElem.style.display == "inline") {
                    divElem.style.display = "none"
                } else {
                    divElem.style.display = "inline"
                }

            })
        })
    }

    // key = 'employees';
    // if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //     var tr = tb.append("tr")
    //         .attr('class', 'new');
    //     tr.append("td")
    //         .html(key);
    //     if (typeof (d[key]) == 'object') {
    //         tr.append("td").html(d[key].join("<br>"))
    //     } else {
    //         tr.append("td").html(d[key])
    //     }
    // }

    //     key = 'addresses';
    //     if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
    //         var tr = tb.append("tr")
    //             .attr('class', 'new');
    //         tr.append("td")
    //             .html(key);
    //         if (typeof (d[key]) == 'object') {
    //             var adds = []
    //             d[key].forEach((address) => {
    //                 // console.log(d[key]);
    //                 // console.log(address);
    //                 var hrf = 'https://maps.google.com/?q='.concat(address.replace(/\s/g,'%20'))
    //                 console.log(hrf);
    //                 adds.push('<a href=' + hrf + ' target="_blank">' + address + '</a>')
    //             })
    //             tr.append("td").html(adds.join("<br>"))
    //         } else {
    //             tr.append("td").html(d[key])
    //         }
    //     }

    //     // }

    // }



    key = 'addressinfo';
    if (d.hasOwnProperty(key) && d[key] && d[key] != "" ) {
        let elCount = 0
        let arr = [];
        if (typeof (d[key][0]) != "object") {
            arr.push(d[key])
        } else {
            arr = d[key]
        }
        arr.forEach(el => {

            let idVal = "addr" + elCount
            var tr = tb.append("tr").attr('class', 'new').attr("id", idVal);
            tr.append("td").html('Address');
            var hrf = 'https://maps.google.com/?q='.concat(el[0].replace(/\s/g, '%20'))
            var addrs = '<a href=' + hrf + ' target="_blank">' + el[0] + '</a>'
            let tdInfo = tr.append("td").html(addrs + "<br>")
            var htmlVal = '';
            for (let i = 0; i < el.length; i++) {
                const element = el[i];
                var title;
                if (i == 0) title = "FullAddress";
                if (i == 1) title = "locatedNumber";
                if (i == 2) title = "addrGYLDIGFRA";
                if (i == 3) title = "addrGYLDIGTIL";

                htmlVal += title + " : " + el[i] + "<br>"

            }
            // tr.append("td").html(htmlVal);
            // document.getElementById(el[0]).addEventListener("mousover", (e) => Tabletooltip(e, htmlVal))

            let tdID = "addrel" + elCount
            tdInfo.append("div").attr("id", tdID).attr("class", 'hidtag').html(htmlVal);
            document.getElementById(idVal).addEventListener("click", () => {
                let divElem = document.getElementById(tdID)
                if (divElem.style.display == "inline") {
                    divElem.style.display = "none"
                } else {
                    divElem.style.display = "inline"
                }

            })
            elCount += 1
        })
    }

    // functions that runs when we select the degree specified
    function degSelect() {
        id = this.id;
        d3.json(dataTarget, function (error, graph) {
            graph.nodes[id].x = width / 2;
            graph.nodes[id].y = height / 2;
            graph.nodes[id].fx = width / 2;
            graph.nodes[id].fy = height / 2;
            graph.nodes[id].root = true
            graph.nodes[id].fixed = true
            update(graph)
        });
    }




    // centers the selected node
    // function CenterNode(d) {
    //     d3.select("body").select('#tooltip').remove()
    //     createTable(d)
    //     id = this.id;
    //     d3.json(dataTarget, function (error, graph) {
    //         graph.nodes[id].x = width / 2;
    //         graph.nodes[id].y = height / 2;
    //         graph.nodes[id].fx = width / 2;
    //         graph.nodes[id].fy = height / 2;
    //         graph.nodes[id].root = true
    //         graph.nodes[id].fixed = true
    //         if (error) throw error;
    //         update(graph)
    //     });
    // }


    // linke Display Functions
    // currently unused
    function Linktooltip(d) {
        var g = d3.select(this); // The node
        // g.attr('stroke-width', 4)
        var div = d3.select("body").append("div")
            .attr('pointer-events', 'none')
            .attr("id", "Linktooltip")
            .style("opacity", 1)
            .html(d.source.id + "<br>" + d.target.id + "<br>" + d.resource + "<br>")
            .style("left", ((d.target.x + d.source.x) / 2 + 180 + "px"))
            .style("top", ((d.target.y + d.source.y) / 2 + 30 + "px"));
    }

    function Tabletooltip(d, htmlVal) {
        // var g = d3.select(this); // The node
        // g.attr('stroke-width', 4)
        var div = d3.select("body").append("div")
            .attr('pointer-events', 'none')
            .attr("id", "Linktooltip")
            .style("opacity", 1)
            .html(htmlVal)
            .style("left", ((d.target.x + d.source.x) / 2 + 180 + "px"))
            .style("top", ((d.target.y + d.source.y) / 2 + 30 + "px"));
    }

    // shows the table for selected link
    function shLinkTable(d) {
        d3.select("body").select('#Linktooltip').remove();
        var generic = ['x', 'y', 'fx', 'fy', 'vx', 'vy', 'root', 'fixed']
        d3.selectAll('.new').remove();
        var tb = d3.select('tbody')
        for (var key in d) {
            if (d.hasOwnProperty(key) && d[key] && d[key] != ""  &
                generic.indexOf(key) < 0) {
                var tr = tb.append("tr")
                    .attr('class', 'new');
                tr.append("td")
                    .html(key);
                if (key == 'source' || key == 'target') {
                    tr.append("td").html(d[key].id);
                }
                else {
                    tr.append("td").html(d[key]);
                }

            }
        }
    }
}