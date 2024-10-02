<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { ChevronUp, ChevronDown } from 'lucide-svelte';

    const dispatch = createEventDispatcher<{
        'toggle-display-mode': 'singleline' | 'multiline';
    }>();

    interface Artist {
        name: string;
    }

    interface CurrentTrack {
        item: {
            name: string;
            artists: Artist[];
            album: {
                images: { url: string }[];
            };
            duration_ms: number;
        };
    }

    export let currentTrack: CurrentTrack | null;
    export let currentTime: number;
    export let displayMode: 'singleline' | 'multiline';

    function formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function toggleDisplayMode() {
        const newMode = displayMode === 'singleline' ? 'multiline' : 'singleline';
        dispatch('toggle-display-mode', newMode);
    }
</script>

<div class="absolute inset-x-0 top-0 h-16 w-full flex items-center px-4 bg-opacity-50 bg-gray-800">
    {#if currentTrack}
        <div class="flex items-center flex-1">
            <img src={currentTrack.item.album.images[2].url} alt="Album cover" class="w-12 h-12 mr-4 rounded-md">
            <div class="max-w-48">
                <p class="font-bold line-clamp-1">{currentTrack.item.name}</p>
                <p class="text-sm line-clamp-1">{currentTrack.item.artists.map((a) => a.name).join(', ')}</p>
            </div>
        </div>
        <div class="flex items-center justify-center flex-1">
            <button 
                class="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                on:click={toggleDisplayMode}
                aria-label={displayMode === 'singleline' ? 'Expand player' : 'Collapse player'}
            >
                {#if displayMode === 'singleline'}
                    <ChevronDown size={24} aria-hidden="true" />
                {:else}
                    <ChevronUp size={24} aria-hidden="true" />
                {/if}
            </button>
        </div>
        <div class="flex items-center justify-end flex-1">
            <span aria-live="polite" aria-atomic="true">
                {formatTime(currentTime)} / {formatTime(currentTrack.item.duration_ms)}
            </span>
        </div>
    {:else}
        <p>No track currently playing</p>
    {/if}
</div>