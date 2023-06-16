const TRELLO_API_KEY = "696f8e34d0af4d8f0583c1ad82bd932b";
let TRELLO_API_TOKEN = null;

function trello_authorize() {
    location.href = "https://trello.com/1/authorize?response_type=token&key=" + TRELLO_API_KEY + "&redirect_uri=" + encodeURIComponent(location.origin + location.pathname) + "&callback_method=fragment&scope=read&expiration=1hour&name=Trello2GitLab%20Migrator";
}

async function get_trello_boards() {
    if(TRELLO_API_TOKEN == null)
        return null;
    return await (await fetch("https://api.trello.com/1/members/me/boards?key=" + TRELLO_API_KEY + "&token=" + TRELLO_API_TOKEN)).json();
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