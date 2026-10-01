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
import { CUBE_VIEWS, STICKER_HEX, stickerVariable, type CubeViewName } from "@/lib/config/cube";
import { FACE_ORDER, getFace } from "@/lib/cube/cube-state";
import type { Move, MoveFamily, OuterFace } from "@/lib/cube/notation";

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

/*
 * Which layers a move turns, about which axis, and which way (the same table
 * as lib/cube/cube-state.ts, kept here so the scene can animate a turn):
 * direction +1 is counter-clockwise looking from the positive end of the axis.
 */
const TURN: Record<MoveFamily, { axis: 0 | 1 | 2; direction: 1 | -1; layers: number[] }> = {
  R: { axis: 0, direction: -1, layers: [1] },
  L: { axis: 0, direction: 1, layers: [-1] },
  U: { axis: 1, direction: -1, layers: [1] },
  D: { axis: 1, direction: 1, layers: [-1] },
  F: { axis: 2, direction: -1, layers: [1] },
  B: { axis: 2, direction: 1, layers: [-1] },
  r: { axis: 0, direction: -1, layers: [0, 1] },
  l: { axis: 0, direction: 1, layers: [-1, 0] },
  u: { axis: 1, direction: -1, layers: [0, 1] },
  d: { axis: 1, direction: 1, layers: [-1, 0] },
  f: { axis: 2, direction: -1, layers: [0, 1] },
  b: { axis: 2, direction: 1, layers: [-1, 0] },
  M: { axis: 0, direction: 1, layers: [0] },
  E: { axis: 1, direction: 1, layers: [0] },
  S: { axis: 2, direction: -1, layers: [0] },
  x: { axis: 0, direction: -1, layers: [-1, 0, 1] },
  y: { axis: 1, direction: -1, layers: [-1, 0, 1] },
  z: { axis: 2, direction: -1, layers: [-1, 0, 1] },
};

const AXIS_NAME = ["x", "y", "z"] as const;

/** Quick out, soft landing: a finger flick rather than a motor. */
const easeTurn = (t: number) => 1 - Math.pow(1 - t, 3);

export interface CubeScene {
  setFacelets(facelets: string): void;
  rotateBy(dx: number, dy: number): void;
  resetView(): void;
  /**
   * Turns the move's layers on screen, then shows `after` (the state the move
   * leads to). Resolves when the turn has landed. A duration of 0 just swaps.
   */
  turn(move: Move, after: string, durationMs: number): Promise<void>;
  /** A small extra lean on top of the dragged angle (radians), e.g. towards the cursor. */
  lean(x: number, y: number): void;
  dispose(): void;
}

/**
 * Reads each face's sticker colour from the theme tokens (see app/globals.css),
 * in the given view: the timer's scramble preview uses the scrambling one.
 */
export function readPalette(element: Element, view: CubeViewName = "scramble"): CubePalette {
  const style = getComputedStyle(element);
  const colours = CUBE_VIEWS[view];
  const read = (face: OuterFace) =>
    style.getPropertyValue(stickerVariable(colours[face])).trim() || STICKER_HEX[colours[face]];
  return Object.fromEntries(FACE_ORDER.map((face) => [face, read(face)])) as CubePalette;
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
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
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
  const pieces: {
    position: Vec3;
    geometry: RoundedBoxGeometry;
    mesh: Mesh;
    faces: (OuterFace | null)[];
  }[] = [];
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
        pieces.push({ position, geometry, mesh, faces });
      }

  const colors = Object.fromEntries(
    FACE_ORDER.map((face) => [face, new Color(palette[face])]),
  ) as Record<OuterFace, Color>;
  const core = new Color(CORE_COLOR);

  const base = { x: DEFAULT_ROTATION.x, y: DEFAULT_ROTATION.y };
  const offset = { x: 0, y: 0 };
  const applyRotation = () => cube.rotation.set(base.x + offset.x, base.y + offset.y, 0);

  let turnFrame = 0;
  let finishTurn: (() => void) | null = null;

  let frame = 0;
  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      renderer.render(scene, camera);
    });
  };

  const paint = (facelets: string) => {
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
  };

  return {
    setFacelets(facelets) {
      finishTurn?.();
      paint(facelets);
      requestRender();
    },
    rotateBy(dx, dy) {
      base.x = Math.max(-1.55, Math.min(1.55, base.x + dy * 0.01));
      base.y += dx * 0.01;
      applyRotation();
      requestRender();
    },
    resetView() {
      base.x = DEFAULT_ROTATION.x;
      base.y = DEFAULT_ROTATION.y;
      applyRotation();
      requestRender();
    },
    lean(x, y) {
      offset.x = x;
      offset.y = y;
      applyRotation();
      requestRender();
    },
    turn(move, after, durationMs) {
      finishTurn?.();
      if (durationMs <= 0) {
        paint(after);
        requestRender();
        return Promise.resolve();
      }
      const { axis, direction, layers } = TURN[move.family];
      const pivot = new Group();
      cube.add(pivot);
      const moving = pieces.filter((piece) => layers.includes(piece.position[axis]));
      for (const piece of moving) pivot.add(piece.mesh);
      const quarters = move.turns === 3 ? -1 : move.turns;
      const angle = direction * quarters * (Math.PI / 2);
      const start = performance.now();
      return new Promise<void>((resolve) => {
        const land = () => {
          cancelAnimationFrame(turnFrame);
          turnFrame = 0;
          finishTurn = null;
          for (const piece of moving) {
            cube.add(piece.mesh);
            const [x, y, z] = piece.position;
            piece.mesh.position.set(x * PIECE_SPACING, y * PIECE_SPACING, z * PIECE_SPACING);
            piece.mesh.rotation.set(0, 0, 0);
          }
          cube.remove(pivot);
          paint(after);
          renderer.render(scene, camera);
          resolve();
        };
        finishTurn = land;
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          pivot.rotation[AXIS_NAME[axis]] = angle * easeTurn(t);
          if (t >= 1) return land();
          renderer.render(scene, camera);
          turnFrame = requestAnimationFrame(step);
        };
        turnFrame = requestAnimationFrame(step);
      });
    },
    dispose() {
      finishTurn = null;
      cancelAnimationFrame(turnFrame);
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
