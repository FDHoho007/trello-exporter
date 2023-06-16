function hide_all() {
    for(let main of document.getElementsByTagName("main"))
        main.style.display = "";
}

function show_hello() {
    hide_all();
    document.getElementById("hello").style.display = "block";
}

function show_choose_board() {
    hide_all();
    get_trello_boards().then(boards => {

    });
    document.getElementById("choose-board").style.display = "block";
}

function update_state() {
    if(TRELLO_API_TOKEN != null)
        show_choose_board();
    else
        show_hello();
}

function abort_all() {
    // delete trello api token cookie
    sessionStorage.removeItem("trello_api_token");
    TRELLO_API_TOKEN = null;
    update_state();
}