const PORT = 3000; //Default port for server.js
import {search, searchChildProcess, searchParentProcess} from './Graphio.js';
document.addEventListener('DOMContentLoaded', function () {
    const searchButton = document.querySelector('#searchButton');
    const textBox = document.querySelector('#inputField');
    const checkbox = document.querySelector('#reverseCheckbox');
    const fileCheckBox = document.querySelector('#fileCheckbox');
    const networkCheckBox = document.querySelector('#networkCheckbox');
    const hideFilesCheckbox = document.querySelector('#hideFilesCheckbox');
    const hideNetworksCheckbox = document.querySelector('#hideNetworksCheckbox');
    const hideProcessCheckbox = document.querySelector('#hideProcessCheckBox');
    const childrenAmountInput = document.querySelector('#NumberChildren');
    const layerInput = document.querySelector('#layerInput')
   
   
    let dataForTree = {}
    let activeNode = null;
    let maxDepthLimit = 2; 
    let currentDepth = 0; //current depth of the graph
    let maxChildren = 30; //maximum number of children to display


    layerInput.addEventListener('change', function (){ //update max depth limit based on input
        maxDepthLimit = parseInt(layerInput.value, 10) || 2;


    });


    childrenAmountInput.addEventListener('change', function () { //update max children count based on input
        maxChildren = parseInt(childrenAmountInput.value, 10) || 10;
    });


    function updateNodeOpacity(d) { // function to change the opacity of a node based on its depth in the graph
        if (d === activeNode || (d.parent && d.parent === activeNode)){ //fully visible if the node or its parent is active
            return 1;
        }
        else if (d.depth >= currentDepth - maxDepthLimit) {
            return 1; // fully visible if within the depth limit
        } else {
            const fadeDepth = currentDepth - maxDepthLimit - d.depth;
            return Math.max(0, 1 - (fadeDepth / maxDepthLimit)); // fade based on depth
        } 
    }


    function updateEdgeOpacity(d) { // function to change the opacity of edges
        const sourceOpacity = updateNodeOpacity(d.source);
        const targetOpacity = updateNodeOpacity(d.target);
   
        return Math.min(sourceOpacity, targetOpacity);
    }
     
    function getVisibility(d) { //  hides node if opacity goes below a certain 
        const opacity = updateNodeOpacity(d);
        return opacity <= 0.1 ? "hidden" : "visible";
    }


    function updateCurrentDepth(rootData){ 
        console.log("updating current depth:", currentDepth);
        currentDepth = 0;
        rootData.each(d =>{
            if (d.depth > currentDepth){
                currentDepth = d.depth;
            }
        });
        console.log("current depth:", currentDepth);
    }


    async function performSearch(input) {
       
        let result = await search(input);
        console.log("Search Result:", result);
        return result;


    }


    async function performsSearchChildProcess(guid, pid, parent_pid, numChildren) {
        let result = await searchChildProcess(guid, pid, parent_pid, numChildren);
        console.log("Child Process Result:",result);
        return result;




    }
    async function performsSearchParentProcess(guid, pid, path, child_guid) {
        let result = await searchParentProcess(guid, pid, path, child_guid);
        console.log("Parent Process Result:",result);
        return result;
    }

    searchButton.addEventListener('click', function() {
        const inputValue = textBox.value;
        performSearch(inputValue).then(edge => {
            console.log(edge)
            let source = edge["_source"];
            let data = {
                "name": source["process_path"],
                "_id": source["_id"],
                "type": "process", // All things searched must be processes
                "process_pid": source["process_pid"],
                "process_guid": source["process_guid"],
                "parent_guid": source["parent_guid"],
                "parent_pid": source["parent_pid"],
                "parent_path": source["parent_path"],
                "children_info": source["childproc_guid"] ? [[source["childproc_guid"], source["childproc_pid"]]] : [],                
                "action": source["action"],
                "filemod_name": source["filemod_name"] ? source["filemod_name"] : [],
                "remote_ip": source["remote_ip"] ? source["remote_ip"] : [],
                "children": [],
                "_children": [],
                "parent": "",
            };




            dataForTree = data;
            toggleParent(data, false);




        });
    });


    let canvas = d3.select("#svgContainer").append("svg")
        .attr("width", "100%")
        .attr("height", "calc(100% - 40px)")
        .call(d3.zoom().on("zoom",
            function (event) {
                canvas.attr("transform", 
                    event.transform);
                }))                
                 
        .append("g")


    let tree = d3.tree().size([1000, 1000])
    .nodeSize([150, 300]);
    let data = {};
   
    function update(rootData) {
        canvas.selectAll("*").remove(); // Clear the canvas for redraw


        let root = d3.hierarchy(rootData);
        tree(root);


        updateCurrentDepth(root);


        let maxLabelLength = 0;
        root.each(d => {
            maxLabelLength = Math.max(maxLabelLength,d.data.name.length);
        });

        let dynamicWidth = Math.min(15 * maxLabelLength, 1000); //set edge length
        tree.nodeSize([25, dynamicWidth]); //set space between nodes


        let nodes = root.descendants();
        let links = root.links();


        let linkFunction = d3.linkHorizontal()
            .x(function(d) { return d.y; })
            .y(function(d) { return d.x; });
           
           
        canvas.selectAll(".link") //Draw the edges
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#ADADAD")
        .style("stroke-width",1)
        .style("opacity", function(d){ return updateEdgeOpacity(d); })
        .attr("d", linkFunction);


        let node = canvas.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append('g')
            .attr("class", "node")
            .attr("transform", function (d){return "translate("+ (d.y + (d.depth * 5 )) + ","+ d.x + ")";}) //position the nodes
            .style("opacity", function(d){ return updateNodeOpacity(d); })
            .style("display", function(d){return getVisibility(d);})
            .on("click", nodeClick);

           
        node.append("text") // use icons to represent nodes
        .attr("class", "fa")
        .attr("dx", 0)
        .attr("dy", 6)
        .text(function (d) {
            switch (d.data.type) {
                case "file":
                    return "\uf15c"; // File icon
                case "network":
                    return "\uf519"; // Network icon
                case "process":
                    return "\uf085"; // process icon

            }
        })
        .attr('font-family', 'FontAwesome')
        .attr('fill', function(d) {
            switch (d.data.type) {
                case "file":
                    return "red"; // file icon color
                case "network":
                    return "green"; //  network icon color
                case "process":
                    return "purple"; // process icon color
            }
        });
        

           
        node.append("title")
            .text(function(d) {
                return d.data.type;
            })  

        node.append("text")
            .text(function(d){return ( d.data.name);})
            .attr("dx", 14)
            .attr("dy", 5)
            .style("font-size","12px")
            .style("text-anchor","start");


        createKey();

    }


    function toggleFiles() {
        let shouldHideFiles = document.getElementById('hideFilesCheckbox').checked;
   
        // Traverse all nodes and toggle hidden property based on type: "file"
        let nodes = canvas.selectAll(".node");
        nodes.each(function (d) {
            if (d.data.type === "file") {
                d3.select(this).style("display", shouldHideFiles ? "none" : "block");
            }
        });


        let links = canvas.selectAll(".link");
        links.each(function (d) {
            if (d.source.data.type === "file" || d.target.data.type === "file") {
                d3.select(this).style("display", shouldHideFiles ? "none" : "block");


            }
   
        });


    }


    function toggleNetworks() {
        let shouldHideNetworks = document.getElementById('hideNetworksCheckbox').checked;
   
        let nodes = canvas.selectAll(".node");
        nodes.each(function (d) {
            if (d.data.type === "network") {
                d3.select(this).style("display", shouldHideNetworks ? "none" : "block");
            }
        });


        let links = canvas.selectAll(".link");
        links.each(function (d) {
            if (d.source.data.type === "network" || d.target.data.type === "network") {
                d3.select(this).style("display", shouldHideNetworks ? "none" : "block");


            }


        });


    }


    function toggleProcess() {
        let shouldHideProcess = document.getElementById('hideProcessCheckbox').checked;
   
        let nodes = canvas.selectAll(".node");
        nodes.each(function (d) {
            if (d.data.type === "process") {
                d3.select(this).style("display", shouldHideProcess ? "none" : "block");
            }
        });


        let links = canvas.selectAll(".link");
        links.each(function (d) {
            if (d.source.data.type === "process" || d.target.data.type === "process") {
                d3.select(this).style("display", shouldHideProcess ? "none" : "block");


            }

        });

    }

    document.getElementById('hideFilesCheckbox').addEventListener('change', toggleFiles);
    document.getElementById('hideNetworksCheckbox').addEventListener('change', toggleNetworks);
    document.getElementById('hideProcessCheckbox').addEventListener('change', toggleProcess);

    async function toggleChildren(d, file = false, network = false) {
        console.log(d)          
        if (d.data.children) {//if the node already has children
            d.data._children = d.data.children;
            d.data.children = null;            
        } else {
            d.data.children = d.data._children || [];            
            d.data._children = null;
            let childrenToAdd = [];    
            if ( d.data.children.length <= 1 && d.data.children_info && d.data.children_info.length > 0) { // Only fetch if there are no children loaded yet                
               
                let childrenData = [];
                let searchPromises = [];




                for (let i = 0; i < d.data.children_info.length; i++) {
                    let childInfo = d.data.children_info[i];
                    searchPromises.push(performsSearchChildProcess(childInfo[0], childInfo[1], d.data.process_pid, 10000));
                }




                const results = await Promise.all(searchPromises);
                childrenData = results.flat();

                console.log(childrenData)
                var uniqueChildren = {}

                for(let i = 0; i<childrenData.length; i++){                    
                    let uniqueId = childrenData[i]["_source"]["process_path"]+childrenData[i]["_source"]["process_pid"]
                    if (!(uniqueId in uniqueChildren))
                    {
                        childrenData[i]["_source"]["filemod_name"] = !childrenData[i]["_source"]["filemod_name"] ? [] : [childrenData[i]["_source"]["filemod_name"]];
                        childrenData[i]["_source"]["remote_ip"] = !childrenData[i]["_source"]["remote_ip"] ? [] : [childrenData[i]["_source"]["remote_ip"]];
                        childrenData[i]["_source"]["children_info"] = !childrenData[i]["_source"]["childproc_guid"] ? [] : [[childrenData[i]["_source"]["childproc_guid"], childrenData[i]["_source"]["childproc_pid"]]];


                        uniqueChildren[uniqueId] = childrenData[i]                                                
                    }
                    else {
                        if (childrenData[i]["_source"]["remote_ip"] && !uniqueChildren[uniqueId]["_source"]["remote_ip"].includes(childrenData[i]["_source"]["remote_ip"]))
                        {
                            uniqueChildren[uniqueId]["_source"]["remote_ip"].push(childrenData[i]["_source"]["remote_ip"])                            
                        }

                        if (childrenData[i]["_source"]["filemod_name"] && !uniqueChildren[uniqueId]["_source"]["filemod_name"].includes(childrenData[i]["_source"]["filemod_name"]))
                        {
                            uniqueChildren[uniqueId]["_source"]["filemod_name"].push(childrenData[i]["_source"]["filemod_name"])                            
                        }

                        if (childrenData[i]["_source"]["childproc_guid"] && !uniqueChildren[uniqueId]["_source"]["children_info"].includes([childrenData[i]["_source"]["childproc_guid"], childrenData[i]["_source"]["childproc_pid"]]))
                        {
                            uniqueChildren[uniqueId]["_source"]["children_info"].push([childrenData[i]["_source"]["childproc_guid"], childrenData[i]["_source"]["childproc_pid"]])
                            console.log("NOT NULL")
                        }
                    }
                }                                          
               
                Object.keys(uniqueChildren).forEach(function(key) {                    
                    let child = uniqueChildren[key]
                    let childSource = child["_source"];
                    childrenToAdd.push({
                        name: childSource["process_path"],
                        id: childSource["_id"],
                        type: "process",
                        process_pid: childSource["process_pid"],
                        process_guid: childSource["process_guid"],
                        parent_guid: childSource["parent_guid"],
                        parent_pid: childSource["parent_pid"],
                        parent_path: childSource["parent_path"],
                        children_info: childSource["children_info"],                        
                        action: childSource["action"],
                        filemod_name: childSource["filemod_name"],
                        remote_ip: childSource["remote_ip"],
                        children: [],
                        _children: [],
                        parent: d.data
                    });
                });                
            }

            if (d.data.filemod_name && d.data.filemod_name.length > 0 && file)
            {                    
                d.data.filemod_name.forEach(function(filemod) {
                    childrenToAdd.push({
                        name: filemod,
                        type: "file",
                        parent: d.data
                    });
                });
            }


            if (d.data.remote_ip && d.data.remote_ip.length > 0 && network)
            {                    
                d.data.remote_ip.forEach(function(ip) {
                    childrenToAdd.push({
                        name: ip,
                        type: "network",                    
                        parent: d.data
                    });
                });


            }
            d.data.children = childrenToAdd.slice(0, maxChildren);
            if(childrenToAdd.length > maxChildren) {
                d.data._children = childrenToAdd.slice(maxChildren);
            }      
        }        


        updateCurrentDepth(d3.hierarchy(dataForTree));
        update(dataForTree);
    }


    async function toggleParent(d, node = true) {
        let parent_guid = "";
        let parent_pid = "";
        let parent_path = "";
        let process_guid = "";
        let parent = ""
        let parentNode;
        if (!node){
            parent_guid = d.parent_guid;
            parent_pid = d.parent_pid;
            parent_path = d.parent_path;
            process_guid = d.process_guid;
            parent = d.parent;
        }
        else {
            parent_guid = d.data.parent_guid;
            parent_pid = d.data.parent_pid;
            parent_path = d.data.parent_path;
            process_guid = d.data.process_guid;
            parent = d.data.parent;
        }


        // First, check if the node is the root or treated as such in the visualization
        if (!parent || d === dataForTree) {
            let parentData = await performsSearchParentProcess(parent_guid, parent_pid, parent_path, process_guid)                
            let parentSource = parentData[0]["_source"];            
           
            parentNode = {
                name: parentSource["process_path"],                
                process_pid: parentSource["process_pid"],
                process_guid: parentSource["process_guid"],
                parent_guid: parentSource["parent_guid"],
                parent_pid: parentSource["parent_pid"],
                parent_path: parentSource["parent_path"],
                children_info: parentSource["childproc_guid"] ? [[parentSource["childproc_guid"], parentSource["childproc_pid"]]] : [],
                action: parentSource["action"],
                type: "process",
                children: [],
                _children: [],
                parent: ""


            };
           
            if (!node){
                d.parent = parentNode;
                console.log(parentNode)
                parentNode.children.push(d);                  
            }
            else{
                d.data.parent = parentNode;
                parentNode.children.push(dataForTree);
            }
            dataForTree = parentNode;
        } else {
            // If the node already has a parent, you might want to log a message or handle it differently
            console.log("Node already has a parent.");
        }
   
        updateCurrentDepth(d3.hierarchy(dataForTree));
        update(dataForTree);
    }


    function nodeClick(event, d) {

        const node = d3.select(this);
        const currentOpacity = node.style("opacity");

        if(currentOpacity < 1) { // brings a vanishing node back to full opacity once it is clicked by the user
            node.style("opacity", 1);
            node.selectAll(".link").style("opacity", 1);
            node.selectAll(".node")
            .filter(n => n.parent === d || n === d.parent).style("opacity", 1);
            event.stopPropgation();
            return;
        }

        var reverse = checkbox.checked
        var file = fileCheckBox.checked
        var network = networkCheckBox.checked


        file = file ? true : false;
        network = network ? true : false; 
   
        if(reverse){
            toggleParent(d);
        }else{            
            toggleChildren(d, file, network);
        }
       
        if (activeNode ===d) {
            hideDialogBox();
            activeNode = null;
           
        } else {
            showDialogBox(event, d);
            activeNode = d;
           
        }


        update(dataForTree);
    }
    
    function makeDialogBoxDraggableAndResizable() {
        const dialogBox = document.getElementById('dialogBox');
        let isDragging = false;
        let isResizing = false;
        let offsetX = 0, offsetY = 0;
        let startWidth = 0, startHeight = 0, startX = 0, startY = 0;
    
        dialogBox.addEventListener('mousedown', function (e) {
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                startWidth = dialogBox.offsetWidth;
                startHeight = dialogBox.offsetHeight;
                startX = e.clientX;
                startY = e.clientY;
            } else {
                isDragging = true;
                offsetX = e.clientX - dialogBox.getBoundingClientRect().left;
                offsetY = e.clientY - dialogBox.getBoundingClientRect().top;
            }
        });
    
        document.addEventListener('mousemove', function (e) {
            if (isDragging) {
                dialogBox.style.left = `${e.clientX - offsetX}px`;
                dialogBox.style.top = `${e.clientY - offsetY}px`;
            } else if (isResizing) {
                const newWidth = startWidth + (e.clientX - startX);
                const newHeight = startHeight + (e.clientY - startY);
                dialogBox.style.width = `${Math.max(newWidth, 100)}px`; 
                dialogBox.style.height = `${Math.max(newHeight, 100)}px`; 
            }
        });
    
        document.addEventListener('mouseup', function () {
            isDragging = false;
            isResizing = false;
        });
    }
    
    makeDialogBoxDraggableAndResizable();
    

    function showDialogBox(event, d) {
        console.log('Node Data:', d.data);
        const dialogBox = document.getElementById('dialogBox');
        dialogBox.innerHTML = `
            <h3>Vertex Info</h3>
            <table>
            <tr><td><strong>Key</strong></td><td> <strong>Value</strong></td></tr>
            <tr><td><strong>name:</strong></td><td> ${d.data.name}</td></tr>
             <tr><td><strong>label:</strong></td><td> ${d.data.type}</td></tr>
             <tr><td><strong>PID:</strong></td><td> ${d.data.process_pid}</td></tr>
             <tr><td><strong>GUID:</strong></td><td> ${d.data.process_guid}</td></tr>
             <tr><td><strong>Parent PID:</strong></td><td> ${d.data.parent_pid}</td></tr>
             <tr><td><strong>Parent GUID:</strong></td><td> ${d.data.parent_guid}</td></tr>
             <tr><td><strong>Action:</strong></td><td> ${d.data.action}</td></tr>
            <tr><td><strong>File Mod Name:</strong></td><td> ${d.data.filemod_name}</td></tr>
             <tr><td><strong>Remote IP:</strong></td><td> ${d.data.remote_ip}</td></tr>
        `;

        dialogBox.classList.remove('hidden');
        dialogBox.style.display = 'block';
    }

    function hideDialogBox() {
        const dialogBox = document.getElementById('dialogBox');
        dialogBox.classList.add('hidden');
        dialogBox.style.display = 'none';
    }

    function createKey() {
        let keyGroup = canvas.append("g")
            .attr("transform", "translate(50, 500)");

            keyGroup.append("text")
            .attr("x", 100)
            .attr("y", 15)
            .text("\uf085")  // Process icon
            .attr('font-family', 'FontAwesome')
            .attr('font-size', '20px')
            .attr("fill", "purple");
    
        keyGroup.append("text")
            .attr("x", 50)
            .attr("y", 15)
            .text("Process");
    
        keyGroup.append("text")
            .attr("x", 210)
            .attr("y", 20)
            .text("\uf519")  // Network icon
            .attr('font-family', 'FontAwesome')
            .attr('font-size', '20px')
            .attr("fill", "green");
    
        keyGroup.append("text")
            .attr("x", 150)
            .attr("y", 15)
            .text("Network");
    
        keyGroup.append("text")
            .attr("x", 280)
            .attr("y", 15)
            .text("\uf15c")  // File icon
            .attr('font-family', 'FontAwesome')
            .attr('font-size', '20px')
            .attr("fill", "red");
    
        keyGroup.append("text")
            .attr("x", 250)
            .attr("y", 15)
            .text("File");
    }


    updateCurrentDepth(d3.hierarchy(dataForTree));
    update(data); // Initial drawing of the tree
});
