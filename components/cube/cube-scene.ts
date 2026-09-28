import {
  BufferAttribute,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FACE_ORDER, getFace } from "@/lib/cube/cube-state";
import type { OuterFace } from "@/lib/cube/notation";

/*
 * A stickerless speedcube drawn with three.js: 26 rounded pieces whose outer
 * sides are coloured plastic and whose inner sides are the dark core. It
 * renders only when the scramble or the angle changes.
 */

type Vec3 = [number, number, number];

/**
 * Where facelet (row, col) of each face sits, as piece coordinates in three.js
 * axes (x right, y up, z toward the viewer). Rows and columns read the face
 * as you look straight at it, matching the engine's URFDLB layout.
 */
const FACELET_POSITION: Record<OuterFace, (row: number, col: number) => Vec3> = {
  U: (r, c) => [c - 1, 1, r - 1],
  D: (r, c) => [c - 1, -1, 1 - r],
  F: (r, c) => [c - 1, 1 - r, 1],
  B: (r, c) => [1 - c, 1 - r, -1],
  R: (r, c) => [1, 1 - r, 1 - c],
  L: (r, c) => [-1, 1 - r, c - 1],
};

/** The outward face for an axis (0 x, 1 y, 2 z) and direction. */
const FACE_BY_NORMAL: Record<string, OuterFace> = {
  "0:1": "R",
  "0:-1": "L",
  "1:1": "U",
  "1:-1": "D",
  "2:1": "F",
  "2:-1": "B",
};

const PIECE_SPACING = 1.008;
const PIECE_RADIUS = 0.1;
const DEFAULT_ROTATION = { x: (28 * Math.PI) / 180, y: (-38 * Math.PI) / 180 };
const CORE_COLOR = "#26272c";

export type CubePalette = Record<OuterFace, string>;

export interface CubeScene {
  setFacelets(facelets: string): void;
  rotateBy(dx: number, dy: number): void;
  resetView(): void;
  dispose(): void;
}

/** Reads the sticker colours from the theme tokens (see app/globals.css). */
export function readPalette(element: Element): CubePalette {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    U: read("--cube-u", "#ffffff"),
    D: read("--cube-d", "#ffe100"),
    F: read("--cube-f", "#14c83f"),
    B: read("--cube-b", "#1466ff"),
    R: read("--cube-r", "#f0162f"),
    L: read("--cube-l", "#ff7f00"),
  };
}

/** Returns null when WebGL isn't available, so the caller can fall back. */
export function createCubeScene(canvas: HTMLCanvasElement, palette: CubePalette): CubeScene | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(3, Math.max(2, window.devicePixelRatio || 1)));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.7;

  // Key light from above, a little left and in front, plus a soft fill from the right.
  // Both stay put while the cube turns.
  const key = new DirectionalLight(0xffffff, 0.4);
  key.position.set(-2.5, 6, 5);
  const fill = new DirectionalLight(0xffffff, 0.6);
  fill.position.set(4, 0.5, 7);
  scene.add(key, fill);

  // A long lens, like a product photo, so the cube isn't distorted.
  const camera = new PerspectiveCamera(20, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 14.7);

  const material = new MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.35,
  });
  const baseGeometry = new RoundedBoxGeometry(1, 1, 1, 5, PIECE_RADIUS);
  const normals = baseGeometry.getAttribute("normal");

  const cube = new Group();
  cube.rotation.set(DEFAULT_ROTATION.x, DEFAULT_ROTATION.y, 0);
  scene.add(cube);

  /** Every piece, with the outer face (or null for the core) behind each vertex. */
  const pieces: { position: Vec3; geometry: RoundedBoxGeometry; faces: (OuterFace | null)[] }[] =
    [];
  for (const x of [-1, 0, 1])
    for (const y of [-1, 0, 1])
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const position: Vec3 = [x, y, z];
        const geometry = baseGeometry.clone() as RoundedBoxGeometry;
        const faces: (OuterFace | null)[] = [];
        for (let i = 0; i < normals.count; i++) {
          const n: Vec3 = [normals.getX(i), normals.getY(i), normals.getZ(i)];
          const axis = n.reduce(
            (best, value, index) => (Math.abs(value) > Math.abs(n[best]) ? index : best),
            0,
          );
          const sign = n[axis] > 0 ? 1 : -1;
          faces.push(position[axis] === sign ? FACE_BY_NORMAL[`${axis}:${sign}`] : null);
        }
        geometry.setAttribute("color", new BufferAttribute(new Float32Array(normals.count * 3), 3));
        const mesh = new Mesh(geometry, material);
        mesh.position.set(x * PIECE_SPACING, y * PIECE_SPACING, z * PIECE_SPACING);
        cube.add(mesh);
        pieces.push({ position, geometry, faces });
      }

  const colors = Object.fromEntries(
    FACE_ORDER.map((face) => [face, new Color(palette[face])]),
  ) as Record<OuterFace, Color>;
  const core = new Color(CORE_COLOR);

  let frame = 0;
  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      renderer.render(scene, camera);
    });
  };

  return {
    setFacelets(facelets) {
      const stickers = new Map<string, OuterFace>();
      for (const face of FACE_ORDER) {
        Array.from(getFace(facelets, face)).forEach((color, index) => {
          const position = FACELET_POSITION[face](Math.floor(index / 3), index % 3);
          stickers.set(`${position.join(",")}:${face}`, color as OuterFace);
        });
      }
      for (const piece of pieces) {
        const attribute = piece.geometry.getAttribute("color") as BufferAttribute;
        piece.faces.forEach((face, index) => {
          const sticker = face && stickers.get(`${piece.position.join(",")}:${face}`);
          const color = sticker ? colors[sticker] : core;
          attribute.setXYZ(index, color.r, color.g, color.b);
        });
        attribute.needsUpdate = true;
      }
      requestRender();
    },
    rotateBy(dx, dy) {
      cube.rotation.x = Math.max(-1.55, Math.min(1.55, cube.rotation.x + dy * 0.01));
      cube.rotation.y += dx * 0.01;
      requestRender();
    },
    resetView() {
      cube.rotation.set(DEFAULT_ROTATION.x, DEFAULT_ROTATION.y, 0);
      requestRender();
    },
    dispose() {
      cancelAnimationFrame(frame);
      for (const piece of pieces) piece.geometry.dispose();
      baseGeometry.dispose();
      material.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
