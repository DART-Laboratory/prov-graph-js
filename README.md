# Provenance-Graph

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (VS Code extension)

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/your-username/your-repository.git
    ```

2. Check and make sure that your working directory ends in `/prov-graph-js` (if not, use `cd` and `ls`):

    ```sh
    pwd
    ```
    ![Working Directory](https://github.com/DART-Laboratory/prov-graph-js/assets/123529704/648da3cf-eb6f-4791-ab85-f97dcd979ffc)

3. Install the project dependencies:

    ```sh
    npm install
    ```
    or
    ```sh
    npm i
    ```
    ![Dependencies Installed](https://github.com/DART-Laboratory/prov-graph-js/assets/123529704/c9801624-183f-4e51-b6ac-e4e633d8a5fb)

    This should create a **node_modules** folder.

## Running the Server

1. Connect to the VPN:
    ![VPN Connection](https://github.com/DART-Laboratory/prov-graph-js/assets/123529704/734d1b23-db16-444b-bcac-d2eb2a8fb15f)

2. Start the server:

    ```sh
    node server.js
    ```

    You should see the following output in the console:

    ```sh
    running on port xxxx
    ```
    ![Server Running](https://github.com/DART-Laboratory/prov-graph-js/assets/123529704/e20ebda9-ad4a-4934-bb8d-a48e9603dfeb)

## Launching the Project

1. Open `tree.html` with Live Server:

    - Right-click on `tree.html` in VS Code and select "Open with Live Server".

    or

    - Use the command palette (`Ctrl+Shift+P`) and type `Live Server: Open with Live Server`.
    ![Open with Live Server](https://github.com/DART-Laboratory/prov-graph-js/assets/123529704/ded38838-96ae-462c-9695-d6a1f22d7906)
    ![Live Server Output](https://github.com/DART-Laboratory/prov-graph-js/assets/123529704/a4eec1de-7f20-44a9-a6a0-27e4d93ec725)

## Using the Project

### Search

1. Enter an event ID and number of layers into the respective input fields (to test, you can use `HcLR0ooBBBvBsP_nxiNu` and '4'):
    ![Enter Event ID](https://github.com/DART-Laboratory/prov-graph-js/blob/main/images/search.png)

2. Click the search button to begin:
    ![Search Button](https://github.com/DART-Laboratory/prov-graph-js/blob/main/images/clicksearchtobegin.png)
    The screen should have two nodes, the node on the right represents the current process, and the node on the left represents the parent process.

### Explore the Graph

1. Clicking on a leaf node will generate any child processes and display a dialog box with the necessary information about that node:
    ![Child Processes](https://github.com/DART-Laboratory/prov-graph-js/blob/main/images/explorethegraph.png)

2. Clicking on a parent node will minimize the graph:
    ![Minimize Graph](https://github.com/DART-Laboratory/prov-graph-js/blob/main/images/explorethegraph2.png)

3. Selecting the reverse box and clicking on a node will generate the parent process:
    ![Parent Process](https://github.com/DART-Laboratory/prov-graph-js/blob/main/images/explorethegraph3.png)

4. Selecting the file or network box and clicking on a node will generate any child files or networks as well:
    ![Child Files or Networks](https://github.com/DART-Laboratory/prov-graph-js/blob/main/images/generateChildProcesses.png)

5. Selecting the Hide File, Hide Process or Hide Network checkboxes will hide all nodes of that nature:
    ![Hide Nodes] (https://github.com/DART-Laboratory/prov-graph-js/blob/main/images/HideFile.png)

## Contributing

If you wish to contribute to this project, please follow the [contributing guidelines](CONTRIBUTING.md).
