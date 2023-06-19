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
    const trello_boards = document.getElementById("trello-boards");
    trello_boards.innerHTML = "";
    get_trello_boards().then(boards => {
        for(let board of boards) {
            let board_a = document.createElement("a");
            board_a.classList.add("trello-board");
            board_a.innerText = board.name;
            board_a.href = board.shortUrl + ".json";;
            board_a.target = "_blank";
            board_a.download = "trello-board-" + board.id + ".json";
            board_a.onclick = () => {
                console.log(board);
                //document.body.removeChild(a)
                //show_import();
                //get_full_trello_board(board.id).then(board => {
                //    sessionStorage.setItem("current_trello_board", JSON.stringify(board));
                //    // find required mappings
                //    show_mapping();
                //});
            };
            trello_boards.appendChild(board_a);
        }
    });
    document.getElementById("choose-board").style.display = "block";
}

function show_import() {
    hide_all();
    document.getElementById("import").style.display = "block";
}

function show_mapping() {
    hide_all();
    let board = JSON.parse(sessionStorage.getItem("current_trello_board"));
    console.log(board);
    document.getElementById("mapping").style.display = "block";
}

function show_convert() {
    hide_all();
    document.getElementById("convert").style.display = "block";
}

function show_export() {
    hide_all();
    document.getElementById("export").style.display = "block";
}

function update_state() {
    if(TRELLO_API_TOKEN != null) {
        if(sessionStorage.getItem("current_trello_board") == null)
            show_choose_board();
        else {
            show_mapping();
        }
    } else
        show_hello();
}

function abort_board() {
    sessionStorage.removeItem("current_trello_board");
    update_state();
}

function abort_all() {
    // delete trello api token cookie
    sessionStorage.removeItem("current_trello_board");
    sessionStorage.removeItem("trello_api_token");
    TRELLO_API_TOKEN = null;
    update_state();
}