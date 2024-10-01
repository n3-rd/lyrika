// import { PUBLIC_APPLE_DEVELOPER_TOKEN } from '$env/static/public';

// declare global {
//     interface Window {
//         MusicKit: any;
//     }
// }

// export async function initiateAppleMusicAuth() {
//     if (!window.MusicKit) {
//         console.error('MusicKit JS is not loaded');
//         return;
//     }

//     try {
//         await window.MusicKit.configure({
//             developerToken: PUBLIC_APPLE_DEVELOPER_TOKEN,
//             app: {
//                 name: 'Your App Name',
//                 build: '1.0.0'
//             }
//         });

//         const music = window.MusicKit.getInstance();
//         await music.authorize();

//         return music;
//     } catch (error) {
//         console.error('Error authorizing with Apple Music:', error);
//         return null;
//     }
// }