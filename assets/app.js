const TRELLO_API = "https://api.trello.com/1";
const TRELLO_API_PARALLEL_LIMIT = 300/2;
const TRELLO_API_PARALLEL_TIME_LIMIT = 10*1000;
const TRELLO_API_KEY = "5bb9050954a2a56e7a5f22bc41c76b3a";
let TRELLO_API_TOKEN = null;

if(location.hash) {
    let params = location.hash.substring(1).split("&");
    for(let param of params) {
        param = param.split("=");
        if(param[0] == "token") {
            TRELLO_API_TOKEN = param[1];
        }
    }
}

if(TRELLO_API_TOKEN == null)
    location.href = "https://students.fim.uni-passau.de/~dietrich/trello-export/";
else {
    const trello_boards = document.getElementById("trello-boards");
    trello_boards.innerHTML = "";
    api("/members/me/boards").then(boards => {
        for(let board of boards) {
            let board_a = document.createElement("a");
            board_a.classList.add("trello-board");
            board_a.innerText = board.name;
            board_a.onclick = () => {
                exportBoard(board).then(() => {
                    hide_all();
                    document.getElementById("finish").style.display = "block";
                });
            };
            trello_boards.appendChild(board_a);
        }
        document.getElementById("choose-board").style.display = "block";
    });
}

function hide_all() {
    for(let main of document.getElementsByTagName("main"))
        main.style.display = "";
}

async function api(url) {
    let response = await fetch(TRELLO_API + url + (url.includes("?") ? "&" : "?") +"key=" + TRELLO_API_KEY + "&token=" + TRELLO_API_TOKEN);
    if(response.status != 200)
        location.href = "https://students.fim.uni-passau.de/~dietrich/trello-export/";
    return await response.json();
}

async function exportBoard(board) {
    hide_all();
    document.getElementById("convert").style.display = "block";
    function board_api(url) {
        return api("/boards/" + board["id"] + url);
    }
    async function fetch_all(url) {
        let page = 0;
        let result = [], lastResult = null;
        do {
            lastResult = await board_api(url + "?limit=1000&page=" + page++);
            result.push(...lastResult);
        } while(lastResult.length == 1000);
        return result;
    }
    board["actions"] = [];
    board["cards"] = await board_api("/cards/all"); // misses stuff
    board["labels"] = await board_api("/labels?limit=1000");
    board["lists"] = await board_api("/lists?filter=all");
    board["lists"].forEach(list => {
        list["creationMethod"] = null;
        list["idOrganization"] = board["idOrganization"];
        list["limits"] = {
            "cards": {
                "openPerList": board["limits"]["cards"]["openPerList"],
                "totalPerList": board["limits"]["cards"]["totalPerList"]
            }
        };
        list["nodeId"] = "ari:cloud:trello::list/workspace/" + board["idOrganization"] + "/" + list["id"];
    });
    board["members"] = await board_api("/members"); // misses stuff
    board["checklists"] = await board_api("/checklists");
    board["checklists"].forEach(checklist => {
        checklist["creationMethod"] = null;
        checklist["limits"] = {
            "checkItems": {
                "perChecklist": board["limits"]["checkItems"]["perChecklist"]
            }
        };
    });
    board["customFields"] = await board_api("/customFields");
    board["memberships"] = await board_api("/memberships");
    board["pluginData"] = await api("/organizations/" + board["idOrganization"] + "/pluginData");
    let i = 0;
    for(card of board["cards"]) {
        card["address"] = null;
        card["coordinates"] = null;
        card["creationMethod"] = null;
        card["idOrganization"] = board["idOrganization"];
        card["locationName"] = null;
        card["nodeId"] = "ari:cloud:trello::card/workspace/" + board["idOrganization"] + "/" + card["id"];
        card["staticMapUrl"] = null;
        card["attachments"] = await api("/cards/" + card["id"] + "/attachments");
        card["pluginData"] = await api("/organizations/" + board["idOrganization"] + "/pluginData");
        card["customFieldItems"] = await api("/cards/" + card["id"] + "/customFieldItems");
        card["limits"] = {
            "attachments": {
                "perCard": board["limits"]["attachments"]["perCard"]
            },
            "checklists": {
                "perCard": board["limits"]["checklists"]["perCard"]
            },
            "stickers": {
                "perCard": board["limits"]["stickers"]["perCard"]
            }
        };
        let lastActions = [];
        let page = 0;
        do {
            lastActions = await api("/cards/" + card["id"] + "/actions?filter=all&page=" + page++);
            board["actions"].push(...lastActions);
        } while(lastActions.length == 50);
        document.getElementById("progress").innerText = "Progress: " + i + "/" + board["cards"].length + " Cards (" + (i/board["cards"].length * 100).toFixed(2) + "%)";
        i++
    };
    console.log(JSON.stringify(board));
    let a = document.createElement("a");
    let url = URL.createObjectURL(new Blob([JSON.stringify(board)], {type: "application/json;charset=utf-8"}));
    a.href = url;
    a.download = "trello-export.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);  
    }, 0); 
    return board;
}