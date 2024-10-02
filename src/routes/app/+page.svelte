<script lang="ts">
    import { onMount, onDestroy, afterUpdate, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import { isSpotifyAuthenticated, getCurrentlyPlayingTrack } from '$lib/spotifyAuth';
    import { syncedLyrics, plainLyrics, currentLine, parseSyncedLyrics, fetchLyrics, saveLyricsToLocalStorage, getLyricsFromLocalStorage } from '$lib/lyrics';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import { prominent } from 'color.js';
    import { writable } from 'svelte/store';
    import Miniplayer from '$lib/components/ui/scroll-area/miniplayer.svelte';

    let currentTrack: any = null;
    let currentTime: number = 0;
    let intervalId: number;
    let parsedLyrics: ReturnType<typeof parseSyncedLyrics> = [];
    let scrollContainer: HTMLElement | null = null;
    let userInteracting = false;
    let lastInteractionTime = 0;
    let lastFetchTime = 0;
    let predictedTime = 0;
    let predictiveInterval: number;

    let accentColor = "#000000"
    let textColor = "#ffffff"

    let coverImage = ""

    let displayMode: 'multiline' | 'singleline' = 'multiline';
    let userHoverOnLyrics = false;

    $:{
        coverImage = currentTrack?.item?.album?.images[0]?.url
        updateAccentColor(coverImage)
    }

    $: if ($syncedLyrics) {
        parsedLyrics = parseSyncedLyrics($syncedLyrics);
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
            lastFetchTime = Date.now();
            predictedTime = currentTime;
            updateCurrentLyricLine(currentTime);
            
            // Restart the predictive timer
            stopPredictiveTimer();
            startPredictiveTimer();
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

    function updateCurrentLyricLine(time: number) {
        const currentLyric = parsedLyrics.find((lyric, index) => 
            time >= lyric.time * 1000 && 
            (index === parsedLyrics.length - 1 || time < parsedLyrics[index + 1].time * 1000)
        );
        if (currentLyric) {
            currentLine.set(currentLyric);
            if (!userInteracting && Date.now() - lastInteractionTime > 5000) {
                scrollToCurrentLine();
            }
        }
    }

    function scrollToCurrentLine() {
        if (scrollContainer && !userHoverOnLyrics) {
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

    function handleMouseEnter() {
        userHoverOnLyrics = true;
        handleUserInteraction();
    }

    function handleMouseLeave() {
        userHoverOnLyrics = false;
    }

    function startPredictiveTimer() {
        predictiveInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastFetchTime;
            predictedTime = currentTime + elapsed;
            updateCurrentLyricLine(predictedTime);
        }, 100); // Update every 100ms for smoother prediction
    }

    function stopPredictiveTimer() {
        if (predictiveInterval) {
            clearInterval(predictiveInterval);
        }
    }

    function toggleDisplayMode(mode: 'multiline' | 'singleline') {
        displayMode = mode;
    }

    onMount(async () => {
        if (!isSpotifyAuthenticated()) {
            goto('/');
        } else {
            await updateCurrentTrack();
            intervalId = setInterval(async () => {
                await updateCurrentTrack();
            }, 1000);
            startPredictiveTimer();
        }
    });

    onDestroy(() => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        stopPredictiveTimer();
    });

    afterUpdate(() => {
        if (!isSpotifyAuthenticated()) {
            goto('/');
        }
    });
</script>

<div class="h-screen w-screen relative bg-opacity-50 bg-gray-800" style="background-color: {accentColor}; color: {textColor};">
   <Miniplayer 
        currentTrack={currentTrack} 
        currentTime={currentTime}
        displayMode={displayMode}
        on:toggle-display-mode={(event) => toggleDisplayMode(event.detail)}
    />
    <div class="flex flex-col items-center justify-center h-full">
        {#if currentTrack && $syncedLyrics}
            {#if displayMode === 'multiline'}
                <ScrollArea 
                    class="h-full w-full mt-16 px-10 !font-sans transition-all duration-300" 
                    bind:this={scrollContainer}
                    on:mouseenter={handleMouseEnter}
                    on:mouseleave={handleMouseLeave}
                    on:touchstart={handleUserInteraction}
                    on:wheel={handleUserInteraction}
                >
                    {#each parsedLyrics as lyric, i}
                        <p class={`text-center my-12 text-4xl font-clashDisplayMedium transition-opacity duration-300 ${lyric === $currentLine ? 'font-semibold current-line opacity-100' : 'opacity-50'}`}>
                            {lyric.text}
                        </p>
                    {/each}
                </ScrollArea>
            {:else}
                <div class="flex items-center justify-center h-full">
                    <p class="text-center text-6xl font-clashDisplayMedium">
                        {$currentLine ? $currentLine.text : 'Waiting for lyrics...'}
                    </p>
                </div>
            {/if}
        {:else if currentTrack}
            <p class="text-2xl">No lyrics found</p>
        {:else}
            <p class="text-2xl">No track currently playing</p>
        {/if}
    </div>
</div>