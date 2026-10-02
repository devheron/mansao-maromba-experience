// Coherent studio artwork based on the supplied logistics references, with subtle pointer parallax.
export async function createLogisticsIllustration(host){
 host.innerHTML=`<div class="delivery-composition" aria-hidden="true"><img class="delivery-render" src="assets/logistics-art/distribution-render-v2.webp" width="1536" height="1024" alt="" decoding="async" fetchpriority="high"></div>`;
 host.setAttribute('aria-label','Ilustração da distribuição Mansão Maromba: caminhão, galpão e entregador em proporções naturais. Mova o ponteiro, arraste ou use as setas para deslocar a composição.');
 const art=host.querySelector('.delivery-composition');
 const images=[...art.querySelectorAll('img')];await Promise.all(images.map(img=>img.decode().catch(()=>{})));
 host.classList.add('ready');host.dataset.renderer='studio-artwork';
 let px=0,py=0,x=0,y=0,raf=0,last=0,visible=true,dragging=false,startX=0,startY=0,startPX=0,startPY=0;
 const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 function draw(){art.style.setProperty('--scene-x',x.toFixed(3));art.style.setProperty('--scene-y',y.toFixed(3));}
 function schedule(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(loop);}
 function loop(now){raf=0;const dt=Math.min((now-last)/1000,.04);last=now;const step=1-Math.exp(-7*dt);x+=(px-x)*step;y+=(py-y)*step;draw();if(Math.abs(px-x)+Math.abs(py-y)>.001)schedule();}
 function target(a,b){px=Math.max(-1,Math.min(1,a));py=Math.max(-1,Math.min(1,b));if(reduce){x=px;y=py;draw();}else schedule();}
 host.addEventListener('pointermove',e=>{if(dragging){target(startPX+(e.clientX-startX)/130,startPY+(e.clientY-startY)/190);}else if(e.pointerType==='mouse'&&!reduce){const b=host.getBoundingClientRect();target(((e.clientX-b.left)/b.width-.5)*2,((e.clientY-b.top)/b.height-.5)*2);}});
 host.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;startX=e.clientX;startY=e.clientY;startPX=px;startPY=py;host.setPointerCapture(e.pointerId);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(type,()=>dragging=false);
 host.addEventListener('pointerleave',()=>{if(!dragging)target(0,0);});
 host.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();target(e.key==='Home'?0:px+(e.key==='ArrowLeft'?-.3:e.key==='ArrowRight'?.3:0),e.key==='Home'?0:py+(e.key==='ArrowUp'?-.3:e.key==='ArrowDown'?.3:0));}});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=performance.now();schedule();}else{cancelAnimationFrame(raf);raf=0;}},{threshold:.01}).observe(host);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();schedule();}});
}
