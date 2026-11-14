import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Download,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Bone,
} from 'lucide-react';
import type { StudioState } from '../types/studio';

interface FireflyViewportProps {
  state: StudioState;
  onRenderDemoMp4: () => Promise<void>;
  renderingDemo: boolean;
}

const TOTAL_FRAMES = 144;
const FPS = 24;

// Pre-allocated scratch helpers outside animation loop (zero GC)
const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _dummy = new THREE.Object3D();

function detectSoftwareGl(): boolean {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

function groundHeightAt(x: number, z: number): number {
  return Math.sin(x * 0.45) * Math.cos(z * 0.4) * 0.14 - 0.06;
}

export function FireflyViewport({ state, onRenderDemoMp4, renderingDemo }: FireflyViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [frame, setFrame] = useState(1);
  const [cameraMode, setCameraMode] = useState<'shot' | 'orbit'>('shot');
  const [showRig, setShowRig] = useState(false);
  const [explodeAmount, setExplodeAmount] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Refs synced into the stable Three.js render loop
  const playingRef = useRef(isPlaying);
  const frameRef = useRef(0);
  const cameraModeRef = useRef(cameraMode);
  const showRigRef = useRef(showRig);
  const explodeRef = useRef(explodeAmount);
  const userOrbitingRef = useRef(false);

  playingRef.current = isPlaying;
  cameraModeRef.current = cameraMode;
  showRigRef.current = showRig;
  explodeRef.current = explodeAmount;

  // Web Audio synthesizer for gentle night pad + wing hum
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && document.activeElement?.tagName !== 'INPUT') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (audioOn) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = 0.08;
        master.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 110;
        osc1.connect(master);
        osc1.start();

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = 164.81;
        const g2 = ctx.createGain();
        g2.gain.value = 0.35;
        osc2.connect(g2);
        g2.connect(master);
        osc2.start();

        audioCtxRef.current = ctx;
        gainNodeRef.current = master;
      } catch {
        setAudioOn(false);
      }
    } else if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      gainNodeRef.current = null;
    }
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [audioOn]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 540;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const handleLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleRestored = () => setContextLost(false);
    renderer.domElement.addEventListener('webglcontextlost', handleLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.FogExp2(0x070a12, 0.085);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(2.8, 1.4, 3.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 1.2;
    controls.maxDistance = 10.5;
    controls.addEventListener('start', () => {
      userOrbitingRef.current = true;
      setCameraMode('orbit');
    });

    // Three-Point + Motivated Bioluminescent Lighting
    const hemiLight = new THREE.HemisphereLight(0x5b7bb2, 0x16221b, 0.75);
    scene.add(hemiLight);

    const moonKey = new THREE.DirectionalLight(0xaec8ff, 1.35);
    moonKey.position.set(4.5, 6.5, -3.5);
    moonKey.castShadow = !isSoftwareGl;
    moonKey.shadow.mapSize.set(1024, 1024);
    moonKey.shadow.camera.left = -4;
    moonKey.shadow.camera.right = 4;
    moonKey.shadow.camera.top = 4;
    moonKey.shadow.camera.bottom = -4;
    moonKey.shadow.bias = -0.0005;
    moonKey.shadow.normalBias = 0.02;
    scene.add(moonKey);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-4.0, 2.5, 3.0);
    scene.add(rimLight);

    // Grounded Moss Terrain
    const terrainGeo = new THREE.PlaneGeometry(24, 24, 48, 48);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      posAttr.setY(i, groundHeightAt(x, z));
    }
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x12221a,
      roughness: 0.92,
      metalness: 0.02,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Grounded Mossy Boulders (3-part variations)
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x262c34, roughness: 0.85, metalness: 0.05 });
    const rockCoords = [
      [-1.5, -0.7, 0.42],
      [1.7, 0.9, 0.35],
      [-0.6, 1.5, 0.28],
    ];
    for (const [rx, rz, rs] of rockCoords) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rs, 1), rockMat);
      rock.scale.set(1.2, 0.65, 1.0);
      rock.position.set(rx, groundHeightAt(rx, rz) + rs * 0.28, rz);
      rock.rotation.set(0.2, rx, 0.1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }

    // 3-Part Glowing Forest Mushrooms
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.65, metalness: 0.0 });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x1e6070,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.08,
    });
    const mushroomSpots = [
      [-1.15, 0.65, 1.0],
      [1.05, -0.75, 0.78],
      [-0.45, -1.2, 0.62],
    ];
    for (const [mx, mz, sc] of mushroomSpots) {
      const mGroup = new THREE.Group();
      const gy = groundHeightAt(mx, mz);
      mGroup.position.set(mx, gy, mz);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * sc, 0.05 * sc, 0.36 * sc, 10), stemMat);
      stem.position.y = 0.18 * sc;
      stem.castShadow = true;
      mGroup.add(stem);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22 * sc, 0.16 * sc, 14), capMat);
      cap.position.y = 0.38 * sc;
      cap.rotation.z = 0.07; // Intentional organic tilt
      cap.castShadow = true;
      mGroup.add(cap);

      const rimGlow = new THREE.Mesh(new THREE.TorusGeometry(0.18 * sc, 0.014 * sc, 8, 18), capMat);
      rimGlow.rotation.x = Math.PI / 2;
      rimGlow.position.y = 0.31 * sc;
      mGroup.add(rimGlow);

      scene.add(mGroup);
    }

    // Instanced Swaying Forest Reeds
    const reedCount = 110;
    const reedGeo = new THREE.ConeGeometry(0.025, 0.9, 5);
    reedGeo.translate(0, 0.45, 0);
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x1e3a2b, roughness: 0.72, metalness: 0.05 });
    const reeds = new THREE.InstancedMesh(reedGeo, reedMat, reedCount);
    const reedTransforms: { x: number; z: number; scale: number; phase: number }[] = [];
    const tint = new THREE.Color();
    for (let i = 0; i < reedCount; i++) {
      const angle = (i / reedCount) * Math.PI * 2 + (i % 7) * 0.31;
      const radius = 1.65 + ((i * 37) % 100) * 0.045;
      const rx = Math.cos(angle) * radius;
      const rz = Math.sin(angle) * radius;
      const scale = 0.75 + ((i * 19) % 10) * 0.065;
      reedTransforms.push({ x: rx, z: rz, scale, phase: i * 0.4 });
      _dummy.position.set(rx, groundHeightAt(rx, rz), rz);
      _dummy.scale.set(scale, scale, scale);
      _dummy.rotation.set(0, angle, 0);
      _dummy.updateMatrix();
      reeds.setMatrixAt(i, _dummy.matrix);
      tint.setHSL(0.38 + ((i % 5) - 2) * 0.015, 0.36, 0.18 + (i % 4) * 0.02);
      reeds.setColorAt(i, tint);
    }
    reeds.instanceMatrix.needsUpdate = true;
    if (reeds.instanceColor) reeds.instanceColor.needsUpdate = true;
    reeds.computeBoundingSphere();
    scene.add(reeds);

    // Instanced Floating Pollen Motes
    const moteCount = 60;
    const moteGeo = new THREE.SphereGeometry(0.016, 6, 6);
    const moteMat = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.65 });
    const motes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
    motes.frustumCulled = false;
    scene.add(motes);

    // ========================================================
    // COMPOSITE MULTI-PART PROCEDURAL FIREFLY CHARACTER ("LUMA")
    // ========================================================
    const fireflyRoot = new THREE.Group();
    scene.add(fireflyRoot);

    const chitinMat = new THREE.MeshStandardMaterial({
      color: 0x1b1d26,
      roughness: 0.34,
      metalness: 0.22,
    });
    const bronzePlateMat = new THREE.MeshStandardMaterial({
      color: 0x453528,
      roughness: 0.42,
      metalness: 0.48,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x0b0e14,
      roughness: 0.12,
      metalness: 0.8,
    });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.2,
      roughness: 0.22,
      metalness: 0.05,
    });
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xcbe7ff,
      roughness: 0.14,
      metalness: 0.05,
      transparent: true,
      opacity: isSoftwareGl ? 0.52 : 0.46,
      transmission: isSoftwareGl ? 0 : 0.65,
      ior: 1.45,
      side: THREE.DoubleSide,
    });

    // 1. Thorax Group (Primary Silhouette)
    const thoraxGroup = new THREE.Group();
    fireflyRoot.add(thoraxGroup);
    const thoraxMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), chitinMat);
    thoraxMesh.scale.set(0.95, 0.85, 1.25);
    thoraxMesh.castShadow = true;
    thoraxGroup.add(thoraxMesh);

    const collarPlate = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 10, 18), bronzePlateMat);
    collarPlate.position.set(0, 0.02, 0.11);
    collarPlate.rotation.x = 0.35;
    thoraxGroup.add(collarPlate);

    // 2. Head + Compound Eyes + Curved Antennae
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.04, 0.2);
    fireflyRoot.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), chitinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), eyeMat);
      eye.position.set(side * 0.068, 0.022, 0.055);
      headGroup.add(eye);

      const antCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.03, 0.055, 0.06),
        new THREE.Vector3(side * 0.08, 0.13, 0.14),
        new THREE.Vector3(side * 0.13, 0.16, 0.24),
      ]);
      const antMesh = new THREE.Mesh(new THREE.TubeGeometry(antCurve, 10, 0.008, 6, false), bronzePlateMat);
      headGroup.add(antMesh);
    }

    // 3. Segmented Lantern Abdomen + Dynamic PointLight
    const abdomenGroup = new THREE.Group();
    abdomenGroup.position.set(0, -0.04, -0.18);
    fireflyRoot.add(abdomenGroup);

    const seg1 = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), bronzePlateMat);
    seg1.scale.set(0.92, 0.85, 1.15);
    abdomenGroup.add(seg1);

    const lanternCore = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 16), lanternMat);
    lanternCore.position.set(0, -0.02, -0.16);
    lanternCore.scale.set(0.95, 0.88, 1.45);
    abdomenGroup.add(lanternCore);

    const lanternTail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), lanternMat);
    lanternTail.position.set(0, -0.035, -0.34);
    abdomenGroup.add(lanternTail);

    const fireflyLight = new THREE.PointLight(0xffa726, 2.8, 5.5, 1.8);
    fireflyLight.position.set(0, -0.02, -0.2);
    abdomenGroup.add(fireflyLight);

    // 4. Custom Extruded Translucent Wings (Left & Right)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.18, 0.14, 0.55, 0.18, 0.68, 0.02);
    wingShape.bezierCurveTo(0.54, -0.12, 0.2, -0.1, 0, 0);
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.006,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
    });

    const wingLeftPivot = new THREE.Group();
    wingLeftPivot.position.set(-0.08, 0.09, 0.02);
    fireflyRoot.add(wingLeftPivot);
    const wingLeftMesh = new THREE.Mesh(wingGeo, wingMat);
    wingLeftMesh.rotation.set(Math.PI / 2, Math.PI, 0.25);
    wingLeftPivot.add(wingLeftMesh);

    const wingRightPivot = new THREE.Group();
    wingRightPivot.position.set(0.08, 0.09, 0.02);
    fireflyRoot.add(wingRightPivot);
    const wingRightMesh = new THREE.Mesh(wingGeo, wingMat);
    wingRightMesh.rotation.set(-Math.PI / 2, 0, -0.25);
    wingRightPivot.add(wingRightMesh);

    // 5. Six Articulated Legs
    const legsGroup = new THREE.Group();
    fireflyRoot.add(legsGroup);
    for (const side of [-1, 1]) {
      for (let li = 0; li < 3; li++) {
        const legCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.07, -0.07, 0.08 - li * 0.07),
          new THREE.Vector3(side * 0.15, -0.15, 0.06 - li * 0.08),
          new THREE.Vector3(side * 0.12, -0.24, 0.02 - li * 0.09),
        ]);
        const legMesh = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 8, 0.009, 5, false), chitinMat);
        legsGroup.add(legMesh);
      }
    }

    // 6. Toggleable Rig Bone Skeleton Overlay
    const rigHelperGroup = new THREE.Group();
    const boneLineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
    const bonePts = [
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.04, 0.2),
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.04, -0.38),
      new THREE.Vector3(0, 0.08, 0.02), new THREE.Vector3(-0.62, 0.18, -0.1),
      new THREE.Vector3(0, 0.08, 0.02), new THREE.Vector3(0.62, 0.18, -0.1),
    ];
    const boneGeo = new THREE.BufferGeometry().setFromPoints(bonePts);
    rigHelperGroup.add(new THREE.LineSegments(boneGeo, boneLineMat));
    fireflyRoot.add(rigHelperGroup);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let lastTime = performance.now();
    let smoothedExplode = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function updateSceneAtFrame(fFloat: number, dt: number) {
      const t = fFloat / (TOTAL_FRAMES - 1);

      // 3-Act Choreography for THE LAST FIREFLY
      const hoverBob = Math.sin(fFloat * 0.35) * 0.06;
      const fx = Math.sin(t * Math.PI * 2.0) * 0.85;
      const fz = -1.1 + t * 2.2;
      const fy = 0.62 + Math.sin(t * Math.PI * 2.6) * 0.22 + hoverBob;

      fireflyRoot.position.set(fx, fy, fz);
      fireflyRoot.rotation.set(0.08 * Math.sin(t * 5.0), Math.atan2(Math.cos(t * Math.PI * 2.0) * 1.4, 1.8), 0.12 * Math.cos(t * 4.0));

      // Wing flutter with protected 4-degree intentional asymmetry
      const flapL = Math.sin(fFloat * 1.95) * 0.62;
      const flapR = Math.sin(fFloat * 1.95 + 0.07) * 0.62;
      wingLeftPivot.rotation.z = flapL;
      wingRightPivot.rotation.z = -flapR;

      // Bioluminescent emotional arc: hesitant flicker -> bright beacon
      const emotionalCurve = 0.35 + 0.65 * Math.pow(t, 1.35);
      const pulse = emotionalCurve * (0.88 + 0.12 * Math.sin(fFloat * 0.45));
      lanternMat.emissiveIntensity = 1.6 + 3.4 * pulse;
      fireflyLight.intensity = 1.4 + 3.2 * pulse;

      // Exploded view exponential damping
      smoothedExplode = THREE.MathUtils.damp(smoothedExplode, explodeRef.current, 6.0, dt);
      headGroup.position.set(0, 0.04 + smoothedExplode * 0.25, 0.2 + smoothedExplode * 0.45);
      abdomenGroup.position.set(0, -0.04 - smoothedExplode * 0.15, -0.18 - smoothedExplode * 0.45);
      wingLeftPivot.position.set(-0.08 - smoothedExplode * 0.42, 0.09 + smoothedExplode * 0.28, 0.02);
      wingRightPivot.position.set(0.08 + smoothedExplode * 0.42, 0.09 + smoothedExplode * 0.28, 0.02);
      legsGroup.position.set(0, -smoothedExplode * 0.35, 0);

      rigHelperGroup.visible = showRigRef.current;

      // Sway reeds gently
      for (let i = 0; i < reedCount; i++) {
        const r = reedTransforms[i];
        _dummy.position.set(r.x, groundHeightAt(r.x, r.z), r.z);
        _dummy.scale.set(r.scale, r.scale, r.scale);
        _dummy.rotation.set(
          Math.sin(fFloat * 0.08 + r.phase) * 0.08,
          r.phase,
          Math.cos(fFloat * 0.07 + r.phase) * 0.06,
        );
        _dummy.updateMatrix();
        reeds.setMatrixAt(i, _dummy.matrix);
      }
      reeds.instanceMatrix.needsUpdate = true;

      // Floating pollen motes
      for (let i = 0; i < moteCount; i++) {
        const ang = i * 1.7 + fFloat * 0.025;
        const rad = 0.5 + (i % 9) * 0.28;
        _dummy.position.set(
          Math.cos(ang) * rad,
          0.35 + ((i * 0.13 + fFloat * 0.008) % 1.4),
          Math.sin(ang) * rad,
        );
        const s = 0.7 + 0.3 * Math.sin(fFloat * 0.15 + i);
        _dummy.scale.set(s, s, s);
        _dummy.updateMatrix();
        motes.setMatrixAt(i, _dummy.matrix);
      }
      motes.instanceMatrix.needsUpdate = true;

      // Camera choreography when in Shot Cam mode
      if (cameraModeRef.current === 'shot' && !userOrbitingRef.current) {
        _camPosTarget.set(2.55 - t * 1.15, 1.35 - Math.sin(t * Math.PI) * 0.22, -2.1 + t * 3.8);
        _camLookTarget.set(fx * 0.75, fy, fz);
        const dampFactor = 1 - Math.exp(-3.5 * dt);
        camera.position.lerp(_camPosTarget, dampFactor);
        controls.target.lerp(_camLookTarget, dampFactor);
      }
      controls.update();
    }

    function tick() {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (playingRef.current) {
        frameRef.current = (frameRef.current + dt * FPS) % TOTAL_FRAMES;
        const discreteFrame = Math.floor(frameRef.current) + 1;
        setFrame(discreteFrame);
      }

      updateSceneAtFrame(frameRef.current, dt);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Expose frame scrubbing cleanly via custom event on mount container
    const handleScrub = (ev: Event) => {
      const custom = ev as CustomEvent<number>;
      frameRef.current = Math.max(0, Math.min(TOTAL_FRAMES - 1, custom.detail - 1));
    };
    container.addEventListener('af-scrub', handleScrub);

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('af-scrub', handleScrub);
      renderer.domElement.removeEventListener('webglcontextlost', handleLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleRestored);
      controls.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      reedGeo.dispose();
      reedMat.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      wingGeo.dispose();
      wingMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleScrubChange = (nextFrame: number) => {
    setIsPlaying(false);
    setFrame(nextFrame);
    mountRef.current?.dispatchEvent(new CustomEvent('af-scrub', { detail: nextFrame }));
  };

  const currentSeconds = ((frame - 1) / FPS).toFixed(2);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#f4f5f7]">
            The Last Firefly · 3D Production Stage
          </h1>
          <p className="text-xs text-[#9aa1b0] tabular-nums">
            6.00s · 24 fps · 144 frames · 960×540 preview · Frame {String(frame).padStart(3, '0')}/{TOTAL_FRAMES} ({currentSeconds}s)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={renderingDemo}
            onClick={onRenderDemoMp4}
            className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-[#0b0d11] transition-colors hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Video className="h-3.5 w-3.5" />
            {renderingDemo ? 'Encoding 144 Frames (FFmpeg)...' : 'Render Playable MP4 (FFmpeg)'}
          </button>
          {state.demo_media.mp4_ready && (
            <button
              type="button"
              onClick={() => setShowVideoModal((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-[#12151c] px-4 py-2 text-xs font-medium text-[#f4f5f7] transition-colors hover:bg-white/10 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {showVideoModal ? 'Hide MP4 Player' : 'Play Encoded MP4'}
            </button>
          )}
          <a
            href="/api/production/blender-script"
            download="the_last_firefly_blender_scene.py"
            className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-[#12151c] px-4 py-2 text-xs font-medium text-[#f4f5f7] transition-colors hover:bg-white/10 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Export bpy Script
          </a>
        </div>
      </div>

      {/* Inline Playable MP4 Theater when requested */}
      {showVideoModal && state.demo_media.mp4_ready && (
        <div className="rounded-lg border border-white/12 bg-[#12151c] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#c2c7d0]">
              <span className="font-semibold text-[#f4f5f7]">Rendered Master Preview</span> · 960×540 H.264 + Stereo AAC Audio ({Math.round(state.demo_media.mp4_size_bytes / 1024)} KB)
            </div>
            <a
              href="/api/production/video"
              download="the_last_firefly_960x540_24fps.mp4"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Download MP4
            </a>
          </div>
          <video
            controls
            autoPlay
            loop
            className="mx-auto aspect-video w-full max-w-[960px] rounded bg-black"
            src={`/api/production/video?v=${state.demo_media.mp4_size_bytes}`}
          />
        </div>
      )}

      {/* Unobstructed 3D WebGL Viewport with Collapsible Bottom Dock */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/12 bg-[#070a12]">
        <div ref={mountRef} className="h-full w-full" />

        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#070a12] text-xs text-amber-400">
            WebGL context paused — restoring viewport...
          </div>
        )}

        {/* Minimal Top-Left Scene Readout (Semantic DOM over Canvas) */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-white/10 bg-[#12151c]/90 px-3 py-1.5 text-xs text-[#c2c7d0]">
          Luma Rig · {cameraMode === 'shot' ? 'Production Shot Cam' : 'Free Orbit Cam'}
        </div>

        {/* Collapsible Bottom Control Dock (Zero Backdrop-Filter over WebGL) */}
        <div className="absolute bottom-4 left-1/2 z-10 w-[min(940px,94%)] -translate-x-1/2">
          <div className="mb-1.5 flex justify-center">
            <button
              type="button"
              onClick={() => setDockCollapsed((c) => !c)}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-[#12151c]/95 px-3 py-1 text-xs font-medium text-[#c2c7d0] hover:text-[#f4f5f7] cursor-pointer"
            >
              {dockCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {dockCollapsed ? 'Show Controls (H)' : 'Hide Controls (H)'}
            </button>
          </div>

          {!dockCollapsed && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/12 bg-[#12151c]/95 px-4 py-3 text-xs text-[#e6e8ed]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded bg-amber-500 px-3 py-1.5 font-semibold text-[#0b0d11] hover:bg-amber-400 cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => handleScrubChange(1)}
                  aria-label="Reset to frame 1"
                  className="rounded border border-white/12 p-1.5 text-[#c2c7d0] hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex min-w-[200px] flex-1 items-center gap-3">
                <span className="font-mono text-[#9aa1b0] tabular-nums">F{String(frame).padStart(3, '0')}</span>
                <input
                  type="range"
                  min={1}
                  max={TOTAL_FRAMES}
                  value={frame}
                  onChange={(e) => handleScrubChange(Number(e.target.value))}
                  aria-label="Timeline frame scrubber"
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-[#9aa1b0] tabular-nums">{TOTAL_FRAMES}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    userOrbitingRef.current = false;
                    setCameraMode((m) => (m === 'shot' ? 'orbit' : 'shot'));
                  }}
                  className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-medium cursor-pointer ${
                    cameraMode === 'shot'
                      ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                      : 'border-white/12 text-[#c2c7d0] hover:bg-white/10'
                  }`}
                >
                  {cameraMode === 'shot' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {cameraMode === 'shot' ? 'Shot Cam' : 'Free Orbit'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRig((r) => !r)}
                  className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-medium cursor-pointer ${
                    showRig
                      ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                      : 'border-white/12 text-[#c2c7d0] hover:bg-white/10'
                  }`}
                >
                  <Bone className="h-3.5 w-3.5" />
                  Rig
                </button>

                <label className="flex items-center gap-1.5 text-[#9aa1b0]">
                  <span>Explode</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={explodeAmount}
                    onChange={(e) => setExplodeAmount(Number(e.target.value))}
                    className="w-16 accent-amber-500 cursor-pointer"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setAudioOn((a) => !a)}
                  aria-label="Toggle procedural Web Audio"
                  className={`rounded border p-1.5 cursor-pointer ${
                    audioOn ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-white/12 text-[#c2c7d0] hover:bg-white/10'
                  }`}
                >
                  {audioOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
