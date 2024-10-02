import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const syncedLyrics = writable<string | null>(null);
export const plainLyrics = writable<string | null>(null);
export const currentLine = writable({ time: 0, text: '' });

interface Lyric {
    time: number;
    text: string;
}

export function parseSyncedLyrics(lyricsText: string): Lyric[] {
    return lyricsText.split('\n').map(line => {
        const match = line.match(/\[(.*?)\](.*)/);
        if (match) {
            const [, timeStr, text] = match;
            const [minutes, seconds] = timeStr.split(':').map(Number);
            return {
                time: minutes * 60 + seconds,
                text: text.trim()
            };
        }
        return { time: 0, text: line.trim() };
    });
}

export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
    try {
        const response = await fetch(`https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
        if (!response.ok) throw new Error('Failed to fetch lyrics');
        const data = await response.json();
        if (!data || !data[0]) return null;
        return data[0].syncedLyrics;
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        return null;
    }
}

export function saveLyricsToLocalStorage(artist: string, title: string, lyrics: string) {
    if (browser) {
        localStorage.setItem(`lyrics_${artist}_${title}`, lyrics);
    }
}

export function getLyricsFromLocalStorage(artist: string, title: string): string | null {
    if (browser) {
        return localStorage.getItem(`lyrics_${artist}_${title}`);
    }
    return null;
}