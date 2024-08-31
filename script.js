const clientId = "123";
const clientSecret = "abc";

var request = new XMLHttpRequest();
request.open("POST", "https://accounts.spotify.com/api/token");
request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
const requestBody = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;
request.send(requestBody);

const spotifyPlaylistUrlInput = document.getElementById("spotify-playlist-url");
const convertButton = document.getElementById("convert-button");

function convert() {
    const spotifyUrl = document.getElementById('spotify-playlist-url').value;
    console.log(spotifyUrl);
}

convertButton.addEventListener("click", convert);

spotifyPlaylistUrlInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        convertButton.click();
    }
})