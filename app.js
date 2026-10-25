/*
 * ZEDA — a cinematographic single-page experience.
 * Vanilla JS / Three.js (ESM on demand). No UI or animation framework.
 * Research claims are aspirational unless explicitly backed by the linked papers.
 */
(() => {
  'use strict';
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const $ = (sel) => document.querySelector(sel);
  const scenes = $$('.scene');
  const dots = $$('.timeline-stop');
  const phases = $$('.evolution-steps button');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {
    index: 0, busy: false, finalTimer: null, phaseTimer: null,
    phase: 0, pointerX: 0, pointerY: 0, touchY: null,
    active: document.visibilityState !== 'hidden',
    lastWheel: 0, glReady: false
  };
  const phaseNames = [
    'THE FIRST DISTINCTION', 'MATTER ARRANGES ITSELF',
    'COMPLEXITY FINDS A FORM', 'LIFE REMEMBERS', 'INTELLIGENCE CONVERGES'
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = (n) => String(n).padStart(2, '0');

  function stopPhaseCycle() {
    if (state.phaseTimer) clearInterval(state.phaseTimer);
    state.phaseTimer = null;
  }
  function setPhase(next) {
    state.phase = (next + phaseNames.length) % phaseNames.length;
    $('#phase-index').textContent = pad(state.phase + 1);
    $('#phase-name').textContent = phaseNames[state.phase];
    phases.forEach((button, i) => {
      button.classList.toggle('selected', i === state.phase);
      button.setAttribute('aria-pressed', String(i === state.phase));
    });
  }
  function startPhaseCycle() {
    stopPhaseCycle();
    setPhase(0);
    if (!reduced) {
      state.phaseTimer = setInterval(() => {
        if (state.index === 1 && state.active) setPhase(state.phase + 1);
      }, 3700);
    }
  }
  phases.forEach((button) => button.addEventListener('click', () => {
    setPhase(Number(button.dataset.phase));
    if (state.index === 1) {
      stopPhaseCycle();
      if (!reduced) state.phaseTimer = setInterval(() => setPhase(state.phase + 1), 5100);
    }
  }));

  function cancelFinal() {
    if (state.finalTimer) clearTimeout(state.finalTimer);
    state.finalTimer = null;
    document.body.classList.remove('final-unlocked');
  }
  function unlockFinal() {
    cancelFinal();
    if (state.index === 5) {
      state.finalTimer = setTimeout(() => {
        document.body.classList.add('final-unlocked');
      }, reduced ? 120 : 1900);
    }
  }
  function updateMeta(index) {
    document.body.dataset.scene = String(index);
    $('#scene-current').textContent = pad(index + 1);
    $('#prev').disabled = index === 0;
    $('#next').disabled = index === scenes.length - 1;
    dots.forEach((button, i) => {
      button.classList.toggle('is-current', i === index);
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    history.replaceState(null, '', index === 0 ? '#beginning' : `#${scenes[index].id}`);
  }
  function commit(index) {
    scenes.forEach((scene, i) => {
      const active = i === index;
      scene.classList.toggle('current', active);
      scene.setAttribute('aria-hidden', String(!active));
      scene.inert = !active;
    });
    state.index = index;
    updateMeta(index);
    if (index === 1) startPhaseCycle();
    else stopPhaseCycle();
    if (index === 5) unlockFinal();
    else cancelFinal();
  }
  function goTo(index) {
    index = clamp(index, 0, scenes.length - 1);
    if (index === state.index || state.busy) return;
    if (reduced) {commit(index); return;}
    state.busy = true;
    document.body.classList.add('is-transitioning');
    // The new scene is committed while the screen is completely occluded.
    setTimeout(() => commit(index), 455);
    setTimeout(() => {
      document.body.classList.remove('is-transitioning');
      state.busy = false;
    }, 1025);
  }
  $('#prev').addEventListener('click', () => goTo(state.index - 1));
  $('#next').addEventListener('click', () => goTo(state.index + 1));
  $$('[data-next]').forEach((button) => button.addEventListener('click', () => goTo(state.index + 1)));
  dots.forEach((button) => button.addEventListener('click', () => goTo(Number(button.dataset.goto))));
  $('#brand-link').addEventListener('click', (event) => {event.preventDefault(); goTo(0);});
  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey || Math.abs(event.deltaY) < 15) return;
    // Prevent the trackpad from firing 12 navigation events on one gesture.
    event.preventDefault();
    const now = performance.now();
    if (now - state.lastWheel < 1150) return;
    state.lastWheel = now;
    goTo(state.index + Math.sign(event.deltaY));
  }, {passive:false});
  window.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest?.('input,textarea,select')) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();goTo(state.index + 1);
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();goTo(state.index - 1);
    } else if (event.key === 'Home') {event.preventDefault();goTo(0);}
    else if (event.key === 'End') {event.preventDefault();goTo(5);}
  });
  window.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) state.touchY = event.touches[0].clientY;
  }, {passive:true});
  window.addEventListener('touchend', (event) => {
    if (state.touchY === null) return;
    const dy = state.touchY - event.changedTouches[0].clientY;
    if (Math.abs(dy) > 55) goTo(state.index + Math.sign(dy));
    state.touchY = null;
  }, {passive:true});
  window.addEventListener('pointermove', (event) => {
    state.pointerX = event.clientX / window.innerWidth * 2 - 1;
    state.pointerY = event.clientY / window.innerHeight * 2 - 1;
  }, {passive:true});
  document.addEventListener('visibilitychange', () => {
    state.active = document.visibilityState !== 'hidden';
  });
  const incoming = location.hash.slice(1);
  const initial = scenes.findIndex((scene) => scene.id === incoming);
  if (initial > 0) commit(initial);
  else commit(0);

  // CANVAS FALLBACK: procedural particle states also work if WebGL is unavailable.
  const fallbackCanvas = $('#fallback-canvas');
  const cx = fallbackCanvas.getContext('2d', {alpha:true});
  const fallbackPoints = Array.from({length:1100}, (_, i) => {
    const angle = i * 2.399963229728653;
    const r = Math.sqrt((i + .5) / 1100);
    return {angle, r, x:Math.cos(angle)*r, y:Math.sin(angle)*r, fuzz:Math.sin(i * 12.9898) * 0.5 + 0.5};
  });
  function sizeFallback() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fallbackCanvas.width = Math.round(innerWidth * dpr);
    fallbackCanvas.height = Math.round(innerHeight * dpr);
    fallbackCanvas.style.width = innerWidth + 'px';
    fallbackCanvas.style.height = innerHeight + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeFallback();
  window.addEventListener('resize', sizeFallback, {passive:true});
  function paintFallback(time) {
    if (!state.glReady) {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      if (state.index === 1 || state.index === 2) {
        const mobile = innerWidth < 750;
        const ox = innerWidth * (mobile ? .67 : .78);
        const oy = innerHeight * (mobile ? .32 : .52);
        const radius = Math.min(innerWidth * (mobile ? .4 : .23), innerHeight * .34);
        const t = time * .00024;
        const phase = state.index === 2 ? 4 : state.phase;
        const points = fallbackPoints;
        for (let i=0; i<points.length; i++) {
          const p = points[i];
          const a = p.angle + t*.7;
          let xx = 0, yy = 0;
          switch (phase) {
            case 0: {
              const rr = (0.14 + p.r*.82)*radius;
              xx = Math.cos(a*1.01)*rr;
              yy = Math.sin(a*1.01)*rr*.65;
              break;
            }
            case 1: {
              xx = Math.cos(a)*p.r*radius;
              yy = Math.sin(a)*p.r*radius;
              break;
            }
            case 2: {
              const lobes = Math.floor(i%3);
              const theta = p.r*6.283+t;
              xx = Math.cos(theta)*radius*.5 + Math.cos(lobes*2.094)*radius*.39;
              yy = Math.sin(theta)*radius*.5 + Math.sin(lobes*2.094)*radius*.39;
              break;
            }
            case 3: {
              const ph = i * .051;
              xx = Math.sin(ph + (i%2)*Math.PI + t)*radius*.46;
              yy = ((i%155)/155-.5)*radius*1.75;
              break;
            }
            default: {
              const phi = Math.acos(1 - 2*(i+.5)/points.length);
              const theta = Math.PI*(1+Math.sqrt(5))*i;
              xx = Math.cos(theta)*Math.sin(phi)*radius*.72;
              yy = Math.cos(phi)*radius*1.12;
            }
          }
          const alpha = .14 + p.fuzz*.35;
          cx.fillStyle = `rgba(210,211,207,${alpha})`;
          cx.fillRect(ox+xx,oy+yy, p.fuzz > .7 ? 1.3 : .7, p.fuzz > .7 ? 1.3 : .7);
        }
      }
    }
    requestAnimationFrame(paintFallback);
  }
  if (cx) requestAnimationFrame(paintFallback);

  // THREE.JS: a living photographic entity, not a low-poly robot mask.
  // One anatomical side remains near-still; the other is reconstructed every frame.
  // The generated portrait is local, optimized and still visible if WebGL/CDN is absent.
  async function startThree(){
    if (reduced) return;
    let THREE;
    try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'); }
    catch (e) { console.info('Zeda: Three.js unavailable; using image and Canvas fallback.'); return; }
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
      renderer.setSize(innerWidth,innerHeight);
      renderer.setClearColor(0x000000,0);
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      $('#webgl').appendChild(renderer.domElement);
    } catch(e) {return;}
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-innerWidth/2,innerWidth/2,innerHeight/2,-innerHeight/2,-10,10);
    const surface = new THREE.PlaneGeometry(1,1,64,96);
    const load = new THREE.TextureLoader();
    let tex;
    try {tex=await load.loadAsync('./zeda-entity.webp');}
    catch(e){renderer.dispose();$('#webgl').replaceChildren();return;}
    tex.colorSpace=THREE.SRGBColorSpace;
    const uniforms={
      map:{value:tex}, time:{value:0}, alpha:{value:1}, pointer:{value:new THREE.Vector2()}, activity:{value:1}
    };
    const living = new THREE.ShaderMaterial({
      uniforms, transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:`
        varying vec2 vUv;
        uniform float time; uniform float activity; uniform vec2 pointer;
        void main(){
          vUv=uv;
          vec3 p=position;
          float right=smoothstep(.49,.85,uv.x);
          float breath=sin(time*.58+uv.y*5.0)*sin(uv.y*17.0-time*.41);
          float shear=sin(time*.43+uv.y*29.0)*.004;
          p.x+=right*activity*(breath*.009+shear)*0.6;
          p.z+=right*activity*(sin(uv.y*11.7+time*.61)*.025 + sin(uv.x*28.0-time*.33)*.008);
          p.x+=pointer.x*right*.002;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }
      `,
      fragmentShader:`
        varying vec2 vUv;
        uniform sampler2D map; uniform float time; uniform float alpha; uniform float activity;
        void main(){
          float alive=smoothstep(.48,.78,vUv.x)*activity;
          vec2 uv=vUv;
          float filament=sin(vUv.y*48.0+sin(vUv.x*18.0+time*.37)*2.0+time*.77);
          uv.x+=alive*(.0018*filament + .0025*sin(time*.51+vUv.y*17.0));
          uv.y+=alive*.0016*sin(vUv.x*51.0-time*.71);
          vec3 col=texture2D(map,uv).rgb;
          float micro=alive*.036*sin(uv.x*370.0+time*.7)*sin(uv.y*221.0-time*.28);
          col+=micro;
          float edge=smoothstep(.005,.085,vUv.x)*smoothstep(.005,.075,1.0-vUv.x)*smoothstep(.01,.12,vUv.y)*smoothstep(.01,.1,1.0-vUv.y);
          float luminosity=max(col.r,max(col.g,col.b));
          float darkAlpha=smoothstep(.008,.075,luminosity);
          gl_FragColor=vec4(col,alpha*edge*darkAlpha);
        }
      `
    });
    const portrait = new THREE.Mesh(surface,living);
    scene.add(portrait);
    // A sparse constellation of independent neural fragments, never a stock HUD.
    const n=230;
    const particlePositions=new Float32Array(n*3),seeds=new Float32Array(n*3);
    const fract=(v)=>v-Math.floor(v);
    for(let i=0;i<n;i++){
      const rx=fract(Math.sin(i*94.31)*43758.5), ry=fract(Math.sin(i*14.79)*13425.7);
      seeds[3*i]=.55+rx*.47;
      seeds[3*i+1]=.16+ry*.74;
      seeds[3*i+2]=fract(Math.sin(i*27.46)*15785.3);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
    const particles=new THREE.Points(geo,new THREE.PointsMaterial({color:0xccc5bd,size:1.2,sizeAttenuation:false,transparent:true,opacity:.38,depthWrite:false}));
    scene.add(particles);
    // Five morph targets; geometry is a visual metaphor, not a claim about cosmology.
    const COUNT=2100;
    const targets=Array.from({length:5},()=>new Float32Array(COUNT*3));
    const current=new Float32Array(COUNT*3);
    const rand=(i,off)=>fract(Math.sin(i*127.1+off*31.87)*43758.5453);
    for(let i=0;i<COUNT;i++){
      const u=(i+.5)/COUNT;
      const a=i*2.3999632297;
      const rr=Math.sqrt(u),ns=rand(i,1),nt=rand(i,2);
      const put=(j,x,y,z)=>{targets[j][3*i]=x;targets[j][3*i+1]=y;targets[j][3*i+2]=z;};
      // 1 mathematical structure / 2 matter / 3 bonds / 4 living replicator / 5 intelligence
      put(0,Math.cos(a)*rr,Math.sin(a*2.0)*rr*.42,Math.sin(a)*rr*.5);
      const th=Math.acos(1.0-2.0*u), rad=.85*Math.cbrt(ns);
      put(1,rad*Math.sin(th)*Math.cos(a),rad*Math.cos(th),rad*Math.sin(th)*Math.sin(a));
      const c=i%3,ang=u*70.0+c*2.094;
      put(2,Math.cos(ang)*.52+Math.cos(c*2.09)*.38,Math.sin(ang)*.52+Math.sin(c*2.09)*.38,Math.sin(ang*1.7)*.3);
      const yy=(u-.5)*2.55,tw=yy*7.5+(i%2)*Math.PI;
      put(3,Math.cos(tw)*(.38+nt*.035),yy,Math.sin(tw)*.38);
      put(4,Math.cos(a)*Math.sin(th)*.76,Math.cos(th)*1.14,Math.sin(a)*Math.sin(th)*.47);
      for(let k=0;k<3;k++)current[3*i+k]=targets[0][3*i+k];
    }
    const dustGeometry=new THREE.BufferGeometry();
    dustGeometry.setAttribute('position',new THREE.BufferAttribute(current,3));
    const dustMat=new THREE.PointsMaterial({color:0xe6e3df,size:1.3,sizeAttenuation:false,opacity:0,transparent:true,depthWrite:false});
    const dust=new THREE.Points(dustGeometry,dustMat);
    scene.add(dust);
    const clock=new THREE.Clock();
    let smoothAlpha=0,smoothDust=0;
    const resize=()=>{
      const w=innerWidth,h=innerHeight;
      camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();
      renderer.setSize(w,h);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
    };
    addEventListener('resize',resize,{passive:true});
    resize();
    function frame(){
      requestAnimationFrame(frame);
      if(!state.active)return;
      const t=clock.getElapsedTime(), w=innerWidth, h=innerHeight, mobile=w<=750;
      uniforms.time.value=t;
      uniforms.pointer.value.set(state.pointerX,state.pointerY);
      const target=state.index===0?1:0;
      smoothAlpha=lerp(smoothAlpha,target,.045);
      uniforms.alpha.value=smoothAlpha;
      const vh=mobile?h*.74:h*.92;
      portrait.scale.set(vh*2/3,vh,1);
      portrait.position.set(mobile?w*.16:w*.292,mobile?h*.17:h*.005,0);
      portrait.rotation.z=state.pointerX*.0035;
      portrait.visible=smoothAlpha>.006;
      const out=geo.attributes.position;
      for(let i=0;i<n;i++){
        const x=seeds[3*i],y=seeds[3*i+1],seed=seeds[3*i+2];
        const drift=Math.sin(t*(.32+seed*.55)+i*.42)*(.002+.014*seed);
        out.array[3*i]=(x-.5)*portrait.scale.x+portrait.position.x+drift*portrait.scale.x;
        out.array[3*i+1]=(y-.5)*portrait.scale.y+portrait.position.y+Math.sin(t*.58+i*.38)*1.3;
        out.array[3*i+2]=.5;
      }
      out.needsUpdate=true;
      particles.material.opacity=smoothAlpha*.33;
      particles.visible=smoothAlpha>.01;
      const targetDust=state.index===1?1:state.index===2?.2:0;
      smoothDust=lerp(smoothDust,targetDust,.045);
      dustMat.opacity=smoothDust*.7;
      dust.visible=smoothDust>.008;
      if(dust.visible){
        const to=targets[state.index===2?4:state.phase];
        const arr=dustGeometry.attributes.position.array;
        for(let i=0;i<arr.length;i++)arr[i]+=(to[i]-arr[i])*.03;
        dustGeometry.attributes.position.needsUpdate=true;
        const ss=Math.min(w*.26,h*.31);
        dust.scale.setScalar(ss);
        dust.position.set(mobile?w*.16:w*.275,mobile?h*.18:0,0);
        dust.rotation.y=.12*t;
        dust.rotation.x=.07*Math.sin(t*.4);
      }
      renderer.render(scene,camera);
    }
    state.glReady=true;
    document.body.classList.add('webgl-ready');
    frame();
  }
  startThree();
})();
