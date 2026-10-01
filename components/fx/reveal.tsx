"use client";

/*
 * Blur-in reveals. Reveal fades a block up out of a soft blur the first time
 * it scrolls into view (Magic UI Blur Fade idea, MIT); RevealText does the
 * same per word for display headings (Motion Primitives TextEffect idea, MIT).
 * Under reduced motion MotionConfig drops the movement and keeps the fade.
 */
import { Fragment } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface RevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  /** Rise distance in px. */
  y?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
}

export function Reveal({ delay = 0, y = 14, immediate = false, children, ...props }: RevealProps) {
  const target = { opacity: 1, y: 0, filter: "blur(0px)" };
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      {...(immediate ? { animate: target } : { whileInView: target })}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface RevealTextProps {
  text: string;
  className?: string;
  /** Seconds between words. */
  stagger?: number;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function RevealText({
  text,
  className,
  stagger = 0.06,
  delay = 0,
  as = "span",
}: RevealTextProps) {
  const Tag = motion[as];
  const words = text.split(" ");
  return (
    <Tag
      className={cn("inline-block", className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true }}
      aria-label={text}
    >
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <motion.span
            aria-hidden
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: "0.35em", filter: "blur(10px)" },
              shown: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: delay + index * stagger }}
          >
            {word}
          </motion.span>
          {/* A real space between words, so long lines can wrap. */}
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
