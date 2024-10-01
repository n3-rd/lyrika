<script lang="ts">
import { initiateSpotifyAuth, isSpotifyAuthenticated } from '$lib/spotifyAuth';
// import { initiateAppleMusicAuth } from '$lib/appleMusicAuth';
// 
function handleSpotifyAuth() {
    initiateSpotifyAuth();
}

// async function handleAppleMusicAuth() {
//     const musicInstance = await initiateAppleMusicAuth();
//     if (musicInstance) {
//         console.log('Apple Music authorized');
//     }
// }
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<!-- <button on:click={handleAppleMusicAuth}>Authenticate with Apple Music</button> -->

{#if isSpotifyAuthenticated()}
    <p>You are authenticated with Spotify</p>
{:else}
    <p>You are not authenticated with Spotify</p>
    <button on:click={handleSpotifyAuth}>Authenticate with Spotify</button>
{/if}