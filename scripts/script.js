const PORT = 3000; //Default port for server.js
import {search, searchChildProcess, searchParentProcess} from './Graphio.js';
document.addEventListener('DOMContentLoaded', function () {
    const searchButton = document.querySelector('#searchButton');
    const textBox = document.querySelector('#inputField');
    const checkbox = document.querySelector('#reverseCheckbox');
    const fileCheckBox = document.querySelector('#fileCheckbox');
    const networkCheckBox = document.querySelector('#networkCheckbox');
    const childrenAmountInput = document.querySelector('#NumberChildren')
    let dataForTree = {}

    async function performSearch(input) {
        return await search(input);
    }

    async function performsSearchChildProcess(guid, pid, parent_pid, numChildren) {
        return await searchChildProcess(guid, pid, parent_pid, numChildren);
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

            toggleParent(data, false)
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

    async function toggleChildren(d, file = false, network = false) {
        console.log(d)           
        if (d.data.children) {//if the node already has children
            d.data._children = d.data.children;
            d.data.children = null;            
        } else {
            d.data.children = d.data._children || [];            
            d.data._children = null;
            let childrenToAdd = [];     
            if (d.data.children.length <= 1 && d.data.children_info && d.data.children_info.length > 0) { // Only fetch if there are no children loaded yet                
                
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
                        // name: child["_id"],
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
            d.data.children = childrenToAdd         
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
    
        update(dataForTree);
    }

    function nodeClick(event, d) {
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
            .attr("transform", "translate(50, 500)");
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
