const TRELLO_API = "https://api.trello.com/1";
const TRELLO_API_PARALLEL_LIMIT = 300/2;
const TRELLO_API_PARALLEL_TIME_LIMIT = 10*1000;
const TRELLO_API_KEY = "696f8e34d0af4d8f0583c1ad82bd932b";
let TRELLO_API_TOKEN = null;

function trello_authorize() {
    location.href = "https://trello.com/1/authorize?response_type=token&key=" + TRELLO_API_KEY + "&redirect_uri=" + encodeURIComponent(location.origin + location.pathname) + "&callback_method=fragment&scope=read&expiration=1hour&name=Trello2GitLab%20Migrator";
}

async function api(url) {
    let response = await fetch(TRELLO_API + url + "?key=" + TRELLO_API_KEY + "&token=" + TRELLO_API_TOKEN);
    if(response.status != 200) {
        abort_all();
        return null;
    }
    return await response.json();
}

function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

async function get_trello_boards() {
    if(TRELLO_API_TOKEN == null)
        return null;
    return await api("/members/me/boards");
}

async function get_full_trello_board(board_id) {
    if(TRELLO_API_TOKEN == null || board_id == null)
        return null;
    function board_api(url) {
        return api("/boards/" + board_id + url);
    }
    let board = await board_api("");
    let members = {};
    for(let member of await board_api("/members")) {
        member.active = true;
        members[member.id] = member;
    }
    let labels = await board_api("/labels");
    let lists = await board_api("/lists");
    let cards = await board_api("/cards/all");
    for(let i = 0; i<Math.ceil(cards.length/TRELLO_API_PARALLEL_LIMIT); i++) {
        const start = Date.now();
        await Promise.all(cards.slice(i*TRELLO_API_PARALLEL_LIMIT, Math.min(cards.length, (i+1)*TRELLO_API_PARALLEL_LIMIT)).map(async (card) => {
            let actions = await api("/cards/" + card.id + "/actions");
            let attachments = await api("/cards/" + card.id + "/attachments");
            card.actions = actions;
            card.attachments = attachments;
            await Promise.all(card.actions.map(async (action) => {
                if(!action.memberCreator)
                    console.log(action);
                else{ 
                    let creator = action.memberCreator;
                    if(!(creator.id in members))
                        members[creator.id] = {
                            id: creator.id,
                            username: creator.username,
                            fullName: creator.fullName,
                            active: false
                        };
                }
            }));
        }));
        const end = Date.now();
        if(end - start < TRELLO_API_PARALLEL_TIME_LIMIT)
            ;
    }
    return {
        id: board.id,
        name: board.name,
        description: board.desc,
        members: members,
        labels: labels,
        lists: lists,
        cards: cards
    };
}

if(location.hash) {
    let params = location.hash.substring(1).split("&");
    for(let param of params) {
        param = param.split("=");
        if(param[0] == "token") {
            const d = new Date();
            d.setTime(d.getTime() + 60*60*1000);
            document.cookie = "trello_api_token=" + param[1] + "; expires=" + d.toUTCString() + "; path=/";

            sessionStorage.setItem("trello_api_token", param[1]);
            location.href = "#";
        }
    }
}
if(document.cookie)
    for(let cookie of document.cookie.split("; ")) {
        cookie = cookie.split("=");
        if(cookie[0] == "trello_api_token")
            TRELLO_API_TOKEN = cookie[1];
    }

TRELLO_API_TOKEN = sessionStorage.getItem("trello_api_token");