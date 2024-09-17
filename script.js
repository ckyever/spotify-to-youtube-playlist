// API Credentials
const youtubeClientId = "shhhhhh";
const spotifyClientId = "shhhhhh";
const spotifyClientSecret = "shhhhhh";
const youtubeApiKey = "shhhhhh";

const enableConvertButton = (isEnabled) => {
    const convertButton = document.getElementById("convert-button");
    const spotifyPlaylistUrlInput = document.getElementById('spotify-playlist-url');
    if (isEnabled) {
        spotifyPlaylistUrlInput.disabled = false;
        convertButton.disabled = false;
        convertButton.innerText = "Convert";
    } else {
        spotifyPlaylistUrlInput.disabled = true;
        convertButton.disabled = true;
        convertButton.innerText = "Converting";
    }
}

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
        const {access_token} = data;
        return access_token;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const getSpotifyPlaylist = async (token, playlistUrl) => {
    playlistUrl = playlistUrl.slice(-1) === '/' ? playlistUrl.slice(0, -1) : playlistUrl;
    const playlistId = playlistUrl.substring(playlistUrl.lastIndexOf('/') + 1);
    let songTitles = []

    try {
        const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Authorization': `Bearer ${token}`
            })
        });
        const data = await response.json();
        if (data.error && data.error.status === 404) {
            alert("Unable to find Spotify playlist - please check it is public");
        } else {
            const tracks = data.tracks.items;
            songTitles = tracks.map((item) => {
                const mainArtist = item.track.artists[0].name;
                const trackItem = item.track.name;
                return `${mainArtist} - ${trackItem}`;
            });
        }
    } catch (error) {
        console.log(error);
    }
    return songTitles;
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
                maxResults: 1,
                type: "video",
                order: "relevance"
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
                createYoutubePlaylist(response.access_token);
            }
        }
    }
});

const showYoutubePlaylistUrl = (showUrl, playlistId) => {
    const youtubePlaylistResult = document.getElementById("youtube-playlist-result");
    const youtubePlaylistUrl  = document.getElementById("youtube-playlist-url");
    if (showUrl) {
        enableConvertButton(true);
        if (playlistId) {
            youtubePlaylistResult.style.display = "flex";
            const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
            youtubePlaylistUrl.setAttribute("href", playlistUrl);
            youtubePlaylistUrl.innerText = playlistUrl;
        } else {
            youtubePlaylistResult.style.display = "flex";
            youtubePlaylistUrl.setAttribute("href", "");
            youtubePlaylistUrl.style = "pointer-events: none";
            youtubePlaylistUrl.innerText = "Unable to generate the playlist";
        }
    } else {
        youtubePlaylistResult.style.display = "none";
        youtubePlaylistUrl.setAttribute("href", "");
        youtubePlaylistUrl.innerText = "";
    }
}

const createYoutubePlaylist = async (accessToken) => {
    const url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&part=status"
    const spotifyUrl = document.getElementById('spotify-playlist-url').value;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                "snippet": {
                    "title": "Spotify to Youtube Playlist",
                    "description": `Converted from Spotify playlist ${spotifyUrl}`
                },
                "status": {
                    "privacyStatus": "private"
                }
            }),
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`
            })
        });

        const data = await response.json()
        const playlistId = data.id;
        console.log("Playlist ID:", playlistId);
        await addVideoListToYoutubePlaylist(accessToken, playlistId, videoIds);
        showYoutubePlaylistUrl(true, playlistId);
    } catch {
        console.log("Error:", error);
    }
}

const addVideoListToYoutubePlaylist = async (accessToken, playlistId, videoIds) => {
    const convertButton = document.getElementById("convert-button");
    const numberOfVideos = videoIds.length;
    let i = 0;

    for (const videoId of videoIds) {
        i++;
        convertButton.innerText = `Converting ${i} of ${numberOfVideos}`;
        await addToYoutubePlaylist(accessToken, playlistId, videoId);
    }
}

const addToYoutubePlaylist = async (accessToken, playlistId, youtubeVideoId) => {
    const url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet"
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                "snippet": {
                    "playlistId": playlistId,
                    "resourceId": {
                        "kind": "youtube#video",
                        "videoId": youtubeVideoId
                    }
                }
            }),
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`
            })
        });
        console.log("Added this video to the playlist:", youtubeVideoId);
    } catch {
        console.log("Error:", error);
    }
}

// Convert Process
const spotifyPlaylistUrlInput = document.getElementById("spotify-playlist-url");
const convertButton = document.getElementById("convert-button");

const convert = async () => {
    enableConvertButton(false);
    showYoutubePlaylistUrl(false, null);
    const spotifyUrl = document.getElementById('spotify-playlist-url').value;
    const accessToken = await getSpotifyToken(); 
    const songTitles = await getSpotifyPlaylist(accessToken, spotifyUrl);

    if (songTitles.length == 0) {
        enableConvertButton(true);
    } else {
        // Ensure the search query contains the exact keywords
        searchQueries = songTitles.map(title => `${title} Official Video`);
        console.log("Youtube Search Queries:", searchQueries)

        await gapi.load('client', youtubeSearch);
        await googleIdClient.requestAccessToken();

        // CKYTODO: The below code does not work since videoIds may not be populated at this point
        // console.log("Found Video IDs:", videoIds);
        // if (videoIds.length === 0) {
        //     enableConvertButton(true);
        //     showYoutubePlaylistUrl(true, null);
        // } else {
        //     await googleIdClient.requestAccessToken();
        // }
    }
}

convertButton.addEventListener("click", convert);

spotifyPlaylistUrlInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        convertButton.click();
    }
})