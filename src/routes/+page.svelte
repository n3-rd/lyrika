<script lang="ts">
	import { goto } from '$app/navigation';
import { initiateSpotifyAuth, isSpotifyAuthenticated } from '$lib/spotifyAuth';
// import { initiateAppleMusicAuth } from '$lib/appleMusicAuth';
// 
function handleSpotifyAuth() {
    initiateSpotifyAuth();
}

if (isSpotifyAuthenticated()) {
    goto('/app');
} else {
    console.log('Spotify is not authenticated');
}

// async function handleAppleMusicAuth() {
//     const musicInstance = await initiateAppleMusicAuth();
//     if (musicInstance) {
//         console.log('Apple Music authorized');
//     }
// }
</script>
<!-- <button on:click={handleAppleMusicAuth}>Authenticate with Apple Music</button> -->

{#if isSpotifyAuthenticated()}
    <p>You are authenticated with Spotify</p>
{:else}
    <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black to-red-500">
        <div class="p-8 bg-black/30 text-white/60 rounded-lg shadow-xl max-w-md w-full">
            <h2 class="text-3xl font-bold text-center mb-6 ">Ohun</h2>
            <h4 class="text-xl font-bold text-center mb-6 ">Get synchronized song lyrics and sing along with your favorite songs!</h4>
            <p class="text-center  mb-8">Connect your Spotify account to get started</p>
            <button
                on:click={handleSpotifyAuth}
                class="w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition duration-300 ease-in-out flex items-center justify-center"
            >
                <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Sign in with Spotify
            </button>
        </div>
    </div>
{/if}