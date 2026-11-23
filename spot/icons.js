const iconArt = {
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 binoculars:'<path d="M5.4 4.5h3.4v5.8H4.2zM15.2 4.5h3.4l1.2 5.8h-4.6z" fill="currentColor"/><path d="M3.1 10.1c.7-1.2 2-2 3.6-2h1.7c1.3 0 2.6 1 2.6 2.4v5.2a4.6 4.6 0 1 1-9.2 0zM20.9 10.1c-.7-1.2-2-2-3.6-2h-1.7c-1.3 0-2.6 1-2.6 2.4v5.2a4.6 4.6 0 1 0 9.2 0z" fill="currentColor"/><path d="M10.5 10.5h3v3h-3z" fill="currentColor"/><circle cx="6.4" cy="15.7" r="2.65" fill="#ffe391" stroke="none"/><circle cx="17.6" cy="15.7" r="2.65" fill="#ffe391" stroke="none"/>',
 focus:'<path d="M8 3H4v4m12-4h4v4M8 21H4v-4m12 4h4v-4"/><circle cx="12" cy="12" r="4"/>',
 album:'<path d="m3 6 6-2.5L15 6l6-2.5v15L15 21l-6-2.5L3 21zM9 3.5v15M15 6v15"/>',
 book:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4m-4 4h3M3 7h4m-4 5h4m-4 5h4"/>',
 sound:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m2.5-11a10 10 0 0 1 0 14"/>',
 mute:'<path d="M3 9h4l5-4v14l-5-4H3zM16 9l5 6m0-6-5 6"/>', help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2.2-3 2.4-3 4.5M12 17h.01"/>',
 timer:'<circle cx="12" cy="14" r="7.7"/><path d="M9 2h6m-3 0v4m6 1 2-2m-8 5v4l3 1"/>',pause:'<path d="M8 5v14m8-14v14" stroke-width="3.5"/>',
 heart:'<path d="M12 20.4 3.8 12C-.2 6.4 6.2 1 10.6 5.2L12 6.7l1.4-1.5C17.8 1 24.2 6.4 20.2 12z" fill="currentColor" stroke="none"/>',
 link:'<path d="m10 14 4-4m-5 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m0 8a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1"/>',
 hand:'<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v5-2a1.5 1.5 0 0 1 3 0v5c0 5-3 7-7 7-3 0-4-.8-6-3.2l-3-4a1.5 1.5 0 0 1 2.1-2z"/>',
 minus:'<path d="M5 12h14"/>',plus:'<path d="M5 12h14M12 5v14"/>',spark:'<path d="m12 2 2.3 6.2L21 11l-6.7 2.6L12 21l-2.6-7.4L3 11l6.4-2.8z"/>',
 bulb:'<path d="M8.3 16c0-3-3-3.8-3-7.3a6.7 6.7 0 0 1 13.4 0c0 3.5-3 4.3-3 7.3zM9 19h6m-5 3h4"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',save:'<path d="M5 4h12l3 3v13H4V4zM8 4v6h8V4M8 20v-6h8v6"/>',
 check:'<path d="m4 12 5 5L20 6"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>', mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>', pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2"/>', flag:'<path d="M5 21V4q3-3 7 0t8 0v10q-4 3-8 0t-7 0"/>', replay:'<path d="M4 11a8 8 0 1 1 1 7M4 4v7h7"/>'
};
function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(iconArt[name]||'')+'</svg>'}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
