const config = require('./config.json');
const dbConfig = config.databases[0]
const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors')

const app = express();
app.use(cors());
const clientURL = 'http://elastic:stimulus5affect-roof@beryl.cs.virginia.edu:9200'
const client = new Client({
    node: clientURL,
});

// Define a route for a sample Elasticsearch operation
app.get('/search', async (req, res) => {
    try {
        const { id } = req.query;
        const executedQuery = {
            index: 'atlasv2-edr-h1-s4',
            body: {
                query: {
                    match: {
                        _id: id//'XcLR0ooBBBvBsP_nxiN9' "HcLR0ooBBBvBsP_nxiNu"
                    }
                }
            }
        };
        var response = await client.search(executedQuery);
        const data = response.hits.hits;        
        res.json(data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.get('/searchbypid', async (req, res) => {
    try {
        const { id } = req.query;
        const executedQuery = {
            index: dbConfig.name,
            body: {
                query: {
                    match: {
                        process_pid: id//'XcLR0ooBBBvBsP_nxiN9'
                    }
                }
            }
        };
        var response = await client.search(executedQuery);
        const data = response.hits.hits;        
        res.json(data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.get('/searchparent', async (req, res) => {
    try {
        const { id } = req.query;
        const executedQuery = {
            index: dbConfig.name,
            body: {
                query: {
                    match: {
                        parent_guid: id//'XcLR0ooBBBvBsP_nxiN9'
                    }
                },
                size: 100
            }
        };
        var response = await client.search(executedQuery);
        const data = response.hits.hits;        
        res.json(data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.get('/searchparentbypid', async (req, res) => {
    try {
        const { id } = req.query;
        const executedQuery = {
            index: dbConfig.name,
            body: {
                query: {
                    match: {
                        parent_pid: id//'XcLR0ooBBBvBsP_nxiN9'
                    }
                },
                size: 100
            }
        };
        var response = await client.search(executedQuery);
        const data = response.hits.hits;        
        res.json(data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.get('/searchprocesspid', async (req, res) => {
    try {
        const { id } = req.query;
        const executedQuery = {
            index: dbConfig.name,
            body: {
                query: {
                    match: {
                        process_pid: id//'XcLR0ooBBBvBsP_nxiN9'
                    }
                },
                size: 100
            }
        };
        var response = await client.search(executedQuery);
        const data = response.hits.hits;        
        res.json(data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Query to search for the child process of the current process using the current process' guid
app.get('/search_child_process_by_guid', async (req, res) => {
    try {
        const { guid } = req.query;
        const executedQuery = {
            index: dbConfig.name,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                // match: {
                                //     parent_guid: guid 
                                // }
                                match: {
                                    process_guid: guid
                                }
                            },
                            {
                                match: {
                                    action: dbConfig.process.create
                                }
                            }
                        ]
                    }
                },
                size: 10
            }
        };
        var response = await client.search(executedQuery);
        const data = response.hits.hits;        
        res.json(data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Query to search for the parent process of the current process using the current process' parent_guid
app.get('/search_parent_process_by_guid', async (req, res) => {
    try {
        const { guid, pid, path, child_guid} = req.query;
        const executedQuery = {
            index: dbConfig.name,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match: {
                                    process_guid: guid 
                                }
                            },
                            {
                                match: {
                                    process_pid: pid
                                }
                            },
                            {
                                match: {
                                    process_path: path
                                }
                            },
                            {
                                match: {
                                    childproc_guid: child_guid
                                }
                            }
                        ]
                    }
                },
                size: 10
            }
        };
        var response = await client.search(executedQuery);
        const data = response.hits.hits;        
        res.json(data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// const PORT = 3000;
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
