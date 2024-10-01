import { PUBLIC_SPOTIFY_CLIENT_ID } from '$env/static/public';
import { browser } from '$app/environment';

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_REDIRECT_URI = 'http://localhost:5173/callback'; // This should match your actual development server URL
const SPOTIFY_SCOPES = ['user-read-currently-playing', 'user-read-playback-state'];

export function initiateSpotifyAuth() {
    const authUrl = new URL(SPOTIFY_AUTH_ENDPOINT);
    authUrl.searchParams.append('client_id', PUBLIC_SPOTIFY_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
    authUrl.searchParams.append('scope', SPOTIFY_SCOPES.join(' '));

    window.location.href = authUrl.toString();
}

// ... existing code ...

export function handleSpotifyCallback() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        console.log('Spotify access token:', accessToken);
        setSpotifyCookie(accessToken);
        return accessToken;
    } else {
        console.error('No access token found in the URL');
        return null;
    }
}

export function isSpotifyAuthenticated() {
    return !!getSpotifyCookie();
}

function setSpotifyCookie(token: string) {
    if (browser) {
        document.cookie = `spotifyAccessToken=${token}; path=/; max-age=3600; SameSite=Strict; Secure`;
    }
}

function getSpotifyCookie(): string | null {
    if (browser) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'spotifyAccessToken') {
                return value;
            }
        }
    }
    return null;
}

export function clearSpotifyCookie() {
    if (browser) {
        document.cookie = 'spotifyAccessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure';
    }
}
