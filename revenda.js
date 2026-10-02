const form=document.getElementById('reseller-form'),dialog=document.getElementById('message-dialog'),phone=document.getElementById('whatsapp'),status=document.getElementById('form-status');
const selected=new URLSearchParams(location.search).get('flavour');
if(['tropical','clt','banana','apple','classic','dark','vodka','watermelon','mango','kut'].includes(selected))document.querySelectorAll('a[href="index.html"],a[href="contact.html"]').forEach(a=>a.href=a.getAttribute('href')+'?flavour='+selected);
phone.addEventListener('input',()=>phone.setCustomValidity(''));
form.addEventListener('submit',event=>{
 event.preventDefault();const fields=new FormData(form),digits=String(fields.get('whatsapp')).replace(/\D/g,'');const domestic=digits.startsWith('55')&&digits.length>11?digits.slice(2):digits;
 if(!/^\d{10,11}$/.test(domestic)){phone.setCustomValidity('Informe um WhatsApp com DDD, com 10 ou 11 números.');phone.reportValidity();return;}
 const value=key=>String(fields.get(key)||'').trim();
 const message=`Olá! Tenho interesse em revender Mansão Maromba.\n\nNome: ${value('nome')} ${value('sobrenome')}\nE-mail: ${value('email')}\nLoja: ${value('loja')}\nWhatsApp: ${value('whatsapp')}\nCNPJ: ${value('cnpj')||'Não informado'}\n\nGostaria de conhecer a tabela de preços, condições e atendimento na minha região.`;
 document.getElementById('message-preview').textContent=message;document.getElementById('message-link').href='https://wa.me/5583991709334?text='+encodeURIComponent(message);status.textContent='Mensagem preparada. Revise seus dados antes de continuar.';dialog.showModal();
});
for(const button of dialog.querySelectorAll('button'))button.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
const sections=[...document.querySelectorAll('main>section')],links=[...document.querySelectorAll('.main-nav a[href^="#"]')];
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){document.querySelector('.header').classList.toggle('scrolled',entry.target.id!=='revenda');const linked=links.find(a=>a.hash==='#'+entry.target.id);if(linked)links.forEach(a=>{const active=a===linked;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-20% 0px -55% 0px',threshold:0});sections.forEach(section=>observer.observe(section));
// The portrait and delivery artwork use layered illustrations.
if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&matchMedia('(pointer:fine)').matches){const art=document.getElementById('founder-art'),portrait=art.querySelector('.founder-portrait');art.addEventListener('pointermove',event=>{const box=art.getBoundingClientRect(),x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;portrait.style.transform=`translateX(calc(-50% + ${x*10}px)) rotateY(${x*6}deg) rotateX(${-y*3}deg)`;});art.addEventListener('pointerleave',()=>portrait.style.transform='translateX(-50%)');}
try{const {createLogisticsIllustration}=await import('./logistics-illustration.js');await createLogisticsIllustration(document.getElementById('logistics-scene'));}catch(error){console.warn('Logistics illustration:',error);document.querySelector('.scene-hint').textContent='DA MANSÃO AO SEU NEGÓCIO';}
