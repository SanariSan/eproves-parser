const axios = require("axios");
const fs = require("fs");
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function req(song, config) {
    const params = new URLSearchParams();
    params.append("searchBy", song);

    const r = await axios.post("https://eproves.com/", params, config);
    const data = r.data;
    const fData = data.replace(/[\f\t\n\v\r]/g, "");
    let parced = fData.match(/<span class="material-icons (?<status>\w+)"/); // close, free, smthforCC, null(for nonames)

    if (!parced) {
        parced = fData.match(
            /<span class="search__title--shadow">[\s]+?<span class="first active-block">(?<status>[\s\w]+)<\/span>/,
        );
    }

    return Promise.resolve({ parced, song });
}

async function init() {
    const lines = fs
        .readFileSync("./music_authors.txt", "utf-8")
        .split("\n")
        .map(el => el.replace(/\s/g, "+"));

    const config = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };

    const arr = [];

    for (let i = 0; i < lines.length; i++) {
        arr.push(req(lines[i], config));
        await sleep(20000);
    }

    const results = await Promise.all(arr);
    results.forEach(el => {
        console.log(el.song);

        //Video not found, Simultaneous check, Duration
        switch (el.parced?.groups?.status?.toLowerCase().replace(/\s/g, "")) {
            case "free":
                return console.log("free (public)");
            case "videonotfound":
                return console.log("free not found (public)");
            case "duration":
                return console.log("TOO LONG (private until moderation)");
            case "close":
                return console.log("copyright (private)");
            case "simultaneouscheck":
                return console.log("TOO MANY (internal)");
            default:
                return console.log("cc? (internal)");
        }
    });
}

init();
