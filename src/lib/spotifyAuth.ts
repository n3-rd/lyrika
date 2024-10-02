import { PUBLIC_SPOTIFY_CLIENT_ID } from '$env/static/public';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

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
        setSpotifyToken(accessToken);
        return accessToken;
    } else {
        console.error('No access token found in the URL');
        return null;
    }
}

export function isSpotifyAuthenticated() {
    return !!getSpotifyToken();
}

function setSpotifyToken(token: string) {
    if (browser) {
        localStorage.setItem('spotifyAccessToken', token);
    }
}

function getSpotifyToken(): string | null {
    if (browser) {
        return localStorage.getItem('spotifyAccessToken');
    }
    return null;
}

export function clearSpotifyToken() {
    if (browser) {
        localStorage.removeItem('spotifyAccessToken');
    }
}

// ... existing code ...

export async function getCurrentlyPlayingTrack() {
    const token = getSpotifyToken();
    if (!token) {
        console.error('No Spotify token found');
        return null;
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 204) {
            return null; // No track currently playing
        }

        if (response.status === 401) {
            // Token expired, clear it and redirect to login
            clearSpotifyToken();
            goto('/');
            return null;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch currently playing track');
        }

        const data = await response.json();
        return {
            ...data,
            fetchedAt: Date.now() // Add timestamp when the data was fetched
        };
    } catch (error) {
        console.error('Error fetching currently playing track:', error);
        return null;
    }
}
