"use client";

/*
 * Every course as a shelf of album covers you can pick up and flick through:
 * drag it with the mouse (it keeps going when you let go and settles on a
 * cover), swipe or scroll it on touch and trackpads (native scroll snap), or
 * use the arrow keys. Covers turn gently towards the middle like a record
 * crate. Opening one morphs its cover into the course page's cover (React
 * <ViewTransition>, a named pair only for the cover you picked).
 *
 * Everything moves with transforms written straight to the covers from one
 * rAF per scroll frame; positions are measured only on resize.
 */
import { useEffect, useRef, useState, ViewTransition } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { Tilt } from "@/components/fx/tilt";
import { COURSES } from "@/data/hub/courses";
import { courseHref, courseUnits } from "@/lib/hub/units";
import { cn } from "@/lib/utils";
import { CoverArt } from "./cover-art";

const COUNTS = COURSES.map((course) => {
  const units = courseUnits(course);
  return {
    units: units.length,
    lessons: units.reduce((total, unit) => total + unit.lessons.length, 0),
  };
});

export const courseCoverName = (courseId: string) => `course-cover-${courseId}`;

export function CourseShelf({
  activeId,
  currentId,
  className,
}: {
  /** The course this page is about (its cover isn't a link out). */
  activeId: string | null;
  /** The course you're placed in. */
  currentId: string | null;
  className?: string;
}) {
  const { reducedMotion } = useAppearance();
  const rail = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const centres = useRef<number[]>([]);
  const anchors = useRef<(HTMLSpanElement | null)[]>([]);
  const frame = useRef(0);
  const glide = useRef(0);
  const drag = useRef<{
    x: number;
    left: number;
    moved: number;
    samples: [number, number][];
  } | null>(null);
  const [centred, setCentred] = useState(() =>
    Math.max(
      0,
      COURSES.findIndex((course) => course.id === (activeId ?? currentId)),
    ),
  );
  const [morph, setMorph] = useState<string | null>(null);

  /*
   * ── measure on resize, paint on scroll ──
   * The shelf has no spacer at either end: the first cover starts at the left
   * edge and the last one ends at the right edge. The cover "in focus" slides
   * with the scroll, from the first cover (scrolled to the start) to the last
   * (scrolled to the end), so every course has its own resting place and the
   * shelf is always full. Snap anchors sit at those resting places.
   */
  const geometry = () => {
    // The ref is gone a moment before the effect's cleanup when the page leaves.
    const node = rail.current;
    const list = centres.current;
    const first = list[0] ?? 0;
    const span = Math.max(1, (list[list.length - 1] ?? 0) - first);
    const max = node ? Math.max(0, node.scrollWidth - node.clientWidth) : 0;
    return { first, span, max };
  };
  const restFor = (index: number) => {
    const { first, span, max } = geometry();
    return (max * ((centres.current[index] ?? first) - first)) / span;
  };
  const focalAt = (left: number) => {
    const { first, span, max } = geometry();
    return max ? first + (span * left) / max : first + span / 2;
  };

  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const measure = () => {
      centres.current = items.current.map((item) =>
        item ? item.offsetLeft + item.offsetWidth / 2 : 0,
      );
      anchors.current.forEach((anchor, index) => {
        if (anchor) anchor.style.left = `${restFor(index)}px`;
      });
    };
    const paint = () => {
      frame.current = 0;
      const { max } = geometry();
      const focal = focalAt(node.scrollLeft);
      const stride = Math.max(1, (centres.current[1] ?? 1) - (centres.current[0] ?? 0));
      let nearest = 0;
      let best = Infinity;
      centres.current.forEach((centre, index) => {
        const distance = max ? (centre - focal) / stride : 0;
        if (Math.abs(centre - focal) < best) {
          best = Math.abs(centre - focal);
          nearest = index;
        }
        const card = cards.current[index];
        if (!card) return;
        const d = Math.max(-2.5, Math.min(2.5, distance));
        const turn = reducedMotion ? 0 : Math.max(-1.4, Math.min(1.4, d)) * -14;
        const scale = 1 - Math.min(Math.abs(d), 2) * 0.06;
        card.style.transform = `perspective(1100px) rotateY(${turn.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = String(1 - Math.max(0, Math.abs(d) - 2) * 0.35);
      });
      // Soft edges only where there is more shelf to see.
      node.style.setProperty("--fade-l", node.scrollLeft > 2 ? "56px" : "0px");
      node.style.setProperty("--fade-r", node.scrollLeft < max - 2 ? "56px" : "0px");
      setCentred((value) => (value === nearest ? value : nearest));
    };
    const schedule = () => {
      if (!frame.current) frame.current = requestAnimationFrame(paint);
    };
    measure();
    // Start with the page's course at its resting place.
    node.scrollLeft = restFor(centred);
    paint();
    const observer = new ResizeObserver(() => {
      measure();
      schedule();
    });
    observer.observe(node);
    node.addEventListener("scroll", schedule, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame.current);
      cancelAnimationFrame(glide.current);
    };
    // Mount-time only: the scroll handler reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const scrollToIndex = (index: number, smooth = true) => {
    const node = rail.current;
    if (!node || centres.current[index] === undefined) return;
    node.scrollTo({
      left: restFor(index),
      behavior: smooth && !reducedMotion ? "smooth" : "auto",
    });
  };

  const nearestTo = (left: number) => {
    const focal = focalAt(left);
    let nearest = 0;
    centres.current.forEach((centre, index) => {
      if (Math.abs(centre - focal) < Math.abs(centres.current[nearest]! - focal)) nearest = index;
    });
    return nearest;
  };

  /* ── mouse drag with a flick that keeps going ── */
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const node = rail.current!;
    cancelAnimationFrame(glide.current);
    drag.current = {
      x: event.clientX,
      left: node.scrollLeft,
      moved: 0,
      samples: [[performance.now(), event.clientX]],
    };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const node = rail.current!;
    const dx = event.clientX - state.x;
    state.moved = Math.max(state.moved, Math.abs(dx));
    if (state.moved > 4 && !node.dataset.dragging) {
      node.dataset.dragging = "true";
      node.setPointerCapture(event.pointerId);
    }
    node.scrollLeft = state.left - dx;
    state.samples.push([performance.now(), event.clientX]);
    if (state.samples.length > 6) state.samples.shift();
  };
  const onPointerUp = () => {
    const state = drag.current;
    const node = rail.current;
    if (!state || !node) return;
    const [t0, x0] = state.samples[0]!;
    const [t1, x1] = state.samples[state.samples.length - 1]!;
    // px per frame at 60 Hz
    let velocity = t1 > t0 ? (-(x1 - x0) / (t1 - t0)) * 16 : 0;
    const settle = () => {
      scrollToIndex(nearestTo(node.scrollLeft));
      window.setTimeout(() => delete node.dataset.dragging, 420);
    };
    if (reducedMotion || Math.abs(velocity) < 1.5) {
      settle();
    } else {
      // Glide with friction, then land on the nearest cover.
      const step = () => {
        node.scrollLeft += velocity;
        velocity *= 0.93;
        if (Math.abs(velocity) > 0.6) glide.current = requestAnimationFrame(step);
        else settle();
      };
      glide.current = requestAnimationFrame(step);
    }
    // Keep the flag for the click that follows a drag, so it doesn't open a course.
    window.setTimeout(() => {
      drag.current = null;
    }, 0);
  };

  const move = (delta: number) => {
    const next = Math.max(0, Math.min(COURSES.length - 1, centred + delta));
    scrollToIndex(next);
    return next;
  };

  return (
    <section aria-labelledby="course-shelf-title" className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The shelf</p>
          <h2
            id="course-shelf-title"
            className="mt-1 font-display text-[2.2rem] leading-none md:text-[2.6rem]"
          >
            Every <em className="text-primary">course</em>
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-2 hidden text-xs text-muted-foreground sm:block">
            Drag, swipe or use the arrow keys
          </span>
          <ShelfButton label="Previous course" onClick={() => move(-1)} disabled={centred === 0}>
            <ChevronLeft className="size-4" />
          </ShelfButton>
          <ShelfButton
            label="Next course"
            onClick={() => move(1)}
            disabled={centred === COURSES.length - 1}
          >
            <ChevronRight className="size-4" />
          </ShelfButton>
        </div>
      </div>
      <div
        ref={rail}
        className="course-shelf relative -mx-4 no-scrollbar overflow-x-auto overscroll-x-contain md:mx-[calc(50%-50vw)]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(event) => {
          if (drag.current && drag.current.moved > 6) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {COURSES.map((course, index) => (
          <span
            key={course.id}
            aria-hidden
            ref={(node) => {
              anchors.current[index] = node;
            }}
            className="course-shelf-anchor"
          />
        ))}
        {/* On wider screens the shelf runs to the window edges: covers peek in
            from both sides while the first and last rest on the content edges. */}
        <ol className="flex w-max gap-5 px-4 pt-3 pb-4 md:gap-7 md:px-[var(--shelf-gutter)]">
          {COURSES.map((course, index) => {
            const isActive = course.id === activeId;
            const here = course.id === currentId;
            const counts = COUNTS[index]!;
            return (
              <li
                key={course.id}
                ref={(node) => {
                  items.current[index] = node;
                }}
                className="w-[var(--shelf-item)] shrink-0"
              >
                <div
                  ref={(node) => {
                    cards.current[index] = node;
                  }}
                  className="course-shelf-card will-change-transform"
                >
                  <Link
                    href={here ? "/hub/" : courseHref(course)}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`${course.title}: ${course.tagline} ${counts.units} units, ${counts.lessons} lessons${here ? ". Your course" : ""}`}
                    data-testid={`course-chip-${course.id}`}
                    draggable={false}
                    className="group block rounded-[1.3rem] outline-none"
                    onClick={() => {
                      if (isActive || drag.current?.moved) return;
                      flushSync(() => setMorph(course.id));
                    }}
                    onFocus={() => {
                      if (index !== centred) scrollToIndex(index);
                    }}
                    onKeyDown={(event) => {
                      const delta =
                        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
                      const edge =
                        event.key === "Home" ? 0 : event.key === "End" ? COURSES.length - 1 : null;
                      if (!delta && edge === null) return;
                      event.preventDefault();
                      const next = edge ?? Math.max(0, Math.min(COURSES.length - 1, index + delta));
                      items.current[next]?.querySelector("a")?.focus({ preventScroll: true });
                      scrollToIndex(next);
                    }}
                  >
                    <Tilt
                      max={6}
                      className={cn(
                        "morph-lift rounded-[1.3rem] shadow-[var(--shadow-tile)] transition-shadow duration-500 group-hover:shadow-[var(--shadow-float)]",
                      )}
                    >
                      <ViewTransition
                        name={morph === course.id ? courseCoverName(course.id) : undefined}
                        share="morph"
                        default="none"
                      >
                        <CoverArt
                          hue={course.hue}
                          index={index * 3 + 1}
                          number={`Nº ${String(index + 1).padStart(2, "0")}`}
                          label={`${counts.units} units · ${counts.lessons} lessons`}
                          className="aspect-square rounded-[1.3rem]"
                        />
                      </ViewTransition>
                    </Tilt>
                    <span className="mt-3 flex items-baseline gap-2">
                      {isActive ? (
                        // The page you're on: a small blue dot, not a ring round the cover.
                        <span
                          aria-hidden
                          className="size-1.5 shrink-0 -translate-y-[0.3rem] rounded-full bg-primary"
                        />
                      ) : null}
                      <span className="font-display text-[1.45rem] leading-none md:text-[1.7rem]">
                        {course.title}
                      </span>
                      {here ? <span className="text-xs text-primary">Your course</span> : null}
                    </span>
                    <span
                      className={cn(
                        "mt-1 block text-[13px] leading-snug text-pretty text-muted-foreground transition-opacity duration-300",
                        index === centred ? "opacity-100" : "opacity-0",
                      )}
                    >
                      {course.tagline}
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mt-1 flex justify-center gap-1.5" aria-hidden>
        {COURSES.map((course, index) => (
          <span
            key={course.id}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              index === centred ? "w-5 bg-foreground" : "w-1 bg-foreground/20",
            )}
          />
        ))}
      </div>
    </section>
  );
}

function ShelfButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-full border border-[var(--hairline)] bg-[var(--tile)] text-foreground transition-[transform,opacity] hover:-translate-y-px active:scale-95 disabled:opacity-35"
    >
      {children}
    </button>
  );
}
