const PORT = 3000 // Edit this PORT constant based off whatever port you decide to use in server.js

// export function search(id) {
//     fetch(`http://localhost:${PORT}/search?id=${encodeURIComponent(id)}`).
//     then(response => response.json()).
//     then(data => {
//         if (data) {
//             console.log(data[0]["_source"]);
//             console.log(data[0]["_source"]["parent_guid"]);
//             console.log(data[0]["_source"]["process_guid"]);
//             console.log(data[0]["_source"]["process_pid"]);
//             console.log(data[0]["_source"]["childproc_pid"]);
//             console.log("hello")
//             return data[0]["_source"]["process_pid"];
//         } else {
//             console.log('No data found');
//             return null;
//         }
//     }).
//     catch(error => console.error('Error:', error));
// }
export function search(id) {
    return fetch(`http://localhost:${PORT}/search?id=${encodeURIComponent(id)}`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                return data[0];
            } else {
                console.log('No data found');
                return null;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            return Promise.reject(error);
        });
}

export function searchByPID(pid) {
    fetch(`http://localhost:${PORT}/searchbypid?id=${encodeURIComponent(pid)}`).
    then(response => response.json()).
    then(data => {
        if (data) {
            
            console.log(data);            
            return data[0];  
        } else {
            console.log('No data found');
            return null; 
        }
    }).
    catch(error => console.error('Error:', error));
}

export function searchParent(guid) {
    fetch(`http://localhost:${PORT}/searchparent?id=${encodeURIComponent(guid)}`).
    then(response => response.json()).
    then(data => {
        if (data) {
            
            console.log(data);            
            return data[0];  
        } else {
            console.log('No data found');
            return null; 
        }
    }).
    catch(error => console.error('Error:', error));
}

export function searchParentByPID(pid) {
    fetch(`http://localhost:${PORT}/searchparentbypid?id=${encodeURIComponent(pid)}`).
    then(response => response.json()).
    then(data => {
        if (data) {
            
            console.log(data);            
            return data[0];  
        } else {
            console.log('No data found');
            return null; 
        }
    }).
    catch(error => console.error('Error:', error));
}

export function searchProcessPID(pid) {
    fetch(`http://localhost:${PORT}/searchprocesspid?id=${encodeURIComponent(pid)}`).
    then(response => response.json()).
    then(data => {
        if (data) {
            
            console.log(data);            
            return data[0];  
        } else {
            console.log('No data found');
            return null; 
        }
    }).
    catch(error => console.error('Error:', error));
}

export async function searchChildProcess(guid) {
    try {
        const response = await fetch(`http://localhost:${PORT}/search_child_process_by_guid?guid=${encodeURIComponent(guid)}`);
        const data = await response.json();
        if (data) {
            return data;
        } else {
            console.log('No data found');
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function searchParentProcess(guid, pid, path, child_guid) {
    try {
        const queryParams = new URLSearchParams({
            guid: encodeURIComponent(guid),
            pid: encodeURIComponent(pid),
            path: encodeURIComponent(path),
            child_guid: encodeURIComponent(child_guid) 
        }).toString();
        
        const url = `http://localhost:${PORT}/search_parent_process_by_guid?${queryParams}`;

        const response = await fetch(url);
        const data = await response.json();
        if (data) {
            return data;
        } else {
            console.log('No data found');
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
