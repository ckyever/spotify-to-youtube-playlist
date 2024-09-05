const getToken = async () => {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const clientId = "123";
    const clientSecret = "abc";
    const requestBody = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            body: requestBody,
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded'
            })
        });
        const data = await response.json();
        const {access_token} = await data;
        console.log("Token: ", access_token);
    } catch (error) {
        console.log("Error occured: ", error);
    }
}

getToken();

const getArtistData = token => {
    const url = "https://api.spotify.com/v1/artists/4Z8W4fKeB5YxbusRsdQVPb";
    fetch(url, {
        method: 'GET',
        headers: new Headers({
            'Authorization': `Bearer ${token}`
        })
    })
    .then(response => response.json)
    .then(json => console.log(JSON.stringify(json)))
}

const spotifyPlaylistUrlInput = document.getElementById("spotify-playlist-url");
const convertButton = document.getElementById("convert-button");

const convert = () => {
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