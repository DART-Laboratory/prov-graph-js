const PORT = 3000; //Default port for server.js
import {search, searchChildProcess, searchParentProcess} from './Graphio.js';
document.addEventListener('DOMContentLoaded', function () {
    const searchButton = document.querySelector('#searchButton');
    const textBox = document.querySelector('#inputField');
    const checkbox = document.querySelector('#reverseCheckbox');
    const childrenAmountInput = document.querySelector('#NumberChildren')
    let dataForTree = {}

    async function performSearch(input) {
        return await search(input);
    }

    async function performsSearchChildProcess(guid, pid) {
        return await searchChildProcess(guid, pid);
    }
    async function performsSearchParentProcess(guid, pid, path, child_guid) {
        return await searchParentProcess(guid, pid, path, child_guid);
    }

    searchButton.addEventListener('click', function() {
        const inputValue = textBox.value;
        performSearch(inputValue).then(edge => {
            console.log(edge)
            let source = edge["_source"];
            let data = {
                "name": source["process_path"],
                "process_pid": source["process_pid"],
                "process_guid": source["process_guid"],
                "parent_guid": source["parent_guid"],
                "parent_pid": source["parent_pid"],
                "parent_path": source["parent_path"],
                "childproc_guid": source["childproc_guid"],
                "childproc_pid": source["childproc_pid"],
                "type": source["action"],
                "children": [],
                "_children": [],
                "parent": "",
            };
            // console.log(data);
            // console.log(data.parent_guid);
            toggleParent(data, false)
            // dataForTree = data
            // update(dataForTree);
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
        let numChildrenToGet =  childrenAmountInput.value;
        if (d.data.children || d.data.childproc_guid == null) {//if the node already has children
            d.data._children = d.data.children;
            d.data.children = null;
        } else {
            d.data.children = d.data._children || [];            
            d.data._children = null;
            if (!d.data.children.length || d.data.children.length === 1) { // Only fetch if there are no children loaded yet
                let childrenData = await performsSearchChildProcess(d.data.childproc_guid, d.data.childproc_pid, numChildrenToGet);
                let childrenToAdd = [];
                let numChildren = childrenData.length
                let existingChild = d.data.children.length ===1
                if(numChildren === numChildrenToGet && existingChild){
                    numChildren -=1
                }
                for (let i=0; i <numChildren; i++) {
                    let child = childrenData[i]                    
                    let childSource = child["_source"];
                    childrenToAdd.push({
                        name: childSource["process_path"],
                        process_pid: childSource["process_pid"],
                        process_guid: childSource["process_guid"],
                        parent_guid: childSource["parent_guid"],
                        parent_pid: childSource["parent_pid"],
                        parent_path: childSource["parent_path"],
                        childproc_guid: childSource["childproc_guid"],
                        childproc_pid: childSource["childproc_pid"],
                        type: childSource["action"],
                        children: [],
                        _children: [],
                        parent: ""
                    });
                    console.log("Childrentoadd arr: "+ childrenToAdd[0]);
                }
                if(existingChild){
                    let oldChild = d.data.children[0]
                    childrenToAdd.splice(Math.floor(childrenToAdd.length/2),0,oldChild)
                }
                d.data.children = childrenToAdd
            }
        }        
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
            // console.log(d);
            // console.log("PROCESS_GUID " + d.data.process_guid);
            // console.log("PARENT_GUID " + d.data.parent_guid);
            // console.log("PARENT_PID " + d.data.parent_pid);
            // console.log("PARENT_PATH " + d.data.parent_path);
            // console.log("PROCESS_PID " + d.data.process_pid);

            let parentData = await performsSearchParentProcess(parent_guid, parent_pid, parent_path, process_guid)                 
            let parentSource = parentData[0]["_source"];            
            
            parentNode = {
                name: parentSource["process_path"], 
                // name: parentData[0]["_id"],
                process_pid: parentSource["process_pid"],
                process_guid: parentSource["process_guid"],
                parent_guid: parentSource["parent_guid"],
                parent_pid: parentSource["parent_pid"],
                parent_path: parentSource["parent_path"],
                childproc_guid: parentSource["childproc_guid"],
                childproc_pid: parentSource["childproc_pid"],
                type: parentSource["action"],
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
