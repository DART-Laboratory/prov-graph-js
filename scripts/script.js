const PORT = 3000; //Default port for server.js
import {search, searchChildProcess, searchParentProcess} from './Graphio.js';
document.addEventListener('DOMContentLoaded', function () {
    const searchButton = document.querySelector('#searchButton');
    const textBox = document.querySelector('#inputField');
    const checkbox = document.querySelector('#reverseCheckbox');
    let dataForTree = {}

    async function performSearch(input) {
        return await search(input);
    }

    async function performsSearchChildProcess(input) {
        return await searchChildProcess(input);
    }
    async function performsSearchParentProcess(guid, pid, path, child_guid) {
        return await searchParentProcess(guid, pid, path, child_guid);
    }

    searchButton.addEventListener('click', function() {
        const inputValue = textBox.value;
        performSearch(inputValue).then(edge => {
            let source = edge["_source"];
            let data = {
                "name": edge["_id"],
                "process_pid": source["process_pid"],
                "process_guid": source["process_guid"],
                "parent_guid": source["parent_guid"],
                "parent_pid": source["parent_pid"],
                "parent_path": source["parent_path"],
                "childproc_guid": source["childproc_guid"],
                "type": source["action"],
                "children": [],
                "_children": [],
                "parent": "",
            };
            dataForTree = data
            update(dataForTree);
        });
    });

    let canvas = d3.select("#svgContainer").append("svg")
        .attr("width", "100%")
        .attr("height", "calc(100% - 40px)")
        .append("g")
        .attr("transform", "translate(50, 50)");

    let tree = d3.tree().size([400, 400]);
    let data = {};

    function update(rootData) {
        canvas.selectAll("*").remove(); // Clear the canvas for redraw

        let root = d3.hierarchy(rootData);
        tree(root);
        let nodes = root.descendants();
        let links = root.links();

        let linkFunction = d3.linkHorizontal()
            .x(function(d) { return d.y; })
            .y(function(d) { return d.x; });

        canvas.selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#ADADAD")
            .attr("d", linkFunction);

        let node = canvas.selectAll(".node")
            .data(nodes)
            .enter()
            .append('g')
            .attr("class", "node")
            .attr("transform", function (d){return "translate("+ d.y + ","+ d.x +")"})
            .on("click", nodeClick);

        node.append("circle")
            .attr('r',5)
            .attr("fill", colorByType);

        node.append("text")
            .text(function(d){return d.data.name;})
            .attr("dx", -10)
            .attr("dy", 20);

        createKey();
    }

    async function toggleChildren(d) {
        if (d.data.children) {//if the node already has children
            d.data._children = d.data.children;
            d.data.children = null;
        } else {
            d.data.children = d.data._children || [];
            d.data._children = null;
            if (!d.data.children.length) { // Only fetch if there are no children loaded yet
                // console.log("child guid: "+ d.data.childproc_guid);
                let childrenData = await performsSearchChildProcess(d.data.childproc_guid);

                let childrenToAdd = [];                
                for (let i=0; i<childrenData.length; i++) {
                    let child = childrenData[i]                    
                    let childSource = child["_source"];
                    childrenToAdd.push({
                        name: child["_id"],
                        process_pid: childSource["process_pid"],
                        process_guid: childSource["process_guid"],
                        parent_guid: childSource["parent_guid"],
                        parent_pid: childSource["parent_pid"],
                        parent_path: childSource["parent_path"],
                        childproc_guid: childSource["childproc_guid"],
                        type: childSource["action"],
                        children: [],
                        parent: ""
                    });
                    console.log("Childrentoadd arr: "+ childrenToAdd[0]);
                }
                d.data.children = childrenToAdd
            }
        }        
        update(dataForTree);
    }
    async function toggleParent(d) {
        // First, check if the node is the root or treated as such in the visualization
        if (!d.data.parent || d === dataForTree) {
            // console.log(d);
            // console.log("PROCESS_GUID " + d.data.process_guid);
            // console.log("PARENT_GUID " + d.data.parent_guid);
            // console.log("PARENT_PID " + d.data.parent_pid);
            // console.log("PARENT_PATH " + d.data.parent_path);
            // console.log("PROCESS_PID " + d.data.process_pid);

            let parentData = await performsSearchParentProcess(d.data.parent_guid, d.data.parent_pid, d.data.parent_path, d.data.process_guid)                                    
            let parentSource = parentData[0]["_source"];
            
            parent = {
                name: parentData[0]["_id"], 
                process_pid: parentSource["process_pid"],
                process_guid: parentSource["process_guid"],
                parent_guid: parentSource["parent_guid"],
                parent_pid: parentSource["parent_pid"],
                parent_path: parentSource["parent_path"],
                childproc_guid: parentSource["childproc_guid"],
                type: parentSource["action"],
                children: [],
            };
            console.log(parentData[0]["_id"])
            d.data.parent = parent                   
        } else {
            // If the node already has a parent, you might want to log a message or handle it differently
            console.log("Node already has a parent.");
        }
        update(dataForTree);
    }

    function nodeClick(event, d) {
        const reverse = checkbox.checked
        if(reverse){
            toggleParent(d);
        }else{            
            toggleChildren(d);
        }

    }

    function colorByType(d) {
        switch (d.data.type) {
            case "process": return "purple";
            case "network": return "green";
            case "file": return "red";
            default: return "steelblue";
        }
    }

    function createKey() {
        let keyGroup = canvas.append("g")
            .attr("transform", "translate(50, 500)"); // Adjust the position as needed
        keyGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "steelblue");

        keyGroup.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text("Process");

        keyGroup.append("rect")
            .attr("x", 100)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "green");

        keyGroup.append("text")
            .attr("x", 130)
            .attr("y", 15)
            .text("Network");

        keyGroup.append("rect")
            .attr("x", 200)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "red");

        keyGroup.append("text")
            .attr("x", 230)
            .attr("y", 15)
            .text("File");
    }

    update(data); // Initial drawing of the tree
});
