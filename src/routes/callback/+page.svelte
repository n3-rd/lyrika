<script lang="ts">
import { onMount } from 'svelte';
import { handleSpotifyCallback } from '$lib/spotifyAuth';
import { goto } from '$app/navigation';

onMount(() => {
    const accessToken = handleSpotifyCallback();
    if (accessToken) {
        // Successfully authenticated
        // The token is now stored in localStorage
        goto('/');
    } else {
        // Authentication failed
        console.error('Failed to authenticate with Spotify');
        goto('/');
    }
});
</script>

<h1>Authenticating with Spotify...</h1>