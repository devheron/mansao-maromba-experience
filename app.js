import {flavors,productUrl} from './config.js';
const $=id=>document.getElementById(id),hero=document.querySelector('.experience');
let current=Math.max(0,flavors.findIndex(f=>f.id===new URLSearchParams(location.search).get('flavour'))),busy=false,pending=null,scene=null,paused=false;
const buttons=flavors.map((f,i)=>{const b=document.createElement('button');b.type='button';b.className='flavor-card';b.dataset.flavor=f.id;b.style.setProperty('--card-color',f.accent);b.setAttribute('aria-label',(f.category||f.type+' Combo')+' '+f.name);b.setAttribute('aria-pressed',i===current?'true':'false');b.innerHTML=`<img src="assets/${f.id}.webp" width="29" height="80" alt="" decoding="async"><span class="card-label">${f.short}<small>${f.type.toUpperCase()}</small></span><span class="selected" aria-hidden="true"></span>`;b.addEventListener('click',()=>choose(i));b.addEventListener('pointerenter',()=>scene?.prefetch(f),{passive:true});b.addEventListener('focus',()=>scene?.prefetch(f));$('flavor-buttons').append(b);return b});
const descriptions={
 tropical:'Gin with tropical-fruit flavour. A cocktail ready to pour over ice.',
 clt:'Whisky with energy-drink flavour. The blue Combo de Litro do Trabalhador.',
 banana:'Whisky meets banana flavour in this ready-mixed Combo.',
 apple:'Whisky with green-apple flavour. A fresh twist on the Combo range.',
 classic:'Whisky with energy-drink flavour. Ready-mixed, ready to pour over ice.',
 dark:'Whisky Combo Double Darkness. A bold expression of the collection.',
 vodka:'Vodka with energy-drink flavour. Ready-mixed and best served over ice.',
 watermelon:'Gin with watermelon flavour. The pink expression of the Combo range.',
 mango:'Tigrinho Whisky Combo with mango and passion-fruit flavour.',
 kut:'Gin Kut Original. The cream-coloured bottle with the red Mansão identity.'
};
flavors.forEach((f,i)=>{const b=document.createElement('button');b.className='collection-card';b.type='button';b.style.setProperty('--card-color',f.accent);b.setAttribute('aria-label','Explore '+f.name+' in 3D');b.innerHTML=`<span aria-hidden="true">↗</span><img src="assets/${f.id}.webp" width="65" height="175" alt="" loading="lazy"><strong>${f.name}</strong><small>${(f.category||f.type+' COMBO').toUpperCase()}</small>`;b.addEventListener('click',()=>{choose(i);history.replaceState(null,'',location.pathname+location.search+'#inicio');$('inicio').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});$('collection-grid').append(b)});
function sync(f,i){
 if(new URLSearchParams(location.search).has('flavour')){const url=new URL(location.href);url.searchParams.set('flavour',f.id);history.replaceState(null,'',url)}
 document.querySelector('.contact-link').href='contact.html?flavour='+f.id;document.querySelectorAll('a[href^="revenda.html"]').forEach(a=>a.href='revenda.html?flavour='+f.id);
 $('flavor-type').textContent=(f.category||f.type+' COMBO').toUpperCase();
 const parts=f.name.split(' '),first=parts.length>1?parts.slice(0,-1).join(' '):f.type;
 $('flavor-name').innerHTML='<span class="outline">'+first+'</span><br>'+(parts.length>1?parts.at(-1):f.name);
 $('flavor-name').classList.toggle('long-title',f.name.length>15);
 $('flavor-number').textContent=String(i+1).padStart(2,'0');
 for(const id of ['buy','shop','profile-source']){$(id).href=productUrl(f);$(id).setAttribute('aria-label',id==='shop'?'Shop '+f.name+' at the official store':'Discover '+f.name+' at the official store')}
 $('intro-description').textContent=descriptions[f.id];$('hero-format').textContent=f.id==='kut'?'Gin Kut Original':'Ready to serve';
 $('profile-name').textContent=f.name;$('profile-type').textContent=(f.category||f.type+' COMBO').toUpperCase();$('profile-description').textContent=descriptions[f.id];
 $('profile-format').innerHTML=f.id==='kut'?'Gin Kut<small>ORIGINAL</small>':'Ready-mixed<small>COMBO RANGE</small>';
 for(const id of ['fallback','profile-image']){$(id).src='assets/'+f.id+'.webp';$(id).alt=(f.category||f.type+' Combo')+' '+f.name}
 $('stage').setAttribute('aria-label','3D '+f.name+' bottle. Drag to rotate, or use the arrow keys.');
 buttons.forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-pressed',i===j?'true':'false')});
 $('announcement').textContent=f.name+' selected.';
 if(matchMedia('(max-width:1200px)').matches){const list=$('flavor-buttons'),b=buttons[i];list.scrollTo({left:b.offsetLeft-list.offsetLeft-list.clientWidth/2+b.clientWidth/2,behavior:paused?'instant':'smooth'})}
}
const navLinks=[...document.querySelectorAll('.main-nav a')],sections=['inicio','about','collection','serve'].map($);
const navObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){document.querySelector('.header').classList.toggle('scrolled',entry.target.id!=='inicio');navLinks.forEach(a=>{const active=a.hash==='#'+entry.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}},{rootMargin:'-20% 0px -55% 0px',threshold:0});sections.forEach(el=>navObserver.observe(el));
function theme(f,animate){if(animate&&window.gsap){gsap.to(document.documentElement,{duration:1.5,'--accent':f.accent,'--glow':f.glow,'--bg':f.bg,ease:'sine.inOut',overwrite:true});gsap.to(hero,{backgroundColor:f.bg,duration:1.5,ease:'sine.inOut',overwrite:true});const w=$('color-wash');gsap.killTweensOf(w);gsap.set(w,{backgroundColor:f.glow,scale:.1,opacity:.5});gsap.timeline().to(w,{scale:1.6,opacity:.32,duration:1,ease:'power2.out'}).to(w,{opacity:0,duration:.9},.75)}else{for(const key of ['accent','glow','bg'])document.documentElement.style.setProperty('--'+key,f[key]);hero.style.backgroundColor=f.bg}}
async function choose(i){i=(i+flavors.length)%flavors.length;if(busy){pending=i;return}if(i===current)return;busy=true;hero.setAttribute('aria-busy','true');const f=flavors[i];try{if(scene){await scene.transition(f,()=>{current=i;sync(f,i)},()=>theme(f,!paused))}else{current=i;sync(f,i);theme(f,false)}}catch(err){console.error('Flavor transition:',err);current=i;sync(f,i);theme(f,false);$('stage').classList.remove('ready');$('stage-note').textContent='EXPLORE THE COLLECTION'}finally{busy=false;hero.removeAttribute('aria-busy');if(pending!==null){const next=pending;pending=null;if(next!==current)choose(next)}}}
$('prev').addEventListener('click',()=>choose((pending??current)-1));$('next').addEventListener('click',()=>choose((pending??current)+1));
function motionUI(){$('motion').setAttribute('aria-pressed',String(paused));$('motion').setAttribute('aria-label',paused?'Resume animations':'Pause animations');$('motion').textContent=paused?'▶':'Ⅱ'}
$('motion').addEventListener('click',()=>{paused=!paused;scene?.pause(paused);if(paused&&window.gsap){gsap.killTweensOf([document.documentElement,hero,$('color-wash')]);gsap.set($('color-wash'),{opacity:0});theme(flavors[current],false)}motionUI()});motionUI();$('flavor-buttons').style.setProperty('--flavor-count',flavors.length);$('flavor-total').textContent='/ '+flavors.length;sync(flavors[current],current);theme(flavors[current],false);

try{const {createScene}=await import('./scene.js');const start=current;scene=await createScene($('stage'),flavors[start],paused);scene.pause(paused);if(current!==start)await scene.setFlavor(flavors[current]);hero.dataset.renderer='three';}catch(err){console.error('3D loading:',err);$('stage-note').textContent='EXPLORE THE COLLECTION';$('stage').classList.remove('ready');}
if(navigator.modelContext?.registerTool){try{navigator.modelContext.registerTool({name:'listar_sabores',description:'Lista a coleção Mansão Maromba.',inputSchema:{type:'object',properties:{}},execute:async()=>({content:[{type:'text',text:JSON.stringify(flavors.map(f=>({id:f.id,nome:f.name,tipo:f.type,url:productUrl(f)})))}]})});navigator.modelContext.registerTool({name:'selecionar_sabor',description:'Seleciona um sabor na experiência 3D.',inputSchema:{type:'object',properties:{id:{type:'string',enum:flavors.map(f=>f.id)}},required:['id']},execute:async({id})=>{const i=flavors.findIndex(f=>f.id===id);await choose(i);return {content:[{type:'text',text:'Sabor selecionado: '+flavors[i].name}]}}})}catch{}}

