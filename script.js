// API Credentials
const spotifyClientId = "123";
const spotifyClientSecret = "123";
const youtubeApiKey = "123";
const youtubeClientId = "123";

// Spotify API
const getSpotifyToken = async () => {
    const url = "https://accounts.spotify.com/api/token";
    const requestBody = `grant_type=client_credentials&client_id=${spotifyClientId}&client_secret=${spotifyClientSecret}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: requestBody,
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded'
            })
        });
        const data = await response.json();
        const {access_token} = await data;
        return access_token;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const getPlaylist = async (token, playlistUrl) => {
    playlistUrl = playlistUrl.slice(-1) === '/' ? playlistUrl.slice(0, -1) : playlistUrl;
    const playlistId = playlistUrl.substring(playlistUrl.lastIndexOf('/') + 1);

    try {
        const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Authorization': `Bearer ${token}`
            })
        });
        const data = await response.json();
        const tracks = data.tracks.items;
        const songTitles = tracks.map((item) => {
            const mainArtist = item.track.artists[0].name;
            const trackItem = item.track.name;
            return `${mainArtist} - ${trackItem}`;
        });
        return songTitles;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Youtube API
let searchQueries = [];
let videoIds = [];

const googleIdClient = google.accounts.oauth2.initTokenClient({
  client_id: youtubeClientId,
  scope: 'https://www.googleapis.com/auth/youtube',
  ux_mode: 'popup',
  callback: (response) => {
    if (response && response.access_token) {
        if (google.accounts.oauth2.hasGrantedAllScopes(response,
            'https://www.googleapis.com/auth/youtube',
        )) {
            console.log("Youtube access has been granted");
            console.log("Access Token", response.access_token); 
        }
    }
  },
});

const youtubeSearch = () => {
    searchQueries.forEach(query => {
        gapi.client.init({
            'part': ['snippet'],
            'youtubeApiKey': apiKey,
            'discoveryDocs': ['https://youtube.googleapis.com/$discovery/rest?version=v3']
        }).then(function() {
            return gapi.client.youtube.search.list({
                q: query,
                maxResults: 1
            });
        }).then(function(response) {
            videoIds.push(response.result.items[0].id.videoId);
        }, function(error) {
            console.log(error);
        });
    });
}

// TODO: Need to do OAuth for this
const createYoutubePlaylist = () => {
    gapi.client.init({
        'part': ['snippet'],
        'apiKey': apiKey,
        'discoveryDocs': ['https://youtube.googleapis.com/$discovery/rest?version=v3']
    }).then(function() {
        return gapi.client.youtube.playlists.insert({
            snippet: {
                title: "Playlist from API",
                description: "This playlist was created via the API"
            },
            status: {
                privacyStatus: "private"
            }
        });
    }).then(function(response) {
        console.log("Playlist ID", response.result.playlists.id);
    }, function(error) {
        console.log(error);
    });
}

// Convert Process
const spotifyPlaylistUrlInput = document.getElementById("spotify-playlist-url");
const convertButton = document.getElementById("convert-button");

const convert = async () => {
    googleIdClient.requestAccessToken();
    //const spotifyUrl = document.getElementById('spotify-playlist-url').value;
    //const access_token = await getSpotifyToken(); 
    //const songTitles = await getPlaylist(access_token, spotifyUrl);
    //searchQueries = songTitles;

    //gapi.load('client', youtubeSearch);
    //console.log(videoIds);

    // TODO: Create a playlist using these urls
    //gapi.load('client', createYoutubePlaylist);
}

convertButton.addEventListener("click", convert);

spotifyPlaylistUrlInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        convertButton.click();
    }
})