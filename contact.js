import {flavors} from './config.js';
const f=flavors.find(f=>f.id===new URLSearchParams(location.search).get('flavour'));
if(f){for(const key of ['accent','bg','glow'])document.body.style.setProperty('--'+key,f[key]);for(const a of document.querySelectorAll('a[href^="index.html"]')){const original=a.getAttribute('href'),hash=original.includes('#')?original.slice(original.indexOf('#')):'';a.href='index.html?flavour='+f.id+hash}}
