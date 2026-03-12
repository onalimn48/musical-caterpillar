import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";

const SECTION_WIDTH = 40;
const SECTION_COUNT = 6;
const DUST_COUNT = 72;
const SCENE_WORLD_SCALE = 1 / 25;
const MENU_TARGET_FPS = 24;
const GAMEPLAY_TARGET_FPS = 24;
const MENU_TARGET_FRAME_MS = 1000 / MENU_TARGET_FPS;
const GAMEPLAY_TARGET_FRAME_MS = 1000 / GAMEPLAY_TARGET_FPS;
const ACTIVE_GUARD_Z = 0;
const ACTIVE_GUARD_WORLD_OFFSET = -8;

function clampDt(dt) {
  return Math.min(0.05, dt);
}

function getViewHalfWidth(camera) {
  const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
  return Math.tan(halfFov) * camera.position.z * camera.aspect;
}

function getRandomSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] || 1;
  }
  return ((Math.random() * 0xffffffff) >>> 0) || 1;
}

const HeistMuseumBackground = memo(forwardRef(function HeistMuseumBackground({
  worldX = 0,
  worldXSourceRef = null,
  guardObstacles = [],
  onReady,
  theme = null,
  gameplayActive = false,
}, ref) {
  const mountRef = useRef(null);
  const worldXFallbackRef = useRef(worldX);
  const guardObstaclesRef = useRef(guardObstacles);
  const gameplayActiveRef = useRef(gameplayActive);
  const getWorldX = () => worldXSourceRef?.current ?? worldXFallbackRef.current;
  const apiRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    guards: [],
    getGuards: () => [],
    getGuardAssignments: () => new Map(),
    worldX: getWorldX,
  });

  useImperativeHandle(ref, () => apiRef.current, []);

  useEffect(() => {
    worldXFallbackRef.current = worldX;
  }, [worldX]);

  useEffect(() => {
    guardObstaclesRef.current = guardObstacles;
    apiRef.current.markGuardsDirty?.();
  }, [guardObstacles]);

  useEffect(() => {
    gameplayActiveRef.current = gameplayActive;
    apiRef.current.renderer?.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, gameplayActive ? 0.7 : 0.85)
    );
    apiRef.current.renderer?.setSize(mountRef.current?.clientWidth || 1, mountRef.current?.clientHeight || 1, false);
  }, [gameplayActive]);

  const backdrop = theme?.backdrop || "radial-gradient(circle at 50% 18%, #0f1020 0%, #05060f 55%, #010104 100%)";
  const vignette = theme?.vignette || "radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,.1) 62%, rgba(0,0,0,.24) 78%, rgba(0,0,0,.45) 100%)";
  const edgeGlow = theme?.edgeGlow || "inset 24px 0 36px rgba(255,40,80,.035), inset -24px 0 36px rgba(40,120,255,.035)";

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020208);
    scene.fog = new THREE.Fog(0x03040b, 65, 180);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, gameplayActiveRef.current ? 0.7 : 0.85));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.prepend(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
    camera.position.set(0, 2, 14);
    camera.lookAt(0, 2, 0);

    const tmp = new THREE.Object3D();
    const sections = [];
    const guards = [];
    const anim = [];
    const textures = new Set();
    const dustData = [];
    const guardAssignments = new Map();
    let seed = getRandomSeed();
    let rafId = 0;
    let destroyed = false;
    let guardAssignmentsDirty = true;

    const R = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967295);
    const rr = (a, b) => a + (b - a) * R();
    const pick = arr => arr[(R() * arr.length) | 0];
    const trackTexture = t => (textures.add(t), t);

    function texFloor() {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const x = c.getContext("2d");
      x.fillStyle = "#0d0d1e";
      x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 600; i++) {
        x.fillStyle = `rgba(255,255,255,${rr(0.004, 0.02)})`;
        x.fillRect(rr(0, 256), rr(0, 256), rr(1, 3), rr(1, 3));
      }
      x.strokeStyle = "rgba(255,255,255,.035)";
      for (let i = 0; i <= 8; i++) {
        const p = i * 32 + 0.5;
        x.beginPath();
        x.moveTo(p, 0);
        x.lineTo(p, 256);
        x.stroke();
        x.beginPath();
        x.moveTo(0, p);
        x.lineTo(256, p);
        x.stroke();
      }
      const t = trackTexture(new THREE.CanvasTexture(c));
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(16, 16);
      return t;
    }

    function artTex(kind, width = 320, height = 220) {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const x = c.getContext("2d");
      const jewelPalettes = [
        ["#25113a", "#6d1f75", "#1299b8", "#d3b35c"],
        ["#13213c", "#6d1735", "#268d6e", "#f2c14e"],
        ["#1a132f", "#0f5f7b", "#8b1e3f", "#efe1a7"],
      ];
      const modernPalettes = [
        ["#f7f3ec", "#ff3b30", "#1d4ed8", "#facc15", "#111"],
        ["#fff", "#ef4444", "#2563eb", "#10b981", "#0f172a"],
      ];
      const palette = kind === "modern" ? pick(modernPalettes) : pick(jewelPalettes);
      x.fillStyle = palette[0];
      x.fillRect(0, 0, width, height);
      if (kind === "modern") {
        for (let i = 0; i < 7; i++) {
          x.fillStyle = palette[(i + 1) % palette.length];
          if (R() > 0.5) x.fillRect(rr(0, width * 0.7), rr(0, height * 0.7), rr(width * 0.12, width * 0.45), rr(height * 0.12, height * 0.45));
          else {
            x.beginPath();
            x.moveTo(rr(0, width), rr(0, height));
            x.lineTo(rr(0, width), rr(0, height));
            x.lineTo(rr(0, width), rr(0, height));
            x.lineTo(rr(0, width), rr(0, height));
            x.closePath();
            x.fill();
          }
        }
      } else {
        for (let i = 0; i < 18; i++) {
          x.strokeStyle = palette[(i + 1) % palette.length];
          x.globalAlpha = rr(0.25, 0.8);
          x.lineWidth = rr(8, 22);
          x.beginPath();
          x.moveTo(rr(0, width), rr(0, height));
          for (let step = 0; step < 3; step++) {
            x.bezierCurveTo(rr(0, width), rr(0, height), rr(0, width), rr(0, height), rr(0, width), rr(0, height));
          }
          x.stroke();
        }
        x.globalAlpha = 1;
      }
      const g = x.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "rgba(255,255,255,.14)");
      g.addColorStop(1, "rgba(255,255,255,.04)");
      x.fillStyle = g;
      x.fillRect(0, 0, width, height);
      return trackTexture(new THREE.CanvasTexture(c));
    }

    function periodicTex() {
      const c = document.createElement("canvas");
      c.width = 600;
      c.height = 260;
      const x = c.getContext("2d");
      x.fillStyle = "#081219";
      x.fillRect(0, 0, c.width, c.height);
      const cellW = 30;
      const cellH = 28;
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 18; col++) {
          if (R() < 0.18) continue;
          const px = 20 + col * cellW;
          const py = 20 + row * cellH;
          x.fillStyle = `hsla(${180 + col * 3},55%,32%,.78)`;
          x.fillRect(px, py, cellW - 4, cellH - 4);
          x.strokeStyle = "rgba(170,255,255,.28)";
          x.strokeRect(px, py, cellW - 4, cellH - 4);
        }
      }
      return trackTexture(new THREE.CanvasTexture(c));
    }

    function disposeMat(material) {
      if (!material) return;
      if (Array.isArray(material)) {
        material.forEach(disposeMat);
        return;
      }
      ["map", "emissiveMap"].forEach(key => {
        if (material[key]) material[key].dispose();
      });
      material.dispose();
    }

    function wallShell(group, x, wall, ceil, height) {
      const material = new THREE.MeshStandardMaterial({ color: wall, roughness: 0.86, metalness: 0.05 });
      [
        ["PlaneGeometry", [SECTION_WIDTH, height], 0, [x + SECTION_WIDTH / 2, height / 2, -6.4]],
        ["PlaneGeometry", [12.8, height], Math.PI / 2, [x, height / 2, 0]],
        ["PlaneGeometry", [12.8, height], Math.PI / 2, [x + SECTION_WIDTH, height / 2, 0]],
      ].forEach(([geometryName, args, rotY, pos]) => {
        const mesh = new THREE.Mesh(new THREE[geometryName](...args), material);
        mesh.rotation.y = rotY;
        mesh.position.set(...pos);
        group.add(mesh);
      });
      const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(SECTION_WIDTH, 12.8),
        new THREE.MeshStandardMaterial({ color: ceil, roughness: 0.92, metalness: 0.03 })
      );
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(x + SECTION_WIDTH / 2, height, 0);
      group.add(ceiling);
    }

    function glow(group, x, z, color, width = 4, depth = 2, opacity = 0.1) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.012, z);
      group.add(mesh);
    }

    function frameArt(group, x, y, z, width, height, frameColor, kind, lightColor) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.24),
        new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.34, metalness: 0.76 })
      );
      frame.position.set(x, y, z);
      group.add(frame);
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.82, height * 0.78),
        new THREE.MeshStandardMaterial({
          map: artTex(kind),
          roughness: 0.7,
          metalness: 0.04,
          emissive: kind === "modern" ? 0x121212 : 0x22160a,
          emissiveIntensity: kind === "modern" ? 0.1 : 0.16,
        })
      );
      art.position.set(x, y, z + 0.14);
      group.add(art);
      if (lightColor) glow(group, x, z + 2.1, lightColor, 3.2, 1.2, 0.035);
    }

    function artifact(kind) {
      const group = new THREE.Group();
      if (kind === "mask") {
        const mat = new THREE.MeshStandardMaterial({ color: 0xd7a62e, emissive: 0xc78a14, emissiveIntensity: 0.2, roughness: 0.35, metalness: 0.8 });
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), mat);
        sphere.scale.set(0.8, 1.1, 0.45);
        group.add(sphere);
      } else if (kind === "idol") {
        const mat = new THREE.MeshStandardMaterial({ color: 0x37a87a, emissive: 0x1b7e5d, emissiveIntensity: 0.18, roughness: 0.52, metalness: 0.16 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.85, 7), mat);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), mat);
        head.position.y = 0.56;
        group.add(body, head);
      } else if (kind === "crown") {
        const mat = new THREE.MeshStandardMaterial({ color: 0xb7962f, emissive: 0x7f291f, emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.85 });
        const torus = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.12, 8, 16), mat);
        torus.rotation.x = Math.PI / 2;
        group.add(torus);
      } else if (kind === "vase") {
        const mat = new THREE.MeshStandardMaterial({ color: 0x6db7d8, emissive: 0x17394a, emissiveIntensity: 0.08, roughness: 0.32, metalness: 0.22 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.4, 0.9, 12), mat);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.28, 10), mat);
        neck.position.y = 0.58;
        group.add(body, neck);
      } else if (kind === "relic") {
        const mat = new THREE.MeshStandardMaterial({ color: 0xb39a73, emissive: 0x3a2412, emissiveIntensity: 0.08, roughness: 0.9, metalness: 0.04 });
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.52, 8), mat);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.12), mat);
        shaft.position.y = 0.26;
        bar.position.y = 0.42;
        group.add(shaft, bar);
      } else {
        group.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(0.42, 16, 16),
            new THREE.MeshStandardMaterial({
              color: 0xb6f7ff,
              emissive: 0x6fd9ff,
              emissiveIntensity: 0.45,
              transparent: true,
              opacity: 0.72,
              roughness: 0.03,
              metalness: 0.08,
            })
          )
        );
      }
      return group;
    }

    function gem(type, color) {
      const geometry = type === "emerald"
        ? new THREE.OctahedronGeometry(0.52, 0)
        : type === "sapphire"
          ? new THREE.IcosahedronGeometry(0.48, 0)
          : type === "ruby"
            ? new THREE.TetrahedronGeometry(0.6, 0)
            : new THREE.OctahedronGeometry(0.42, 1);
      return new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.88,
          roughness: 0.12,
          metalness: 0.2,
        })
      );
    }

    function buildGuard(section) {
      const root = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b3136, roughness: 0.9, metalness: 0.08 });
      const parts = [
        [0.42, 0.42, 0.42, 0, 1.78, 0],
        [0.68, 0.9, 0.42, 0, 1.15, 0],
        [0.56, 0.34, 0.32, 0, 0.63, 0],
        [0.22, 0.72, 0.22, -0.16, 0.28, 0],
        [0.22, 0.72, 0.22, 0.16, 0.28, 0],
        [0.18, 0.68, 0.18, -0.46, 1.18, 0],
        [0.18, 0.68, 0.18, 0.42, 1.18, 0],
        [0.5, 0.12, 0.5, 0, 2.02, 0],
        [0.88, 0.14, 0.46, 0, 1.52, 0],
      ];
      parts.forEach((part, index) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(part[0], part[1], part[2]), bodyMat);
        mesh.position.set(part[3], part[4], part[5]);
        if (index === 6) mesh.rotation.z = -0.45;
        root.add(mesh);
      });
      const torch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10),
        new THREE.MeshStandardMaterial({ color: 0x6e7479, roughness: 0.4, metalness: 0.8 })
      );
      torch.rotation.z = Math.PI / 2;
      torch.position.set(0.63, 0.98, 0);
      root.add(torch);
      const lightRig = new THREE.Group();
      lightRig.position.set(0.74, 0.98, 0);
      root.add(lightRig);
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.15, 4.3, 18, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xf5e642,
          transparent: true,
          opacity: 0.07,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
      );
      cone.rotation.z = Math.PI / 2;
      cone.position.x = 2.15;
      lightRig.add(cone);
      root.position.set(section.x + rr(7, 33), 0, rr(-1.7, 1.2));
      root.rotation.y = rr(-0.16, 0.16);
      root.visible = false;
      section.g.add(root);

      const guard = {
        id: `${section.x}-${guards.length}`,
        mesh: root,
        worldX: root.position.x / SCENE_WORLD_SCALE,
        flashlightAngle: 0,
        p: rr(0, Math.PI * 2),
        owner: section,
        homeWorldX: root.position.x / SCENE_WORLD_SCALE,
        homeZ: root.position.z,
        baseRotationY: root.rotation.y,
        assignedObstacleId: null,
        lightRig,
        update(dt) {
          this.p += dt * (Math.PI * 2 / 1.5);
          this.flashlightAngle = Math.sin(this.p) * 0.5;
          this.lightRig.rotation.y = this.flashlightAngle;
          this.worldX = this.mesh.position.x / SCENE_WORLD_SCALE;
        },
      };
      guards.push(guard);
      return guard;
    }

    function makeSection(type, x) {
      const section = { type, x, g: new THREE.Group() };
      scene.add(section.g);
      if (type === 0) {
        wallShell(section.g, x, 0x06060e, 0x0b0c17, 8.8);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 8.05, -6.15), new THREE.Vector3(x + SECTION_WIDTH, 8.05, -6.15)]),
          new THREE.LineBasicMaterial({ color: 0x8f6d20, transparent: true, opacity: 0.7 })
        );
        section.g.add(line);
        for (let i = 0; i < 7; i++) {
          const rib = new THREE.Mesh(
            new THREE.TorusGeometry(6.8 - i * 0.15, 0.05, 6, 28, Math.PI),
            new THREE.MeshBasicMaterial({ color: 0x2b3048, transparent: true, opacity: 0.36 })
          );
          rib.rotation.z = Math.PI;
          rib.position.set(x + SECTION_WIDTH / 2, 8.65, 0.8 - i * 0.18);
          section.g.add(rib);
        }
        const frames = new THREE.InstancedMesh(
          new THREE.BoxGeometry(1, 1, 0.35),
          new THREE.MeshStandardMaterial({ color: 0xaa8430, roughness: 0.28, metalness: 0.8 }),
          3
        );
        [x + 8, x + 20, x + 32].forEach((fx, i) => {
          tmp.position.set(fx, 4.6, -6.08);
          tmp.scale.set(5.2, 3.7, 0.42);
          tmp.updateMatrix();
          frames.setMatrixAt(i, tmp.matrix);
          const art = new THREE.Mesh(
            new THREE.PlaneGeometry(4.35, 2.95),
            new THREE.MeshStandardMaterial({ map: artTex("jewel"), roughness: 0.64, metalness: 0.05, emissive: 0x221a08, emissiveIntensity: 0.08 })
          );
          art.position.set(fx, 4.6, -5.87);
          section.g.add(art);
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry(3.5, 6.5, 24, 1, true),
            new THREE.MeshBasicMaterial({
              color: 0xfff4a8,
              transparent: true,
              opacity: 0.07,
              depthWrite: false,
              side: THREE.DoubleSide,
              blending: THREE.AdditiveBlending,
            })
          );
          cone.position.set(fx, 7.7, -3.7);
          cone.rotation.x = Math.PI;
          section.g.add(cone);
          glow(section.g, fx, -3.7, 0xfff4a8, 4.8, 2.8, 0.05);
        });
        frames.instanceMatrix.needsUpdate = true;
        frames.computeBoundingBox();
        frames.computeBoundingSphere();
        section.g.add(frames);
      } else if (type === 1) {
        wallShell(section.g, x, 0x1a0f04, 0x23180d, 6.4);
        for (let i = 0; i < 10; i++) {
          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(rr(2.2, 4.6), rr(1.2, 2.6)),
            new THREE.MeshBasicMaterial({ color: pick([0x1e180f, 0x18140d, 0x15130d]), transparent: true, opacity: 0.18 })
          );
          tile.rotation.x = -Math.PI / 2;
          tile.rotation.z = rr(-0.2, 0.2);
          tile.position.set(x + rr(2, 38), 0.011, rr(-5.6, 4.6));
          section.g.add(tile);
        }
        const pedestals = new THREE.InstancedMesh(
          new THREE.BoxGeometry(1.6, 1, 1.6),
          new THREE.MeshStandardMaterial({ color: 0x8a8577, roughness: 0.96, metalness: 0.02 }),
          4
        );
        [
          { x: x + 6, h: 1.1, k: "mask", c: 0xe4bc52 },
          { x: x + 15, h: 1.5, k: "idol", c: 0x46d89e },
          { x: x + 25, h: 1.25, k: "crown", c: 0xde415b },
          { x: x + 34, h: 0.95, k: "orb", c: 0x8fefff },
        ].forEach((slot, i) => {
          const z = -2.2 + (i % 2 === 0 ? -0.5 : 0.45);
          tmp.position.set(slot.x, slot.h / 2, z);
          tmp.scale.set(1, slot.h, 1);
          tmp.updateMatrix();
          pedestals.setMatrixAt(i, tmp.matrix);
          const art = artifact(slot.k);
          art.position.set(slot.x, slot.h + 0.62, z);
          section.g.add(art);
          glow(section.g, slot.x, z, slot.c, 2.5, 1.6, 0.07);
        });
        pedestals.instanceMatrix.needsUpdate = true;
        pedestals.computeBoundingBox();
        pedestals.computeBoundingSphere();
        section.g.add(pedestals);
        frameArt(section.g, x + 10.4, 4.55, -6.06, 4.4, 3, 0x8a6a2f, "jewel", 0xffc16c);
        frameArt(section.g, x + 29.6, 4.55, -6.06, 4.4, 3, 0x8a6a2f, "jewel", 0xffc16c);
      } else if (type === 2) {
        wallShell(section.g, x, 0x020208, 0x05050c, 7.1);
        const laserMat = new THREE.LineBasicMaterial({ color: 0xff1a32, transparent: true, opacity: 0.65 });
        for (let i = 0; i < 7; i++) {
          section.g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x + 5, 1.1 + i * 0.72, -6), new THREE.Vector3(x + 35, 1.1 + i * 0.72, -6)]), laserMat));
        }
        for (let i = 0; i < 8; i++) {
          section.g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x + 5 + i * 4.28, 0.9, -6), new THREE.Vector3(x + 5 + i * 4.28, 5.7, -6)]), laserMat));
        }
        [
          { gx: x + 6.5, c: 0x18c36b, t: "emerald", e: "vase", s: 0.9 },
          { gx: x + 15.5, c: 0x2f63ff, t: "sapphire", e: "mask", s: 0.92 },
          { gx: x + 24.5, c: 0xff3058, t: "ruby", e: "crown", s: 0.95 },
          { gx: x + 33.5, c: 0xe9f6ff, t: "diamond", e: "relic", s: 0.9 },
        ].forEach((slot, i) => {
          const z = -1.2 + (i % 2 ? 0.18 : -0.12);
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(2.15, 3.2, 2.15),
            new THREE.MeshStandardMaterial({ color: 0x9ec6ff, transparent: true, opacity: 0.18, roughness: 0.08, metalness: 0.1 })
          );
          glass.position.set(slot.gx, 1.9, z);
          section.g.add(glass);
          const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.92, 1, 10),
            new THREE.MeshStandardMaterial({ color: 0x242833, roughness: 0.78, metalness: 0.28 })
          );
          pedestal.position.set(slot.gx, 0.5, z);
          section.g.add(pedestal);
          const beam = new THREE.Mesh(
            new THREE.ConeGeometry(1.6, 4.6, 20, 1, true),
            new THREE.MeshBasicMaterial({
              color: 0xdde9ff,
              transparent: true,
              opacity: 0.065,
              side: THREE.DoubleSide,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            })
          );
          beam.position.set(slot.gx, 5.9, z);
          beam.rotation.x = Math.PI;
          section.g.add(beam);
          const exhibit = artifact(slot.e);
          exhibit.position.set(slot.gx, 1.55, z);
          exhibit.scale.setScalar(slot.s);
          section.g.add(exhibit);
          const gemMesh = gem(slot.t, slot.c);
          gemMesh.position.set(slot.gx, 2.42, z + 0.18);
          gemMesh.scale.setScalar(slot.t === "diamond" ? 0.52 : 0.46);
          section.g.add(gemMesh);
          glow(section.g, slot.gx, z, slot.c, 2.1, 1.2, 0.1);
          anim.push({ owner: section, update() { gemMesh.rotation.x += 0.008 + i * 0.0015; gemMesh.rotation.y += 0.011 + i * 0.001; } });
        });
        frameArt(section.g, x + 20, 5.15, -6.05, 6.8, 2.2, 0x3f465e, "jewel", 0x9fbaff);
      } else if (type === 3) {
        wallShell(section.g, x, 0xf8f8f4, 0xf1f1ed, 7.2);
        [x + 8, x + 20, x + 32].forEach(ax => frameArt(section.g, ax, 4.2, -6.02, 7, 4.8, 0xfafaf5, "modern", 0xffffff));
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.15, 20, 20), new THREE.MeshStandardMaterial({ color: 0xdadfe8, roughness: 0.07, metalness: 1 }));
        sphere.position.set(x + 9, 1.18, -1.1);
        section.g.add(sphere);
        const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.7, 0.18, 80, 14, 2, 3), new THREE.MeshStandardMaterial({ color: 0xe33a30, roughness: 0.32, metalness: 0.52 }));
        knot.position.set(x + 20, 1.7, -1.4);
        knot.rotation.x = 0.35;
        section.g.add(knot);
        const monolith = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.4, 1.6), new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.18, metalness: 0.7 }));
        monolith.position.set(x + 31.5, 2.2, -1.2);
        section.g.add(monolith);
        glow(section.g, x + 9, -1.1, 0xffffff, 2.8, 1.7, 0.05);
        glow(section.g, x + 20, -1.4, 0xff3b30, 2.6, 1.6, 0.05);
        anim.push({ owner: section, update() { knot.rotation.y += 0.01; sphere.rotation.y += 0.003; } });
      } else {
        wallShell(section.g, x, 0x091118, 0x0b1513, 7);
        for (let i = 0; i < 5; i++) {
          const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(6.5, 2.2),
            new THREE.MeshBasicMaterial({ color: 0x0a1a0a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
          );
          plane.rotation.x = -Math.PI / 2;
          plane.position.set(x + 4 + i * 8, 0.014, -1.8 + (i % 2) * 0.35);
          section.g.add(plane);
          glow(section.g, x + 4 + i * 8, -1.8 + (i % 2) * 0.35, 0x65ff8e, 4.7, 1.5, 0.07);
        }
        for (let i = 0; i < 4; i++) {
          const cx = x + 6 + i * 9;
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 2.8, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x78eaff, transparent: true, opacity: 0.2, roughness: 0.12, metalness: 0.1, emissive: 0x17364a, emissiveIntensity: 0.16 })
          );
          box.position.set(cx, 1.85, -4.2);
          section.g.add(box);
          const stand = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.6, 1.8), new THREE.MeshStandardMaterial({ color: 0x223240, roughness: 0.84, metalness: 0.25 }));
          stand.position.set(cx, 0.3, -4.2);
          section.g.add(stand);
        }
        const periodic = new THREE.Mesh(
          new THREE.PlaneGeometry(12, 4.2),
          new THREE.MeshStandardMaterial({ map: periodicTex(), emissive: 0x2ce6c2, emissiveIntensity: 0.45, roughness: 0.65, metalness: 0.04 })
        );
        periodic.position.set(x + 30, 4.2, -6.05);
        section.g.add(periodic);
        frameArt(section.g, x + 10, 4.25, -6.04, 5, 3.2, 0x2b4f44, "jewel", 0x4cf6c2);
        frameArt(section.g, x + 20, 4.25, -6.04, 5, 3.2, 0x2b4f44, "modern", 0x4bb7ff);
      }
      if (R() < 0.42) buildGuard(section);
      return section;
    }

    function disposeSection(section) {
      for (let i = guards.length - 1; i >= 0; i--) {
        if (guards[i].owner === section) guards.splice(i, 1);
      }
      for (let i = anim.length - 1; i >= 0; i--) {
        if (anim[i].owner === section) anim.splice(i, 1);
      }
      section.g.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) disposeMat(object.material);
      });
      scene.remove(section.g);
    }

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 40),
      new THREE.MeshStandardMaterial({ color: 0x0d0d1e, map: texFloor(), roughness: 0.18, metalness: 0.72, envMapIntensity: 0.3 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(60, 0, 0);
    scene.add(floor);

    const reflection = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending })
    );
    reflection.rotation.x = -Math.PI / 2;
    reflection.position.set(60, 0.005, -1.2);
    scene.add(reflection);

    scene.add(new THREE.AmbientLight(0x4a3d33, 0.22));
    scene.add(new THREE.HemisphereLight(0x8a98c2, 0x18121a, 0.44));
    const directional = new THREE.DirectionalLight(0xe3ebff, 0.56);
    directional.position.set(18, 16, 10);
    scene.add(directional);

    const dustGeometry = new THREE.SphereGeometry(0.012, 6, 6);
    const dustMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false });
    const dust = new THREE.InstancedMesh(dustGeometry, dustMaterial, DUST_COUNT);
    dust.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(dust);
    for (let i = 0; i < DUST_COUNT; i++) {
      const particle = { x: rr(-30, 90), y: rr(0, 8), z: rr(-6, 5), dx: rr(-0.002, 0.002), dy: rr(0.0014, 0.0028) };
      dustData.push(particle);
      tmp.position.set(particle.x, particle.y, particle.z);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      dust.setMatrixAt(i, tmp.matrix);
    }
    dust.instanceMatrix.needsUpdate = true;

    const baseTypes = [0, 1, 2, 3, 4];
    function shuffled(types) {
      const copy = types.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = (R() * (i + 1)) | 0;
        const t = copy[i];
        copy[i] = copy[j];
        copy[j] = t;
      }
      return copy;
    }
    const initialTypes = [...shuffled([0, 3, 1]), ...shuffled([0, 3, 1])].slice(0, SECTION_COUNT);
    let bag = baseTypes.slice();
    let bagIndex = 0;

    function refillBag() {
      bag = baseTypes.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = (R() * (i + 1)) | 0;
        const t = bag[i];
        bag[i] = bag[j];
        bag[j] = t;
      }
      if (sections.length && bag[0] === sections[sections.length - 1].type) {
        const t = bag[0];
        bag[0] = bag[1];
        bag[1] = t;
      }
      bagIndex = 0;
    }

    function nextType() {
      if (bagIndex >= bag.length) refillBag();
      return bag[bagIndex++];
    }

    for (let i = 0; i < SECTION_COUNT; i++) {
      sections.push(makeSection(initialTypes[i] ?? nextType(), (i - 1) * SECTION_WIDTH));
    }

    function updateDust(cameraX) {
      for (let i = 0; i < DUST_COUNT; i++) {
        const particle = dustData[i];
        particle.y += particle.dy;
        particle.x += particle.dx;
        if (particle.y > 8) {
          particle.y = 0;
          particle.x = cameraX + rr(-18, 34);
          particle.z = rr(-6, 5);
        }
        if (particle.x < cameraX - 40) particle.x = cameraX + 36;
        tmp.position.set(particle.x, particle.y, particle.z);
        tmp.updateMatrix();
        dust.setMatrixAt(i, tmp.matrix);
      }
      dust.instanceMatrix.needsUpdate = true;
    }

    function recycle() {
      while (sections.length && camera.position.x - sections[0].x > SECTION_WIDTH * 1.5) {
        disposeSection(sections.shift());
        sections.push(makeSection(nextType(), sections[sections.length - 1].x + SECTION_WIDTH));
      }
    }

    function syncGuardMappings() {
      const active = (guardObstaclesRef.current || []).filter(obs => !obs.hit);
      const activeIds = new Set(active.map(obs => obs.id));
      const guardsById = new Map(guards.map(guard => [guard.id, guard]));

      for (const [obstacleId, guardId] of [...guardAssignments.entries()]) {
        if (!activeIds.has(obstacleId) || !guardsById.has(guardId)) guardAssignments.delete(obstacleId);
      }

      const usedGuards = new Set();
      for (const obstacle of active) {
        const existingId = guardAssignments.get(obstacle.id);
        if (existingId && guardsById.has(existingId)) usedGuards.add(existingId);
      }

      const unassigned = active.filter(obstacle => !guardAssignments.has(obstacle.id));
      for (const obstacle of unassigned) {
        let best = null;
        let bestDist = Infinity;
        for (const guard of guards) {
          if (usedGuards.has(guard.id)) continue;
          const dist = Math.abs(guard.homeWorldX - obstacle.x);
          if (dist < bestDist) {
            best = guard;
            bestDist = dist;
          }
        }
        if (best) {
          guardAssignments.set(obstacle.id, best.id);
          usedGuards.add(best.id);
        }
      }

      for (const guard of guards) {
        guard.assignedObstacleId = null;
        guard.mesh.visible = false;
        guard.mesh.position.z = guard.homeZ;
        guard.mesh.rotation.y = guard.baseRotationY;
      }

      for (const obstacle of active) {
        const guardId = guardAssignments.get(obstacle.id);
        const guard = guardsById.get(guardId);
        if (!guard) continue;
        guard.assignedObstacleId = obstacle.id;
        guard.mesh.visible = true;
        guard.mesh.position.x = (obstacle.x + ACTIVE_GUARD_WORLD_OFFSET) * SCENE_WORLD_SCALE;
        guard.mesh.position.z = ACTIVE_GUARD_Z;
        guard.worldX = obstacle.x + ACTIVE_GUARD_WORLD_OFFSET;
      }
      guardAssignmentsDirty = false;
    }

    function resize() {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    let lastRenderAt = 0;
    let shimmer = 0;
    let dustFrame = 0;
    function renderLoop(ts = performance.now()) {
      if (destroyed) return;
      rafId = requestAnimationFrame(renderLoop);
      if (document.hidden) return;
      const targetFrameMs = gameplayActiveRef.current ? GAMEPLAY_TARGET_FRAME_MS : MENU_TARGET_FRAME_MS;
      if (lastRenderAt && ts - lastRenderAt < targetFrameMs) return;
      const dt = clampDt(lastRenderAt ? (ts - lastRenderAt) / 1000 : 1 / 60);
      lastRenderAt = ts;
      camera.position.x = getWorldX() * SCENE_WORLD_SCALE + getViewHalfWidth(camera);
      camera.lookAt(camera.position.x, 2, 0);
      floor.position.x = camera.position.x + 60;
      reflection.position.x = floor.position.x;
      if (!gameplayActiveRef.current || dustFrame % 3 === 0) {
        updateDust(camera.position.x);
      }
      dustFrame += 1;
      recycle();
      if (!gameplayActiveRef.current) {
        shimmer += 0.008;
        reflection.material.opacity = 0.038 + Math.sin(shimmer) * 0.01;
      } else {
        reflection.material.opacity = 0.032;
      }
      anim.forEach(entry => entry.update(dt));
      guards.forEach(guard => guard.update(dt));
      if (guardAssignmentsDirty) syncGuardMappings();
      renderer.render(scene, camera);
    }

    resize();
    window.addEventListener("resize", resize);

    apiRef.current.scene = scene;
    apiRef.current.camera = camera;
    apiRef.current.renderer = renderer;
    apiRef.current.guards = guards;
    apiRef.current.getGuards = () => guards;
    apiRef.current.getGuardAssignments = () => new Map(guardAssignments);
    apiRef.current.markGuardsDirty = () => {
      guardAssignmentsDirty = true;
    };
    apiRef.current.worldX = getWorldX;
    window.heistBg = apiRef.current;
    if (onReady) onReady(apiRef.current);

    renderLoop();

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      while (sections.length) disposeSection(sections.pop());
      dust.geometry.dispose();
      disposeMat(dust.material);
      floor.geometry.dispose();
      disposeMat(floor.material);
      reflection.geometry.dispose();
      disposeMat(reflection.material);
      textures.forEach(texture => texture.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      if (window.heistBg === apiRef.current) delete window.heistBg;
      apiRef.current.guards = [];
      apiRef.current.getGuards = () => [];
      apiRef.current.getGuardAssignments = () => new Map();
      apiRef.current.markGuardsDirty = null;
      apiRef.current.scene = null;
      apiRef.current.camera = null;
      apiRef.current.renderer = null;
    };
  }, [onReady]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: backdrop,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: vignette,
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow: edgeGlow,
        }}
      />
    </div>
  );
}));

export default HeistMuseumBackground;
