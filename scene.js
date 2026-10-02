import * as THREE from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';
import {HDRLoader} from './assets/HDRLoader.js';

export async function createScene(host,initial,initialPaused){
 const renderer=new THREE.WebGLRenderer({canvas:host.querySelector('canvas'),alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,40);camera.position.set(0,-.20,8.65);
 scene.add(new THREE.HemisphereLight(0xfff8e7,0x292c35,.7));
 const key=new THREE.DirectionalLight(0xffffff,1.45);key.position.set(-3,4,5);scene.add(key);
 const rim=new THREE.DirectionalLight(initial.accent,1.65);rim.position.set(4,1,-3);scene.add(rim);
 const fill=new THREE.DirectionalLight(0xe2edff,.55);fill.position.set(3,-1,4);scene.add(fill);
 const hdrPromise=new HDRLoader().loadAsync('assets/studio.hdr');
 const gltf=new GLTFLoader();
 // An actual colour field behind the glass provides a refraction backdrop.
 const backgroundMaterial=new THREE.ShaderMaterial({uniforms:{base:{value:new THREE.Color(initial.bg)},glow:{value:new THREE.Color(initial.glow)},pulse:{value:0}},depthWrite:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 base;uniform vec3 glow;uniform float pulse;varying vec2 vUv;void main(){float halo=exp(-dot((vUv-vec2(.52,.53))*vec2(1.7,1.4),(vUv-vec2(.52,.53))*vec2(1.7,1.4))*8./(1.+pulse*.9));gl_FragColor=vec4(mix(base,glow,halo*.43),1.);\n#include <colorspace_fragment>\n}'});
 const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(2,2),backgroundMaterial);backdrop.position.set(0,.06,-6);scene.add(backdrop);
 function backdropTheme(f,animate=false){const b=new THREE.Color(f.bg),g=new THREE.Color(f.glow);if(animate&&window.gsap){gsap.killTweensOf(backgroundMaterial.uniforms.pulse);gsap.timeline().to(backgroundMaterial.uniforms.pulse,{value:1,duration:.65,ease:'power2.out'}).to(backgroundMaterial.uniforms.pulse,{value:0,duration:1.15,ease:'sine.out'});gsap.to(backgroundMaterial.uniforms.base.value,{r:b.r,g:b.g,b:b.b,duration:1.5,ease:'sine.inOut',overwrite:true});gsap.to(backgroundMaterial.uniforms.glow.value,{r:g.r,g:g.g,b:g.b,duration:1.5,ease:'sine.inOut',overwrite:true})}else{backgroundMaterial.uniforms.base.value.copy(b);backgroundMaterial.uniforms.glow.value.copy(g)}}
 const root=new THREE.Group(),bottle=new THREE.Group();scene.add(root);root.add(bottle);root.rotation.z=-.13;
 // Matching front/back faces and photo-derived specifications form one continuous 360° texture.
 const profile=[[0,-1.79],[.23,-1.8],[.42,-1.77],[.50,-1.68],[.53,-1.52],[.55,-1.35],[.55,-.95],[.54,-.55],[.54,0],[.55,.55],[.52,.80],[.46,1],[.37,1.17],[.32,1.25],[.32,1.34]];
 const curve=new THREE.SplineCurve(profile.map(([r,y])=>new THREE.Vector2(r,y))),bodyGeo=new THREE.LatheGeometry(curve.getPoints(120),96);
 const uv=bodyGeo.attributes.uv,pos=bodyGeo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)+.5,(pos.getY(i)+1.8)/3.14);
 const bodyMat=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.5,metalness:0,clearcoat:.3,clearcoatRoughness:.24,envMapIntensity:.28});const body=new THREE.Mesh(bodyGeo,bodyMat);bottle.add(body);
 const capMat=new THREE.MeshPhysicalMaterial({color:initial.cap,roughness:.33,clearcoat:.55,envMapIntensity:.7});
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.337,.337,.45,96),capMat);cap.position.y=1.54;bottle.add(cap);
 const capRim=new THREE.Mesh(new THREE.TorusGeometry(.336,.015,8,96),capMat);capRim.rotation.x=Math.PI/2;capRim.position.y=1.326;bottle.add(capRim);
 const ribGeo=new THREE.CylinderGeometry(.007,.007,.365,6),ribs=new THREE.InstancedMesh(ribGeo,capMat,56),matrix=new THREE.Matrix4();for(let i=0;i<56;i++){const a=i/56*Math.PI*2;matrix.makeTranslation(Math.sin(a)*.339,1.545,Math.cos(a)*.339);ribs.setMatrixAt(i,matrix)}bottle.add(ribs);
 const baseMat=new THREE.MeshPhysicalMaterial({color:initial.bottle,roughness:.24,clearcoat:1,envMapIntensity:.8}),footGeo=new THREE.SphereGeometry(.16,20,12);
 for(let i=0;i<5;i++){const foot=new THREE.Mesh(footGeo,baseMat),a=i/5*Math.PI*2;foot.position.set(Math.sin(a)*.30,-1.73,Math.cos(a)*.30);foot.scale.y=.7;bottle.add(foot)}
 const textureLoader=new THREE.TextureLoader(),textures=new Map();
 // The emboss uses the real brand symbol as a height field, in the cap's own plastic color.
 const embossAsset=await gltf.loadAsync('assets/cap-emboss.glb');const emboss=embossAsset.scene.children[0];emboss.material=capMat;emboss.rotation.x=-Math.PI/2;emboss.position.y=1.765;bottle.add(emboss);
 function texture(f){if(!textures.has(f.id))textures.set(f.id,textureLoader.loadAsync('assets/'+f.id+'-wrap.webp').then(t=>{t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}));return textures.get(f.id)}
 function apply(f,t){bodyMat.map=t;bodyMat.needsUpdate=true;capMat.color.set(f.cap);baseMat.color.set(f.bottle);rim.color.set(f.accent)}
 apply(initial,await texture(initial));
 const dropMat=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.05,transparent:true,opacity:.32,clearcoat:1,envMapIntensity:1.4}),dropGeo=new THREE.SphereGeometry(1,10,8);
 const droplets=new THREE.InstancedMesh(dropGeo,dropMat,60),dummy=new THREE.Object3D();for(let i=0;i<60;i++){const a=i*2.39996,y=-1.4+(i*1.37%2.08),s=.006+(i%5)*.0015;dummy.position.set(Math.sin(a)*.548,y,Math.cos(a)*.548);dummy.scale.set(s,s*1.35,s*.65);dummy.updateMatrix();droplets.setMatrixAt(i,dummy.matrix)}bottle.add(droplets);

 const models=new Map();
 let mangoSurface=null,iceSurface=null;
 const files={lemon:'lemon/model.gltf',lime:'food_lime_01/model.gltf',apple:'food_apple_01/model.gltf',banana:'bananas/model.gltf',melon:'watermelon/ready.glb',lychee:'food_lychee_01/model.gltf',mango:'mango/model.glb',blueberry:'blueberry/ready.glb',ice:'ice/ready.glb'};
 function normalize(object){object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const wrapper=new THREE.Group();wrapper.add(object);object.position.sub(center);wrapper.scale.setScalar(1/Math.max(size.x,size.y,size.z));return wrapper}
 function loadModel(kind){if(models.has(kind))return models.get(kind);const promise=gltf.loadAsync('assets/models/'+files[kind]).then(async asset=>{
   if(kind==='ice'&&!iceSurface){iceSurface=await Promise.all(['normalgl','roughness','color'].map(k=>textureLoader.loadAsync('assets/models/ice/ice-'+k+'.webp')));iceSurface[2].colorSpace=THREE.SRGBColorSpace;iceSurface.forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4})}
   if(kind==='mango'&&!mangoSurface){const paths=['diff','nor_gl','rough'];mangoSurface=await Promise.all(paths.map(p=>textureLoader.loadAsync('assets/models/food_lime_01/textures/food_lime_01_'+p+'_2k.webp')));mangoSurface[0].colorSpace=THREE.SRGBColorSpace}
   let parts;if(kind==='banana'||kind==='ice'||kind==='blueberry'){parts=asset.scene.children.filter(n=>kind!=='banana'||(n.name.startsWith('bananas_')&&!n.name.includes('bunch'))).map(n=>{const o=n.clone(true);o.position.set(0,0,0);return normalize(o)})}else parts=[normalize(asset.scene)];
   if(kind==='melon')parts.forEach(p=>p.rotation.y=Math.PI/2);
   parts.forEach(p=>p.traverse(m=>{if(!m.isMesh)return;if(!m.geometry.attributes.normal)m.geometry.computeVertexNormals();const mats=Array.isArray(m.material)?m.material:[m.material];const next=mats.map(old=>{
    if(kind==='ice'){const icy=new THREE.MeshPhysicalMaterial({color:'#f3fcff',map:iceSurface[2],normalMap:iceSurface[0],normalScale:new THREE.Vector2(.08,.08),roughnessMap:iceSurface[1],roughness:.3,metalness:0,clearcoat:.4,clearcoatRoughness:.1,transmission:1,thickness:.65,ior:1.31,attenuationColor:'#c5eef6',attenuationDistance:5,envMapIntensity:.7,specularIntensity:.9,transparent:false,opacity:1,side:THREE.FrontSide});icy.onBeforeCompile=shader=>{
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nfloat iceFrost=smoothstep(.025,.38,dot(sampledDiffuseColor.rgb,vec3(.299,.587,.114)));diffuseColor.rgb=vec3(.86,.94,1.);`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.38,iceFrost);`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <transmission_fragment>',THREE.ShaderChunk.transmission_fragment.replace('material.transmission = transmission;','material.transmission = transmission*(1.-iceFrost*.62);'));
 };return icy;}

    const material=new THREE.MeshPhysicalMaterial({color:old.color,map:old.map,normalMap:old.normalMap,roughnessMap:old.roughnessMap,metalness:0,roughness:kind==='melon'?.5:.92,clearcoat:kind==='apple'?.2:.08,clearcoatRoughness:.4,envMapIntensity:.4,specularIntensity:.6});
    if(material.map)material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(old.normalScale)material.normalScale.copy(old.normalScale).multiplyScalar(.7);
    if(kind==='blueberry'){material.color.set('#293d77');material.roughness=.62;material.clearcoat=.22}
    if(kind==='mango'){
     if(!m.geometry.attributes.uv){const geometry=m.geometry.clone(),positions=geometry.attributes.position;geometry.computeBoundingBox();const box=geometry.boundingBox,c=box.getCenter(new THREE.Vector3()),r=box.getSize(new THREE.Vector3()).multiplyScalar(.5),uvs=new Float32Array(positions.count*2);for(let i=0;i<positions.count;i++){const x=(positions.getX(i)-c.x)/r.x,y=(positions.getY(i)-c.y)/r.y,z=(positions.getZ(i)-c.z)/r.z;uvs[i*2]=Math.atan2(z,y)/(Math.PI*2)+.5;uvs[i*2+1]=Math.acos(THREE.MathUtils.clamp(x,-1,1))/Math.PI}geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));m.geometry=geometry}
     material.map=mangoSurface[0];material.normalMap=mangoSurface[1];material.normalScale.set(.26,.26);material.roughnessMap=mangoSurface[2];material.roughness=.95;material.clearcoat=.08;
     const c=material.color;material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nfloat skinLuma = dot(sampledDiffuseColor.rgb, vec3(.299,.587,.114)); diffuseColor.rgb=vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)})*(.68+skinLuma*.6);`)};
    }
    if(kind==='apple')material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nif (diffuseColor.r > diffuseColor.g * 1.12) { float l = dot(diffuseColor.rgb, vec3(0.299,0.587,0.114)); diffuseColor.rgb = vec3(0.57,0.83,0.12) * l * 1.9; }`)};
    return material;
   });m.material=Array.isArray(m.material)?next:next[0];}));return parts;
  }).catch(err=>{models.delete(kind);throw err});models.set(kind,promise);return promise}
 function kinds(f){if(f.fruit==='banana')return ['banana','lemon','ice'];if(f.fruit==='apple')return ['apple','lime','ice'];if(f.fruit==='melon')return ['melon','lime','ice'];if(f.fruit==='lychee')return ['lychee','lime','ice'];if(f.fruit==='mango')return ['mango','lemon','ice'];if(f.id==='clt'||f.id==='dark'||f.id==='classic')return ['blueberry','lime','ice'];return ['lemon','lime','ice']}
 async function library(f){const keys=kinds(f),loaded=await Promise.all(keys.map(loadModel));return Object.fromEntries(keys.map((k,i)=>[k,loaded[i]]))}
 let mobile=matchMedia('(max-width:760px)').matches,lib=null,flavor=initial;
 const initialLibrary=library(initial);
 const floating=new THREE.Group();scene.add(floating);let items=[];
 const desktopPositions=[[-1.12,1.12,.45],[1.22,1.13,.14],[-1.35,-.13,.22],[1.05,-.78,.65],[-.9,1.7,-1.5],[1.55,1.63,-1.35],[-1.53,-1.28,-.8],[1.52,-1.42,-1.3],[-.6,-1.22,1.05],[.85,-1.27,.4]];
 const mobilePositions=[[-.88,1.3,.05],[.92,.65,.26],[-1.05,-.30,.14],[1.03,-1.08,.04],[-.77,1.80,-1.7],[1.00,1.78,-1.5],[-.44,-1.40,.95],[1.18,-.28,-.7]];
 // Fruit and ice alternate across both sides and depths; foreground pieces cross the base only.
 const slotKinds=[0,2,2,0,1,0,1,2,0,2];
 function populate(f,library){floating.clear();const positions=mobile?mobilePositions:desktopPositions,keys=kinds(f);items=positions.map((p,i)=>{const kind=keys[slotKinds[i]],source=library[kind][i%library[kind].length],mesh=source.clone(true),g=new THREE.Group();g.add(mesh);const scale=(kind==='banana'?1.02:kind==='melon'?.87:kind==='ice'?.78:.79)*(i===4||i===5||i===6||i===7?.68:i===8?.79:i===9?.70:1);g.scale.setScalar(scale);g.position.set(...p);g.rotation.set(.20+i*.20,i*.76,i*.64-.35);if(kind==='melon')g.rotation.set(-.15,-.3+(i%3)*.3,(i%3)*.5-.3);floating.add(g);return {mesh:g,home:new THREE.Vector3(...p),scale,phase:i*1.65,kind}});host.dataset.objects=items.length;host.dataset.models=[...new Set(items.map(x=>x.kind))].join(',');host.dataset.foreground=String(positions.filter(p=>p[2]>.8).length)}

 let paused=initialPaused,visible=true,spinning=false,raf=0,last=performance.now(),time=0,activeTL=null,dragging=false,yaw=0,pitch=0,velocity=0,lastX=0,lastY=0,dragId=null;
 const pointer=new THREE.Vector2(),mouseWorld=new THREE.Vector3(),raycaster=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);let hovering=false,bounds;
 function render(){renderer.render(scene,camera)}
 function layout(){bounds=host.getBoundingClientRect();if(!bounds.width||!bounds.height)return;const next=bounds.width<=760;camera.aspect=bounds.width/bounds.height;camera.position.z=next?6.8:8.65;camera.position.y=next?.06:-.20;backdrop.position.y=camera.position.y;const bgHalfHeight=(camera.position.z+6)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));backdrop.scale.set(bgHalfHeight*camera.aspect,bgHalfHeight,1);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,next?1.65:2));renderer.setSize(bounds.width,bounds.height,false);if(next!==mobile&&!spinning){mobile=next;if(lib)populate(flavor,lib)}render()}
 const resize=new ResizeObserver(layout);resize.observe(host);
 function locate(e){bounds=host.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,1-(e.clientY-bounds.top)/bounds.height*2);raycaster.setFromCamera(pointer,camera);raycaster.ray.intersectPlane(plane,mouseWorld)}
 host.addEventListener('pointerdown',e=>{if(spinning||e.button!==0)return;locate(e);if(!raycaster.intersectObject(bottle,true).length)return;dragging=true;dragId=e.pointerId;lastX=e.clientX;lastY=e.clientY;velocity=0;host.setPointerCapture(e.pointerId);host.classList.add('dragging');host.dataset.dragging='true';host.style.touchAction='none';e.preventDefault();schedule()});
 host.addEventListener('pointermove',e=>{locate(e);hovering=e.pointerType!=='touch';if(dragging&&e.pointerId===dragId){const dx=e.clientX-lastX;velocity=dx*.003; yaw+=dx*.011;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.006,-.95,.95);lastX=e.clientX;lastY=e.clientY;if(paused&&!spinning){root.rotation.y=yaw;root.rotation.x=pitch;render()}}schedule()});
 function release(e){if(!dragging||e.pointerId!==dragId)return;dragging=false;dragId=null;host.classList.remove('dragging');host.dataset.dragging='false';host.dataset.rotation=yaw.toFixed(2);host.style.touchAction='pan-y';if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId)}
 host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.addEventListener('lostpointercapture',()=>{dragging=false;host.classList.remove('dragging')});host.addEventListener('pointerleave',()=>{hovering=false});
 host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)||spinning)return;e.preventDefault();if(e.key==='Home')yaw=pitch=0;else if(e.key==='ArrowUp'||e.key==='ArrowDown')pitch=THREE.MathUtils.clamp(pitch+(e.key==='ArrowUp'?.2:-.2),-.95,.95);else yaw+=(e.key==='ArrowLeft'?-.3:.3);if(paused){root.rotation.y=yaw;root.rotation.x=pitch;render()}else schedule()});
 function schedule(){if(!raf&&visible&&!document.hidden&&!paused&&!spinning)raf=requestAnimationFrame(loop)}
 function loop(now){raf=0;if(paused||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.04);last=now;time+=dt;
  if(!spinning){if(!dragging){yaw+=velocity;velocity*=Math.exp(-dt*6);pitch=THREE.MathUtils.damp(pitch,0,2,dt)}root.rotation.y=THREE.MathUtils.damp(root.rotation.y,yaw+(hovering&&!dragging?pointer.x*.14:0),7,dt);root.rotation.x=THREE.MathUtils.damp(root.rotation.x,pitch+(hovering&&!dragging?-pointer.y*.055:0),5,dt);root.rotation.z=THREE.MathUtils.damp(root.rotation.z,-.13+(hovering?pointer.x*.025:0),4,dt);root.position.y=Math.sin(time*.8)*.045;
   for(const it of items){const h=it.home;let x=h.x+Math.cos(time*.48+it.phase)*.055,y=h.y+Math.sin(time*.8+it.phase)*.09,z=h.z+Math.sin(time*.4+it.phase)*.06;if(hovering){x-=pointer.x*(.065-h.z*.03);y-=pointer.y*.045;const dx=x-mouseWorld.x,dy=y-mouseWorld.y,d=Math.hypot(dx,dy);if(d<.95){const force=(.95-d)*.8;x+=dx/(d+.001)*force;y+=dy/(d+.001)*force}}it.mesh.position.x=THREE.MathUtils.damp(it.mesh.position.x,x,4,dt);it.mesh.position.y=THREE.MathUtils.damp(it.mesh.position.y,y,4,dt);it.mesh.position.z=THREE.MathUtils.damp(it.mesh.position.z,z,4,dt);it.mesh.rotation.y+=dt*.12;it.mesh.rotation.z+=dt*.045}
  }render();schedule();
 }
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=performance.now();if(activeTL&&!paused)activeTL.resume();schedule()}else{cancelAnimationFrame(raf);raf=0;activeTL?.pause()}},{threshold:.01});intersection.observe(host);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;activeTL?.pause()}else{last=performance.now();if(!paused)activeTL?.resume();schedule()}});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;host.classList.remove('ready')});renderer.domElement.addEventListener('webglcontextrestored',()=>{host.classList.add('ready');schedule()});
 // Show the bottle first, with the correct camera and aspect ratio already applied.
 layout();await renderer.compileAsync(scene,camera);render();host.classList.add('ready');host.dataset.phase='bottle';schedule();
 // Detail arrives progressively; no automatic parsing of the entire catalogue.
 initialLibrary.then(async loaded=>{if(flavor.id!==initial.id||spinning||lib)return;lib=loaded;populate(initial,lib);await renderer.compileAsync(scene,camera);render();host.dataset.phase='complete';}).catch(err=>console.warn('Decorative model loading:',err));
 hdrPromise.then(async hdr=>{const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(hdr);scene.environment=environment.texture;scene.environmentIntensity=.8;hdr.dispose();pmrem.dispose();await renderer.compileAsync(scene,camera);render();}).catch(err=>console.warn('Studio lighting:',err));
 return {
  prefetch(f){return Promise.all([texture(f),library(f)]).catch(()=>{});},
  async setFlavor(f){const [t,libraryNext]=await Promise.all([texture(f),library(f)]);flavor=f;lib=libraryNext;backdropTheme(f);apply(f,t);populate(f,lib);yaw=pitch=velocity=0;root.rotation.set(0,0,-.13);render()},
  pause(value){paused=value;if(paused){cancelAnimationFrame(raf);raf=0;if(activeTL)activeTL.progress(1);window.gsap?.killTweensOf([backgroundMaterial.uniforms.base.value,backgroundMaterial.uniforms.glow.value,backgroundMaterial.uniforms.pulse]);backgroundMaterial.uniforms.pulse.value=0;backdropTheme(flavor);render()}else{last=performance.now();schedule()}},
  async transition(f,onSwap,onStart){const [t,nextLib]=await Promise.all([texture(f),library(f)]);flavor=f;lib=nextLib;
   if(paused||!window.gsap){backdropTheme(f);apply(f,t);populate(f,lib);yaw=0;pitch=0;velocity=0;root.rotation.set(0,0,-.13);onStart();onSwap();render();return}
   backdropTheme(f,true);spinning=true;cancelAnimationFrame(raf);raf=0;dragging=false;velocity=0;host.classList.remove('dragging');const oldItems=items.slice(),startYaw=root.rotation.y;onStart();
   return new Promise(resolve=>{const tl=gsap.timeline({onUpdate:render,onComplete:()=>{spinning=false;activeTL=null;yaw=pitch=velocity=0;root.rotation.y=0;host.style.filter='';render();schedule();resolve()}});activeTL=tl;
    tl.to(root.rotation,{y:startYaw+Math.PI*4,duration:1.85,ease:'power2.inOut'},0);
    tl.to(root.rotation,{z:.13,x:-.12,duration:.75,ease:'power2.inOut'},0).to(root.rotation,{z:-.13,x:0,duration:1.1,ease:'power2.out'},.75);
    tl.to(root.scale,{x:.85,y:.85,z:.85,duration:.62,ease:'power2.in'},0).to(root.scale,{x:1,y:1,z:1,duration:1.15,ease:'back.out(1.2)'},.62);
    tl.to(host,{filter:'blur(2px)',duration:.25},.45).to(host,{filter:'blur(0px)',duration:.4},1.05);
    oldItems.forEach((it,i)=>{tl.to(it.mesh.position,{x:0,y:.1,z:0,duration:.61,ease:'power3.in'},i*.018);tl.to(it.mesh.scale,{x:0,y:0,z:0,duration:.53,ease:'power2.in'},i*.018)});
    // Build the next objects up front so the entire explosion belongs to one timeline.
    const oldFloating=oldItems.map(x=>x.mesh);populate(f,lib);const incoming=items.slice();for(const old of oldFloating)floating.add(old);incoming.forEach(it=>{it.mesh.visible=false;it.mesh.position.set(0,.1,0);it.mesh.scale.setScalar(0)});
    tl.call(()=>{oldFloating.forEach(m=>floating.remove(m));apply(f,t);onSwap();incoming.forEach(it=>it.mesh.visible=true)},[],.82);
    incoming.forEach((it,i)=>{const at=.83+i*.023;tl.to(it.mesh.position,{x:it.home.x,y:it.home.y,z:it.home.z,duration:.96,ease:'power3.out'},at);tl.to(it.mesh.scale,{x:it.scale,y:it.scale,z:it.scale,duration:.84,ease:'back.out(1.65)'},at);tl.fromTo(it.mesh.rotation,{z:it.mesh.rotation.z-1.3},{z:it.mesh.rotation.z,duration:1.0,ease:'power2.out'},at)});
   });
  }
 };
}
