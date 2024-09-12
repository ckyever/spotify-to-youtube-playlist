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

const getSpotifyPlaylist = async (token, playlistUrl) => {
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

const youtubeSearch = () => {
    searchQueries.forEach(query => {
        gapi.client.init({
            'part': ['snippet'],
            'apiKey': youtubeApiKey,
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

const googleIdClient = google.accounts.oauth2.initTokenClient({
  client_id: youtubeClientId,
  scope: 'https://www.googleapis.com/auth/youtube',
  ux_mode: 'popup',
  callback: (response) => {
    if (response && response.access_token) {
        if (google.accounts.oauth2.hasGrantedAllScopes(response,
            'https://www.googleapis.com/auth/youtube',
        )) {
            console.log("Access Token", response.access_token); 
            createYoutubePlaylist(response.access_token);
        }
    }
  }
});

const createYoutubePlaylist = (accessToken) => {
    const url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&part=status"
    const spotifyUrl = document.getElementById('spotify-playlist-url').value;
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            "snippet": {
                "title": "Spotify to Youtube Playlist",
                "description": `Converted from Spotify playlist ${spotifyUrl}`,
                "tags": [
                    "API Call"
                ],
                "defaultLanguage": "en"
            },
            "status": {
                "privacyStatus": "private"
            }
        }),
        headers: new Headers({
            'Authorization': `Bearer ${accessToken}`
        })
    }).then(response => response.json())
    .then(data => data.id)
    .then(playlistId => {
        console.log("Playlist id:", playlistId);
        videoIds.forEach(videoId => {
            console.log("Adding video ID:", videoId);
            addToYoutubePlaylist(accessToken, playlistId, videoId);
        });
    }).catch(error => {
            console.log("Error:", error);
    });
}

const addToYoutubePlaylist = (accessToken, youtubePlaylistId, youtubeVideoId) => {
    const url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet"
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            "snippet": {
                "playlistId": youtubePlaylistId,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": youtubeVideoId
                }
            }
        }),
        headers: new Headers({
            'Authorization': `Bearer ${accessToken}`
        })
    }).then(response => {
        if (response) {
            console.log("Added video:", youtubeVideoId)
        }
    }).catch(error => {
            console.log("Error:", error);
    });
}

// Convert Process
const spotifyPlaylistUrlInput = document.getElementById("spotify-playlist-url");
const convertButton = document.getElementById("convert-button");

const convert = async () => {
    const spotifyUrl = document.getElementById('spotify-playlist-url').value;
    const access_token = await getSpotifyToken(); 
    const songTitles = await getSpotifyPlaylist(access_token, spotifyUrl);
    searchQueries = songTitles;
    await gapi.load('client', youtubeSearch);
    console.log(videoIds);
    await googleIdClient.requestAccessToken();
}

convertButton.addEventListener("click", convert);

spotifyPlaylistUrlInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        convertButton.click();
    }
})