<script lang="ts">
    import { onMount, onDestroy, afterUpdate } from 'svelte';
    import { goto } from '$app/navigation';
    import { isSpotifyAuthenticated, getCurrentlyPlayingTrack } from '$lib/spotifyAuth';
    import { syncedLyrics, plainLyrics, currentLine, parseSyncedLyrics, fetchLyrics, saveLyricsToLocalStorage, getLyricsFromLocalStorage } from '$lib/lyrics';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import { prominent } from 'color.js';
    import { writable } from 'svelte/store';

    let currentTrack: any = null;
    let currentTime: number = 0;
    let intervalId: number;
    let parsedLyrics: ReturnType<typeof parseSyncedLyrics> = [];
    let scrollContainer: HTMLElement | null = null;
    let userInteracting = false;
    let lastInteractionTime = 0;

    let accentColor = "#000000"
    let textColor = "#ffffff"

    let coverImage = ""

    $:{
        coverImage = currentTrack?.item?.album?.images[0]?.url
        updateAccentColor(coverImage)
    }

    $: if ($syncedLyrics) {
        parsedLyrics = parseSyncedLyrics($syncedLyrics);
    }

    function formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    async function updateCurrentTrack() {
        const newTrack = await getCurrentlyPlayingTrack();
        if (newTrack === null && !isSpotifyAuthenticated()) {
            goto('/');
            return;
        }
        if (newTrack && (!currentTrack || newTrack.item.id !== currentTrack.item.id)) {
            currentTrack = newTrack;
            await updateLyrics(newTrack.item.artists[0].name, newTrack.item.name);
            await updateAccentColor(newTrack.item.album.images[0].url);
        }
        if (newTrack) {
            const elapsedSinceLastFetch = Date.now() - newTrack.fetchedAt;
            currentTime = newTrack.progress_ms + elapsedSinceLastFetch;
            updateCurrentLyricLine();
        }
    }

    async function updateAccentColor(imageUrl: string) {
        try {
            const color = await prominent(imageUrl, { amount: 1, format: 'hex' });
            accentColor = color;
            textColor = getContrastColor(color)
        } catch (error) {
            console.error('Failed to get accent color:', error);
        }
    }

    function getContrastColor(hexColor: string) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }

    async function updateLyrics(artist: string, title: string) {
        let lyrics = getLyricsFromLocalStorage(artist, title);
        if (!lyrics) {
            lyrics = await fetchLyrics(artist, title);
            if (lyrics) saveLyricsToLocalStorage(artist, title, lyrics);
        }
        if (lyrics) {
            syncedLyrics.set(lyrics);
            plainLyrics.set(lyrics.replace(/\[.*?\]/g, '').trim());
        } else {
            syncedLyrics.set(null);
            plainLyrics.set(null);
        }
    }

    function updateCurrentLyricLine() {
        const currentLyric = parsedLyrics.find((lyric, index) => 
            currentTime >= lyric.time * 1000 && 
            (index === parsedLyrics.length - 1 || currentTime < parsedLyrics[index + 1].time * 1000)
        );
        if (currentLyric) {
            currentLine.set(currentLyric);
            if (!userInteracting && Date.now() - lastInteractionTime > 5000) {
                scrollToCurrentLine();
            }
        }
    }

    function scrollToCurrentLine() {
        if (scrollContainer) {
            const currentLineElement = document.querySelector('.current-line');
            if (currentLineElement) {
                currentLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    function handleUserInteraction() {
        userInteracting = true;
        lastInteractionTime = Date.now();
        setTimeout(() => {
            userInteracting = false;
        }, 5000);
    }

    onMount(async () => {
        if (!isSpotifyAuthenticated()) {
            goto('/');
        } else {
            await updateCurrentTrack();
            intervalId = setInterval(async () => {
                await updateCurrentTrack();
            }, 1000);
        }
    });

    onDestroy(() => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

    afterUpdate(() => {
        if (!isSpotifyAuthenticated()) {
            goto('/');
        }
    });
</script>

<div class="h-screen w-screen relative" style="background-color: {accentColor}; color: {textColor};">
    <div class="absolute inset-x-0 top-0 h-16 w-full flex items-center px-4 bg-opacity-50 bg-gray-800">
        {#if currentTrack}
            <div class="flex items-center">
                <img src={currentTrack.item.album.images[2].url} alt="Album cover" class="w-12 h-12 mr-4">
                <div>
                    <p class="font-bold">{currentTrack.item.name}</p>
                    <p class="text-sm">{currentTrack.item.artists.map(a => a.name).join(', ')}</p>
                </div>
            </div>
            <div class="ml-auto">
                {formatTime(currentTime)} / {formatTime(currentTrack.item.duration_ms)}
            </div>
        {:else}
            <p>No track currently playing</p>
        {/if}
    </div>
    <div class="flex flex-col items-center justify-center h-full">
        {#if currentTrack && $syncedLyrics}
            <ScrollArea 
                class="h-full w-full mt-14 px-10 !font-sans" 
                bind:this={scrollContainer}
                on:mouseenter={handleUserInteraction}
                on:touchstart={handleUserInteraction}
                on:wheel={handleUserInteraction}
            >
                {#each parsedLyrics as lyric, i}
                    <p class={`text-center my-12 text-4xl font-clashDisplayMedium ${lyric === $currentLine ? 'font-semibold current-line' : ''}`}>
                        {lyric.text}
                    </p>
                {/each}
            </ScrollArea>
        {:else if currentTrack}
            <p class="text-2xl">No lyrics found</p>
        {:else}
            <p class="text-2xl">No track currently playing</p>
        {/if}
    </div>
</div>