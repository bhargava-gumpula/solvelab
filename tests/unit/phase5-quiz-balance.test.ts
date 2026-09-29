import { describe, expect, it } from "vitest";
import { LESSON_QUIZZES } from "@/data/training/quizzes";

/**
 * The right answer mustn't give itself away by being the longest, most
 * qualified option, or a learner can pass without reading the lesson.
 * Lengths are in characters.
 */
const questions = Object.entries(LESSON_QUIZZES).flatMap(([id, quizzes]) =>
  quizzes.map((quiz, index) => ({
    name: `${id}[${index}]`,
    right: quiz.options[quiz.answer]!.length,
    longestWrong: Math.max(
      ...quiz.options
        .filter((_, position) => position !== quiz.answer)
        .map((option) => option.length),
    ),
  })),
);

describe("quiz answers don't stand out by length", () => {
  it("makes the right answer the strictly longest option in at most 35% of questions", () => {
    const longest = questions.filter((item) => item.right > item.longestWrong);
    expect(longest.length / questions.length).toBeLessThanOrEqual(0.35);
  });

  it("never makes the right answer more than 25% longer than the longest wrong one", () => {
    const tooLong = questions
      .filter((item) => item.right > item.longestWrong * 1.25)
      .map((item) => item.name);
    expect(tooLong).toEqual([]);
  });
});
