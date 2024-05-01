const PORT = 3000 // Edit this PORT constant based off whatever port you decide to use in server.js

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

export async function searchChildProcess(guid, pid, parent_pid, size) {
    try {
        const queryParams = new URLSearchParams({
            guid: encodeURIComponent(guid),
            pid: encodeURIComponent(pid),    
            parent_pid: encodeURIComponent(parent_pid),            
            size: encodeURIComponent(size)
        }).toString();

        const url = `http://localhost:${PORT}/search_child_process?${queryParams}`;

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
        
        const url = `http://localhost:${PORT}/search_parent_process?${queryParams}`;

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
