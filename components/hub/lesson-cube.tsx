"use client";

/*
 * The Hub's live cube: the studio's three.js speedcube, set up so that the
 * lesson's moves solve it. It plays them once when it scrolls into view (real
 * layer turns, not a slideshow), leans towards the cursor, turns in your hand
 * when you drag it, and the move strip underneath scrubs it to any move.
 * Nothing renders while it sits still, and nothing plays while a solve is
 * timed, the tab is hidden or motion is reduced (then Play steps without
 * turning).
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { CubeNet } from "@/components/cube/cube-net";
import type { CubeScene } from "@/components/cube/cube-scene";
import { useFinePointer, useFxActive } from "@/components/fx/use-fx";
import { applyMoves, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { formatMove, invertAlgorithm, parseAlgorithm, type Move } from "@/lib/cube/notation";
import { cn } from "@/lib/utils";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function LessonCube({
  moves: text,
  className,
  stageClassName,
  autoPlay = true,
  tempo,
  pauseAfter,
}: {
  moves: string;
  className?: string;
  /** Sizes the cube itself (the default is up to 14rem wide). */
  stageClassName?: string;
  autoPlay?: boolean;
  /** "slow" plays each turn at about half speed (lessons about seeing, not turning). */
  tempo?: "slow";
  /** Hold for a beat after these moves (0-based), marked in the strip. */
  pauseAfter?: readonly number[];
}) {
  const { reducedMotion } = useAppearance();
  const fine = useFinePointer();
  const fxActive = useFxActive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CubeScene | null>(null);
  const run = useRef(0);
  const played = useRef(false);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const leanTarget = useRef({ x: 0, y: 0 });
  const leanNow = useRef({ x: 0, y: 0 });
  const leanFrame = useRef(0);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  // One solid highlight slides from move to move (never two half-lit chips).
  const highlight = `lesson-move-${useId()}`;
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const moves = useMemo<Move[]>(() => {
    const parsed = parseAlgorithm(text);
    return parsed.ok ? parsed.moves : [];
  }, [text]);
  // states[i] is the cube after i moves; the last one is solved.
  const states = useMemo(() => {
    const start = applyMoves(SOLVED_FACELETS, invertAlgorithm(moves));
    const list = [start];
    for (const move of moves) list.push(applyMoves(list[list.length - 1]!, [move]));
    return list;
  }, [moves]);
  const statesRef = useRef(states);
  const cancelRuns = () => {
    run.current++;
  };
  const indexRef = useRef(0);

  useEffect(() => {
    statesRef.current = states;
    indexRef.current = 0;
    sceneRef.current?.setFacelets(states[0]!);
  }, [states]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    import("@/components/cube/cube-scene")
      .then(({ createCubeScene, readPalette }) => {
        if (disposed) return;
        const scene = createCubeScene(canvas, readPalette(canvas));
        if (!scene) return setFailed(true);
        sceneRef.current = scene;
        scene.setFacelets(statesRef.current[indexRef.current]!);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      cancelRuns();
      cancelAnimationFrame(leanFrame.current);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const show = (next: number) => {
    indexRef.current = next;
    setIndex(next);
  };

  const stop = () => {
    run.current++;
    setPlaying(false);
  };

  const play = async () => {
    const scene = sceneRef.current;
    if (!scene || !moves.length) return;
    const token = ++run.current;
    setPlaying(true);
    if (indexRef.current >= moves.length) {
      scene.setFacelets(statesRef.current[0]!);
      show(0);
      await wait(420);
    }
    for (let at = indexRef.current; at < moves.length; at++) {
      if (token !== run.current) return;
      const move = moves[at]!;
      const slow = tempo === "slow" ? 1.9 : 1;
      const duration = reducedMotion ? 0 : (move.turns === 2 ? 340 : 230) * slow;
      await scene.turn(move, statesRef.current[at + 1]!, duration);
      if (token !== run.current) return;
      show(at + 1);
      const beat = pauseAfter?.includes(at) && at < moves.length - 1 ? 850 : 0;
      await wait((reducedMotion ? 420 : 90 * slow) + beat);
    }
    if (token === run.current) setPlaying(false);
  };

  const jump = (next: number) => {
    const clamped = Math.max(0, Math.min(moves.length, next));
    run.current++;
    setPlaying(false);
    sceneRef.current?.setFacelets(statesRef.current[clamped]!);
    show(clamped);
    return clamped;
  };

  // Play once when it first comes into view.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !ready || !autoPlay || reducedMotion || played.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || played.current) return;
        played.current = true;
        observer.disconnect();
        window.setTimeout(() => void play(), 500);
      },
      { threshold: 0.6 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- play reads refs; start once per mount
  }, [ready, autoPlay, reducedMotion]);

  // A timed solve, a hidden tab or reduced motion stops the show.
  useEffect(() => {
    if (!fxActive) run.current++;
  }, [fxActive]);

  const easeLean = () => {
    const scene = sceneRef.current;
    const now = leanNow.current;
    const target = leanTarget.current;
    now.x += (target.x - now.x) * 0.12;
    now.y += (target.y - now.y) * 0.12;
    scene?.lean(now.x, now.y);
    if (Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.001) {
      leanFrame.current = requestAnimationFrame(easeLean);
    } else leanFrame.current = 0;
  };
  const leanTo = (x: number, y: number) => {
    leanTarget.current = { x, y };
    if (!leanFrame.current) leanFrame.current = requestAnimationFrame(easeLean);
  };

  const current = Math.max(0, index - 1);
  return (
    <div className={cn("flex w-full min-w-0 flex-col items-center", className)}>
      <div
        ref={stageRef}
        role="img"
        aria-label={`A 3D cube showing ${text}. Drag to turn it.`}
        className={cn(
          "lesson-cube relative aspect-square w-full max-w-[14rem] cursor-grab touch-pan-y select-none active:cursor-grabbing",
          stageClassName,
        )}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragging.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={(event) => {
          if (dragging.current) {
            const dx = event.clientX - dragging.current.x;
            const dy = event.pointerType === "mouse" ? event.clientY - dragging.current.y : 0;
            dragging.current = { x: event.clientX, y: event.clientY };
            sceneRef.current?.rotateBy(dx, dy);
            return;
          }
          if (!fine || reducedMotion || event.pointerType !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
          leanTo(ny * 0.22, nx * 0.34);
        }}
        onPointerUp={() => {
          dragging.current = null;
        }}
        onPointerCancel={() => {
          dragging.current = null;
        }}
        onPointerLeave={() => {
          if (!dragging.current) leanTo(0, 0);
        }}
        onDoubleClick={() => sceneRef.current?.resetView()}
      >
        <span
          aria-hidden
          className="lesson-cube-shadow pointer-events-none absolute bottom-[6%] left-1/2 h-[12%] w-[62%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.22),transparent)]"
        />
        {failed ? (
          <CubeNet facelets={states[index]!} className="absolute inset-[12%] h-auto w-[76%]" />
        ) : (
          <canvas ref={canvasRef} className="lesson-cube-body relative size-full" />
        )}
      </div>

      {moves.length ? (
        <div className="mt-2 flex w-full max-w-[22rem] items-start gap-2">
          <button
            type="button"
            onClick={() => (playing ? stop() : void play())}
            aria-label={
              playing ? "Pause the moves" : index >= moves.length ? "Play again" : "Play the moves"
            }
            className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform hover:scale-105 active:scale-95"
            data-testid="lesson-cube-play"
          >
            {playing ? (
              <Pause className="size-3.5" />
            ) : index >= moves.length ? (
              <RotateCcw className="size-3.5" />
            ) : (
              <Play className="size-3.5 translate-x-px" />
            )}
          </button>
          {/* The whole sequence stays visible: it wraps rather than scrolls, so no move is ever clipped. */}
          <ol
            aria-label="Moves: use the arrow keys to step through them"
            data-own-keys
            className="flex min-w-0 flex-1 flex-wrap items-center gap-x-0.5 gap-y-0.5 py-1 font-mono text-[13px]"
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const next = jump(index + (event.key === "ArrowRight" ? 1 : -1));
              chips.current[Math.max(0, next - 1)]?.focus();
            }}
          >
            {moves.map((move, at) => {
              const done = at < index;
              const now = at === index - 1;
              const beat = pauseAfter?.includes(at) && at < moves.length - 1;
              return (
                <li key={at} className={cn(beat && "mr-2.5")}>
                  <button
                    ref={(node) => {
                      chips.current[at] = node;
                    }}
                    type="button"
                    tabIndex={at === current ? 0 : -1}
                    aria-label={`Move ${at + 1}, ${formatMove(move)}`}
                    aria-current={now ? "step" : undefined}
                    onClick={() => jump(at + 1)}
                    title={beat ? "A beat here: look ahead" : undefined}
                    className={cn(
                      "relative rounded-md px-1 py-0.5",
                      now
                        ? // Turns white as the sliding pill arrives, never before it.
                          "text-primary-foreground transition-colors delay-[60ms] duration-0"
                        : done
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {now ? (
                      <motion.span
                        aria-hidden
                        layoutId={highlight}
                        className="absolute inset-0 z-0 rounded-md bg-primary"
                        transition={
                          reducedMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 720, damping: 46, mass: 0.5 }
                        }
                      />
                    ) : null}
                    {/* Every label sits above the sliding pill, so none is ever covered. */}
                    <span className="relative z-10">{formatMove(move)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
