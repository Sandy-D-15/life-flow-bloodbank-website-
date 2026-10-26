import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Activity, Sliders, RotateCcw, X, Droplets, Palette, Play } from 'lucide-react';

interface BloodDropFlowProps {
  className?: string;
}

// Configurable fluid simulation parameters
export interface Fluid3DConfig {
  mode: 'floating' | 'cycle';
  colorScheme: 'arterial' | 'crimson' | 'oxygenated';
  speed: number;                 // 0.5x to 2.0x (default 1.0)
  gravity: number;               // 0.6g to 1.8g (default 1.0)
  deformationIntensity: number;  // 0.4x to 1.8x (default 1.0)
  splashIntensity: number;       // 0.4 to 1.8 (default 1.0)
  rippleStrength: number;        // 0.4 to 1.8 (default 1.0)
  dropScale: number;             // 0.85x to 1.2x (default 1.0)
  lightIntensity: number;        // 0.6x to 1.6x (default 1.0)
  gloss: number;                 // 0.6 to 1.8 (default 1.1)
  presetName: string;
}

const COLOR_SCHEMES = {
  arterial: {
    name: 'Arterial Ruby',
    body: 0xC80020,
    rim: 0xFF1E46,
    core: 0x5A000A,
  },
  crimson: {
    name: 'Deep Crimson',
    body: 0xA40018,
    rim: 0xF21238,
    core: 0x3E0006,
  },
  oxygenated: {
    name: 'Oxygenated Vivid',
    body: 0xE2002A,
    rim: 0xFF3558,
    core: 0x6E0010,
  },
};

const DEFAULT_CONFIG: Fluid3DConfig = {
  mode: 'cycle',
  colorScheme: 'arterial',
  speed: 1.0,
  gravity: 1.15,
  deformationIntensity: 1.0,
  splashIntensity: 1.1,
  rippleStrength: 1.25,
  dropScale: 1.0,
  lightIntensity: 1.0,
  gloss: 1.1,
  presetName: 'Realistic 3D Liquid'
};

const PRESETS: Record<string, Fluid3DConfig> = {
  'Realistic 3D Liquid': { ...DEFAULT_CONFIG },
  'Clinical Calm': {
    mode: 'floating',
    colorScheme: 'arterial',
    speed: 0.75,
    gravity: 0.8,
    deformationIntensity: 0.7,
    splashIntensity: 0.6,
    rippleStrength: 0.7,
    dropScale: 0.98,
    lightIntensity: 0.95,
    gloss: 1.0,
    presetName: 'Clinical Calm'
  },
  'Dynamic Flow': {
    mode: 'cycle',
    colorScheme: 'oxygenated',
    speed: 1.3,
    gravity: 1.25,
    deformationIntensity: 1.2,
    splashIntensity: 1.25,
    rippleStrength: 1.35,
    dropScale: 1.02,
    lightIntensity: 1.1,
    gloss: 1.2,
    presetName: 'Dynamic Flow'
  }
};

interface ActiveRipple {
  startTime: number;
  duration: number;
  amplitude: number;
}

// GLSL Shaders for Photorealistic Volumetric Liquid Blood
const LIQUID_VERTEX_SHADER = `
  uniform float uWobble;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 pos = position;
    if (abs(uWobble) > 0.0001) {
      float quad = exp(-4.5 * (pos.y + 0.12) * (pos.y + 0.12));
      pos.xz *= (1.0 + uWobble * quad);
      pos.y *= (1.0 - uWobble * 0.5);
    }
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const LIQUID_FRAGMENT_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  uniform vec3 uColorBody;
  uniform vec3 uColorRim;
  uniform vec3 uColorCore;
  uniform float uGloss;
  uniform float uLightIntensity;
  uniform vec3 uKeyLightDir;
  uniform vec3 uFillLightDir;
  uniform vec3 uRimLightDir;
  uniform float uOpacity;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);

    // 1. Fresnel viewing factor
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 3.0);

    // 2. Volumetric Optical Depth (Beer-Lambert Law smooth approximation)
    // Smooth, continuous gradient from luminous crimson center to glowing scarlet rim
    float depth = pow(NdotV, 1.25);
    vec3 liquidBase = mix(uColorRim, uColorBody, depth);
    liquidBase = mix(liquidBase, uColorCore, depth * depth);

    // 3. Internal Caustic Refraction Glow
    float keyDotN = max(0.0, dot(N, uKeyLightDir));
    float caustic = pow(keyDotN * 0.5 + 0.5, 2.0) * (0.35 + 0.65 * NdotV);
    vec3 internalLight = uColorRim * caustic * 0.45;

    // 4. Broad Studio Softbox Specular Reflections (Curved Strip Boxes)
    vec3 R = reflect(-V, N);

    // Key studio strip softbox on left contour
    float stripX = (R.x - (-0.30)) / 0.35;
    float stripY = (R.y - 0.25) / 0.70;
    float distKeyStrip = stripX * stripX + stripY * stripY;
    float keySpecular = exp(-distKeyStrip * 7.5 * (2.0 - uGloss * 0.7)) * 0.90;

    // Fill studio strip softbox on right contour
    float fillX = (R.x - 0.38) / 0.40;
    float fillY = (R.y - 0.20) / 0.65;
    float distFillStrip = fillX * fillX + fillY * fillY;
    float fillSpecular = exp(-distFillStrip * 6.0) * 0.35;

    // Soft overhead apex gleam
    float apexX = R.x / 0.40;
    float apexY = (R.y - 0.75) / 0.30;
    float apexSpecular = exp(-(apexX * apexX + apexY * apexY) * 9.0) * 0.60;

    vec3 specular = vec3(1.0, 0.94, 0.96) * (keySpecular + fillSpecular + apexSpecular) * uGloss;

    // 5. Delicate Edge Fresnel Reflection
    vec3 edgeReflection = vec3(1.0, 0.92, 0.95) * fresnel * 0.38 * uGloss;

    // 6. Subtle Rim separation from behind
    float rimDot = max(0.0, dot(N, uRimLightDir));
    float rimTrans = pow(rimDot, 2.5) * fresnel;
    vec3 rimGlow = uColorRim * rimTrans * 0.85;

    // Final color
    vec3 finalColor = (liquidBase + internalLight + rimGlow) * uLightIntensity + specular + edgeReflection;
    float alpha = mix(0.99, 0.94, fresnel * 0.35) * uOpacity;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const BloodDropFlow: React.FC<BloodDropFlowProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // User-facing interactive controls
  const [config, setConfig] = useState<Fluid3DConfig>(DEFAULT_CONFIG);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

  // Mutable animation references
  const animFrameIdRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const impactTriggerRef = useRef<boolean>(false);

  // Trigger one-shot impact sequence interactively
  const triggerImpact = () => {
    impactTriggerRef.current = true;
  };

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Parallax mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    targetMouseRef.current = { x: nx * 0.35, y: ny * 0.25 };
  };

  const handleMouseLeave = () => {
    targetMouseRef.current = { x: 0, y: 0 };
  };

  // Main Three.js Scene Setup & Photorealistic Render Loop
  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const initialWidth = mountEl.clientWidth || 360;
    const initialHeight = mountEl.clientHeight || 360;

    // 1. Scene & Camera Framing (Centered, perfectly framed without clipping)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, initialWidth / initialHeight, 0.1, 20);
    camera.position.set(0, 0.05, 3.6);
    camera.lookAt(0, -0.05, 0);

    // 2. High-Performance WebGL Renderer with ACES Tone Mapping
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebGLSupported(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(initialWidth, initialHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    // Dynamic responsive resizing across desktop, tablet, and mobile displays
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(mountEl);

    // Visibility-aware execution: pause rendering when hero is scrolled off-screen
    let isVisible = true;
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isVisible = entry ? entry.isIntersecting : true;
          if (isVisible) {
            lastTime = performance.now();
          }
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(mountEl);
    }

    // 3. PHYSICAL TEARDROP GEOMETRY: Golden Ratio Young-Laplace Continuous Profile
    // - Spherical bottom dome with horizontal tangent at bottom pole
    // - Broad rounded shoulders curving seamlessly inward
    // - Slender, elegantly tapered neck and rounded apex tip
    // - Strictly monotonic and C-infinity continuous everywhere (zero creases or folds)
    const segmentsY = 48;
    const segmentsRad = 36;
    const points: THREE.Vector2[] = [];

    for (let i = 0; i <= segmentsY; i++) {
      const t = i / segmentsY; // 0 (bottom pole) to 1 (top apex)
      const u = t * Math.PI;

      // Perfectly smooth cosine height distribution from -0.46 to +0.50
      const y = -0.46 + (1.0 - Math.cos(u)) * 0.48;

      // Pure continuous teardrop radius profile
      const dome = Math.sin(u);
      const taper = Math.pow(Math.cos(u * 0.5), 0.68);
      const shoulder = 1.0 + 0.25 * Math.sin(u * 0.85);
      const r = 0.385 * dome * taper * shoulder;

      points.push(new THREE.Vector2(Math.max(0.0001, r), y));
    }

    const dropGeometry = new THREE.LatheGeometry(points, segmentsRad);
    dropGeometry.computeVertexNormals();

    // 4. Photorealistic Custom GLSL Liquid Blood Material
    const activeColors = COLOR_SCHEMES[config.colorScheme] || COLOR_SCHEMES.arterial;

    const keyLightDir = new THREE.Vector3(0.5, 0.75, 0.5).normalize();
    const fillLightDir = new THREE.Vector3(-0.6, 0.35, 0.4).normalize();
    const rimLightDir = new THREE.Vector3(0.0, 0.6, -0.8).normalize();

    const dropMaterial = new THREE.ShaderMaterial({
      vertexShader: LIQUID_VERTEX_SHADER,
      fragmentShader: LIQUID_FRAGMENT_SHADER,
      uniforms: {
        uColorBody: { value: new THREE.Color(activeColors.body) },
        uColorRim: { value: new THREE.Color(activeColors.rim) },
        uColorCore: { value: new THREE.Color(activeColors.core) },
        uGloss: { value: config.gloss },
        uLightIntensity: { value: config.lightIntensity },
        uKeyLightDir: { value: keyLightDir },
        uFillLightDir: { value: fillLightDir },
        uRimLightDir: { value: rimLightDir },
        uOpacity: { value: 1.0 },
        uWobble: { value: 0.0 },
      },
      transparent: true,
      depthWrite: true,
    });

    const dropMesh = new THREE.Mesh(dropGeometry, dropMaterial);
    scene.add(dropMesh);

    // 5. Grounded, Realistic Contact Shadow (Deep, Soft & Smoothly Integrated)
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    shadowGeo.rotateX(-Math.PI / 2);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(128, 128, 2, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(42, 8, 16, 0.48)'); // Soft, restrained core occlusion
    sGrad.addColorStop(0.28, 'rgba(80, 15, 26, 0.24)');
    sGrad.addColorStop(0.65, 'rgba(150, 32, 50, 0.06)');
    sGrad.addColorStop(1, 'rgba(255, 245, 248, 0.0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, -0.478, 0);
    scene.add(shadowMesh);

    // 6. Subtle Refractive Liquid Surface Ripples (Pre-rendered once - zero per-frame CPU drawing)
    const rippleGeo = new THREE.PlaneGeometry(1.6, 1.6);
    rippleGeo.rotateX(-Math.PI / 2);

    const rippleCanvas = document.createElement('canvas');
    rippleCanvas.width = 256;
    rippleCanvas.height = 256;
    const rCtx = rippleCanvas.getContext('2d')!;
    const cx = 128;
    const cy = 128;
    const maxR = 120;

    for (let r = 8; r < maxR; r += 2) {
      const normR = r / maxR;
      const wave = Math.sin(normR * 14.0) * Math.exp(-normR * 2.2);
      if (wave > 0.05) {
        const alpha = wave * 0.50;
        rCtx.strokeStyle = `rgba(255, 240, 246, ${alpha.toFixed(3)})`;
        rCtx.lineWidth = 2.0;
        rCtx.beginPath();
        rCtx.arc(cx, cy, r, 0, Math.PI * 2);
        rCtx.stroke();
      } else if (wave < -0.05) {
        const alpha = Math.abs(wave) * 0.30;
        rCtx.strokeStyle = `rgba(210, 20, 52, ${alpha.toFixed(3)})`;
        rCtx.lineWidth = 2.0;
        rCtx.beginPath();
        rCtx.arc(cx, cy, r, 0, Math.PI * 2);
        rCtx.stroke();
      }
    }

    const rippleTex = new THREE.CanvasTexture(rippleCanvas);

    const rippleMat = new THREE.MeshBasicMaterial({
      map: rippleTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
    rippleMesh.position.set(0, -0.475, 0);
    scene.add(rippleMesh);

    // 7. Physical Ripple Registry (Fading, subtle liquid surface ripples)
    const ripples: ActiveRipple[] = [];
    const triggerSurfaceImpact = (timeNow: number, intensity: number) => {
      ripples.push({
        startTime: timeNow,
        duration: 1.15,
        amplitude: 0.36 * intensity * config.rippleStrength,
      });
    };

    // 9. Premium Delta-Time Physics Animation Engine
    // Default mode: Calm, elegant floating hovering at resting altitude with 100% scale and 100% opacity.
    // Zero shrinking, zero fading, zero repetitive bouncing.
    // If triggered interactively: smooth, coherent descent, contact cushion with surface ripples, and fluid recovery.
    const restingY = 0.08;

    let lastTime = performance.now();
    let floatTimer = 0.0;
    let cycleTimer = 0.0;
    let isImpactActive = false;
    let impactFired = false;

    const render = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(render);
      if (!isVisible) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Mouse Parallax for subtle studio lighting tilt
      mousePosRef.current.x += (targetMouseRef.current.x - mousePosRef.current.x) * 0.06;
      mousePosRef.current.y += (targetMouseRef.current.y - mousePosRef.current.y) * 0.06;

      camera.position.x = mousePosRef.current.x;
      camera.position.y = 0.05 + mousePosRef.current.y;
      camera.lookAt(0, -0.05, 0);

      // Dynamically update shader key light direction with mouse parallax
      keyLightDir.set(0.5 + mousePosRef.current.x * 0.3, 0.75 + mousePosRef.current.y * 0.2, 0.5).normalize();

      const speed = prefersReducedMotion ? config.speed * 0.75 : config.speed;
      const capillaryWaveTime = now * 0.005;

      // Check if an interactive impact was requested
      if (impactTriggerRef.current) {
        impactTriggerRef.current = false;
        isImpactActive = true;
        cycleTimer = 0.0;
        impactFired = false;
      }

      let curY = restingY;
      let curScaleX = 1.0;
      let curScaleY = 1.0;
      let curScaleZ = 1.0;
      let curOpacity = 1.0;
      let tiltZ = Math.sin(now * 0.001) * 0.008 + mousePosRef.current.x * 0.025;
      let surfaceTensionWobble = 0.0;

      const isDripFlowing = config.mode === 'cycle' || isImpactActive;

      if (isDripFlowing) {
        cycleTimer += dt * speed;
        const CYCLE_LEN = 2.8;
        const p = (cycleTimer % CYCLE_LEN) / CYCLE_LEN;

        // In floating mode with interactive trigger, return to floating when 1 cycle completes
        if (isImpactActive && config.mode === 'floating' && cycleTimer >= CYCLE_LEN) {
          isImpactActive = false;
          cycleTimer = 0.0;
          impactFired = false;
        }

        if (p < 0.26) {
          // Phase 1: Droplet Accumulation & Surface-Tension Growth at Top Nozzle
          const targetTopY = 0.38;
          curY = targetTopY + Math.sin(p * 24.0) * 0.005;
          const gProg = Math.min(1.0, p / 0.20);
          const growth = 0.42 + 0.58 * Math.sin(gProg * Math.PI * 0.5);
          curScaleX = growth;
          curScaleY = growth;
          curScaleZ = growth;
          curOpacity = Math.min(1.0, p / 0.06);
          surfaceTensionWobble = Math.sin(p * 26.0) * 0.02 * config.deformationIntensity;
          impactFired = false;
        } else if (p < 0.44) {
          // Phase 2: Viscous Capillary Necking & Downward Stretching
          const neckP = (p - 0.26) / 0.18;
          const neckEase = neckP * neckP * (3.0 - 2.0 * neckP);
          curY = 0.38 - 0.16 * neckEase;
          const stretch = Math.sin(neckP * Math.PI);
          curScaleY = 1.0 + 0.42 * stretch * config.deformationIntensity;
          const radialSqueeze = 1.0 - 0.18 * stretch * config.deformationIntensity;
          curScaleX = radialSqueeze;
          curScaleZ = radialSqueeze;
          curOpacity = 1.0;
          surfaceTensionWobble = Math.sin(neckP * 16.0) * 0.014;
        } else if (p < 0.66) {
          // Phase 3: Pinch-off & Gravity Free-Fall Acceleration
          const fallP = (p - 0.44) / 0.22;
          const fallEase = Math.pow(fallP, 1.85 * config.gravity);
          const startY = 0.22;
          const impactY = 0.0; // Puts bottom of teardrop right at surface y = -0.46
          curY = startY + (impactY - startY) * fallEase;
          const airOsc = Math.sin(fallP * Math.PI * 2.5) * Math.exp(-fallP * 1.8);
          curScaleY = 1.22 - 0.22 * fallP + 0.08 * airOsc;
          const airSqueeze = 0.90 + 0.10 * fallP - 0.04 * airOsc;
          curScaleX = airSqueeze;
          curScaleZ = airSqueeze;
          curOpacity = 1.0;
        } else if (p < 0.82) {
          // Phase 4: Liquid Surface Impact, Cushion Compression & Radial Ripples
          const impactP = (p - 0.66) / 0.16;
          if (!impactFired) {
            triggerSurfaceImpact(now / 1000, config.splashIntensity);
            impactFired = true;
          }
          const squashSine = Math.sin(impactP * Math.PI);
          curScaleY = Math.max(0.24, 1.0 - 0.72 * squashSine);
          curScaleX = 1.0 + 0.48 * squashSine;
          curScaleZ = curScaleX;
          curY = -0.46 + 0.46 * curScaleY * config.dropScale;
          curOpacity = Math.max(0.0, 1.0 - Math.pow(impactP, 1.3));
        } else {
          // Phase 5: Liquid Merged, Ripples Radiate Across Reservoir
          curOpacity = 0.0;
          curY = 0.38;
          curScaleX = 0.4;
          curScaleY = 0.4;
          curScaleZ = 0.4;
        }
      } else {
        // Mode === 'floating': Calm Floating Hover with Surface-Tension Breathing
        floatTimer += dt * speed;
        const floatBob = Math.sin(floatTimer * 1.6) * 0.035;
        curY = restingY + floatBob;
        curScaleX = 1.0 + Math.sin(floatTimer * 1.6) * 0.02;
        curScaleY = 1.0 - Math.sin(floatTimer * 1.6) * 0.02;
        curScaleZ = curScaleX;
        curOpacity = 1.0;
        surfaceTensionWobble = Math.sin(floatTimer * 1.6) * 0.015 * config.deformationIntensity;
      }

        const scaleFactor = config.dropScale;

        // 1. Direct GPU transformation matrix & shader uniform (0 CPU iterations, 0 normal recomputations)
        dropMaterial.uniforms.uWobble.value = surfaceTensionWobble;
        dropMesh.scale.set(curScaleX * scaleFactor, curScaleY * scaleFactor, curScaleZ * scaleFactor);
        dropMesh.position.set(0, curY, 0);
        dropMesh.rotation.z = tiltZ;
        dropMesh.rotation.y = now * 0.00025;
        dropMaterial.uniforms.uOpacity.value = curOpacity;

        // 2. Grounded Contact Shadow Dynamics
        const shadowPlaneY = -0.478;
        const altitude = curY - shadowPlaneY;
        const proximity = Math.max(0.0, Math.min(1.0, 1.0 - altitude / 0.70));
        const shadowSpread = (0.58 - proximity * 0.12) * scaleFactor * curScaleX;
        shadowMesh.scale.set(shadowSpread, 1, shadowSpread);
        shadowMat.opacity = Math.max(0.04, Math.min(0.55, (0.24 + proximity * 0.28) * curOpacity));

        // 3. Surface Ripples Dynamics (Zero Canvas 2D calls, pure GPU scaling)
        const timeSec = now / 1000;
        let totalRippleAlpha = 0.0;
        let maxRippleRadius = 0.2;

        for (let k = 0; k < ripples.length; k++) {
          const rip = ripples[k];
          const age = timeSec - rip.startTime;
          if (age > 0 && age < rip.duration) {
            const lifeProgress = age / rip.duration;
            const currentR = 0.20 + lifeProgress * 0.95;
            maxRippleRadius = Math.max(maxRippleRadius, currentR);
            const waveDecay = (1.0 - lifeProgress) * Math.sin(lifeProgress * Math.PI) * Math.exp(-lifeProgress * 1.5);
            totalRippleAlpha += Math.abs(waveDecay) * rip.amplitude;
          }
        }

        if (totalRippleAlpha > 0.01) {
          rippleMesh.visible = true;
          rippleMat.opacity = Math.min(0.40, totalRippleAlpha * 0.55);
          rippleMesh.scale.set(maxRippleRadius, 1, maxRippleRadius);
          rippleMesh.rotation.y = timeSec * 0.2;
        } else {
          rippleMesh.visible = false;
          rippleMat.opacity = 0.0;
        }

        // In-place cleanup of expired ripples to eliminate garbage collection
        for (let k = ripples.length - 1; k >= 0; k--) {
          if (timeSec - ripples[k].startTime > ripples[k].duration) {
            ripples.splice(k, 1);
          }
        }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    // Clean resource disposal on unmount or re-render
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      dropGeometry.dispose();
      dropMaterial.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      rippleGeo.dispose();
      rippleMat.dispose();
      rippleTex.dispose();
      renderer.dispose();
      if (mountEl) {
        mountEl.innerHTML = '';
      }
    };
  }, [config, prefersReducedMotion]);

  // Handle color scheme selection
  const handleSelectColor = (scheme: 'arterial' | 'crimson' | 'oxygenated') => {
    setConfig({ ...config, colorScheme: scheme, presetName: 'Custom' });
  };

  // Preset selector
  const handleSelectPreset = (pName: string) => {
    if (PRESETS[pName]) {
      setConfig({ ...PRESETS[pName] });
    }
  };

  const toggleMode = () => {
    setConfig((prev) => ({
      ...prev,
      mode: prev.mode === 'cycle' ? 'floating' : 'cycle',
      presetName: 'Custom'
    }));
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-72 h-80 sm:w-80 sm:h-88 flex items-center justify-center select-none ${className}`}
    >
      {/* Three.js Photorealistic 3D WebGL Canvas */}
      {webGLSupported ? (
        <div
          ref={mountRef}
          onClick={triggerImpact}
          title="Click droplet to simulate liquid impact"
          className="relative z-10 w-full h-full max-w-[340px] max-h-[340px] flex items-center justify-center cursor-pointer pointer-events-auto"
        />
      ) : (
        /* Graceful high-res fallback if WebGL is disabled */
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="/images/hero-droplet.jpg"
            alt="LifeFlow Blood Droplet"
            className="w-72 h-72 object-contain mix-blend-multiply drop-shadow-[0_16px_24px_rgba(240,0,60,0.28)] animate-float-droplet"
          />
        </div>
      )}

      {/* Clinical "Every Drop Counts" Status Badge with Quick Mode Toggle */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-full border border-rose-100 hover:border-rose-300 shadow-md shadow-rose-900/5 z-20 whitespace-nowrap pointer-events-auto">
        <button
          onClick={triggerImpact}
          title="Click to trigger blood drop impact"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-rose-50 text-rose-800 hover:text-[#F0003C] transition-all group cursor-pointer"
        >
          <span className="font-serif italic text-xs font-bold tracking-wide">
            Every Drop Counts
          </span>
          <Activity className="w-3.5 h-3.5 text-[#F0003C] animate-pulse group-hover:scale-110 transition-transform" />
        </button>

        <span className="w-px h-3.5 bg-rose-200" />

        <button
          onClick={toggleMode}
          title={config.mode === 'cycle' ? 'Switch to Calm Floating mode' : 'Switch to Continuous Dripping Flow'}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
            config.mode === 'cycle'
              ? 'bg-[#F0003C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Droplets className="w-3 h-3" />
          <span>{config.mode === 'cycle' ? 'Dripping' : 'Floating'}</span>
        </button>
      </div>

      {/* Fluid Physics Tuning Controls Trigger */}
      <button
        onClick={() => setIsControlsOpen(!isControlsOpen)}
        title="Open 3D Liquid Controls"
        aria-label="Toggle realistic 3D liquid animation controls"
        className="absolute top-2 right-3 flex items-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-xs text-slate-700 hover:text-[#F0003C] px-2.5 py-1.5 rounded-full border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-[11px] font-semibold z-20 cursor-pointer"
      >
        <Sliders className="w-3 h-3 text-[#F0003C]" />
        <span className="hidden sm:inline">3D Liquid Controls</span>
      </button>

      {/* Realistic 3D Liquid Simulation Tuning Panel */}
      {isControlsOpen && (
        <div
          role="dialog"
          aria-label="Photorealistic 3D Liquid Simulation Settings"
          className="absolute -top-4 right-0 max-w-[calc(100vw-32px)] w-80 max-h-[460px] overflow-y-auto bg-white/98 backdrop-blur-md rounded-2xl border border-rose-200 shadow-2xl p-4 z-30 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-50 text-[#F0003C] flex items-center justify-center">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">3D Liquid Physics Tuning</h4>
            </div>
            <button
              onClick={() => setIsControlsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close fluid controls"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Liquid Color Palette Selector */}
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Palette className="w-3 h-3 text-rose-500" /> Liquid Ruby Palette
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(COLOR_SCHEMES) as Array<keyof typeof COLOR_SCHEMES>).map((schemeKey) => (
                <button
                  key={schemeKey}
                  onClick={() => handleSelectColor(schemeKey)}
                  className={`px-2 py-1.5 text-[10px] font-medium rounded-lg border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                    config.colorScheme === schemeKey
                      ? 'bg-rose-50 border-[#F0003C] text-[#F0003C] font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: `#${COLOR_SCHEMES[schemeKey].body.toString(16).padStart(6, '0')}` }}
                  />
                  <span>{COLOR_SCHEMES[schemeKey].name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Presets */}
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Simulation Presets
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.keys(PRESETS).map((pName) => (
                <button
                  key={pName}
                  onClick={() => handleSelectPreset(pName)}
                  className={`px-2 py-1.5 text-[10px] font-medium rounded-lg border transition-all text-center cursor-pointer ${
                    config.presetName === pName
                      ? 'bg-rose-50 border-[#F0003C] text-[#F0003C] font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Motion Mode Selector & Impact Trigger */}
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Motion Mode & Interaction
            </label>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <button
                onClick={() => setConfig({ ...config, mode: 'cycle', presetName: 'Custom' })}
                className={`px-2 py-1.5 text-[10px] font-medium rounded-lg border transition-all text-center cursor-pointer ${
                  config.mode === 'cycle'
                    ? 'bg-rose-50 border-[#F0003C] text-[#F0003C] font-semibold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Continuous Cycle
              </button>
              <button
                onClick={() => setConfig({ ...config, mode: 'floating', presetName: 'Custom' })}
                className={`px-2 py-1.5 text-[10px] font-medium rounded-lg border transition-all text-center cursor-pointer ${
                  config.mode === 'floating'
                    ? 'bg-rose-50 border-[#F0003C] text-[#F0003C] font-semibold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Calm Floating
              </button>
            </div>
            <button
              onClick={triggerImpact}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-[#F0003C] to-[#C80020] hover:from-[#E00036] hover:to-[#B0001C] text-white rounded-lg shadow-xs hover:shadow text-[11px] font-semibold transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Simulate Drop Impact</span>
            </button>
          </div>

          {/* Granular Tuning Sliders */}
          <div className="space-y-2.5 text-xs">
            {/* Speed */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Animation Speed</span>
                <span className="font-mono text-slate-900">{config.speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.speed}
                onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value), presetName: 'Custom' })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#F0003C]"
              />
            </div>

            {/* Gravity */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Gravity Strength</span>
                <span className="font-mono text-slate-900">{config.gravity.toFixed(1)}g</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.1"
                value={config.gravity}
                onChange={(e) => setConfig({ ...config, gravity: parseFloat(e.target.value), presetName: 'Custom' })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#F0003C]"
              />
            </div>

            {/* Deformation Intensity */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Deformation Intensity</span>
                <span className="font-mono text-slate-900">{config.deformationIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.8"
                step="0.1"
                value={config.deformationIntensity}
                onChange={(e) => setConfig({ ...config, deformationIntensity: parseFloat(e.target.value), presetName: 'Custom' })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#F0003C]"
              />
            </div>

            {/* Droplet Scale */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Droplet Size</span>
                <span className="font-mono text-slate-900">{config.dropScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.20"
                step="0.05"
                value={config.dropScale}
                onChange={(e) => setConfig({ ...config, dropScale: parseFloat(e.target.value), presetName: 'Custom' })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#F0003C]"
              />
            </div>

            {/* Splash Intensity */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Splash Intensity</span>
                <span className="font-mono text-slate-900">{config.splashIntensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.8"
                step="0.1"
                value={config.splashIntensity}
                onChange={(e) => setConfig({ ...config, splashIntensity: parseFloat(e.target.value), presetName: 'Custom' })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#F0003C]"
              />
            </div>

            {/* Ripple Strength */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Ripple Strength</span>
                <span className="font-mono text-slate-900">{config.rippleStrength.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.8"
                step="0.1"
                value={config.rippleStrength}
                onChange={(e) => setConfig({ ...config, rippleStrength: parseFloat(e.target.value), presetName: 'Custom' })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#F0003C]"
              />
            </div>

            {/* Lighting Intensity */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Lighting Intensity</span>
                <span className="font-mono text-slate-900">{config.lightIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.1"
                value={config.lightIntensity}
                onChange={(e) => setConfig({ ...config, lightIntensity: parseFloat(e.target.value), presetName: 'Custom' })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#F0003C]"
              />
            </div>

            {/* Clearcoat Gloss */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Surface Gloss</span>
                <span className="font-mono text-slate-900">{config.gloss.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.1"
                value={config.gloss}
                onChange={(e) => setConfig({ ...config, gloss: parseFloat(e.target.value), presetName: 'Custom' })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#F0003C]"
              />
            </div>
          </div>

          {/* Footer Reset */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Three.js WebGL 60 FPS</span>
            <button
              onClick={() => setConfig({ ...DEFAULT_CONFIG })}
              className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
