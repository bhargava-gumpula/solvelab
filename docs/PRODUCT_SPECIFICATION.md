# SOLVELAB — MASTER PRODUCT + ENGINEERING SPECIFICATION

You are the principal software engineer, product architect, ML engineer, and UI/UX engineer for this project.

Your job is to build this application carefully in phases. Do not rush ahead and create a huge, fragile prototype. Build solid foundations that later phases can extend.

The temporary working name is:

# SolveLab

All branding must be centralized so the product can easily be renamed later.

---

# 0. CORE PRODUCT IDEA

SolveLab is an intelligent Rubik's Cube timer, training platform, algorithm trainer, and personalized speedcubing coach.

Traditional cube timers tell users:

- how fast they solved,
- their Ao5,
- their Ao12,
- their PB,
- whether they are improving.

SolveLab should go further.

It should answer:

> Why am I not faster?

and then:

> What exactly should I practice to improve?

The central product loop is:

```text
SOLVE
  ↓
MEASURE
  ↓
DIAGNOSE
  ↓
TRAIN
  ↓
RETEST
  ↓
MEASURE IMPROVEMENT
  ↓
UPDATE SKILL PROFILE
  ↓
REPEAT
```

The primary tagline is:

# Don't just time your solves. Find out what's slowing you down.

Secondary possible tagline:

# Train smarter. Solve faster.

---

# 1. PRODUCT PRINCIPLES

These are non-negotiable.

## 1.1 Timer first

SolveLab must be good enough to use as someone's normal everyday Rubik's Cube timer.

The user should not be forced through AI coaching every time they want to solve.

Opening the app should make it extremely easy to:

1. see a scramble,
2. start the timer,
3. solve,
4. stop,
5. immediately continue.

The timer experience must feel fast and lightweight.

---

## 1.2 Coaching through evidence

Do not give generic advice like:

> Practice F2L.

Instead, SolveLab should collect evidence.

Example:

```text
Normal Ao12: 17.8
Cross pre-solved Ao10: 13.7
Cross-only average: 2.2
Cross + first pair: 5.3
```

From this, the system can investigate whether the real problem is:

- cross planning,
- cross execution,
- cross → F2L transition,
- first pair recognition,
- general F2L,
- lookahead,
- last layer,
- recognition,
- execution,
- consistency.

The app should behave like a coach running experiments.

---

## 1.3 Local-first

The core product should NOT require:

- Claude,
- ChatGPT,
- Gemini,
- an API key,
- a paid AI subscription.

Core diagnosis should be possible using:

- statistics,
- deterministic rules,
- a future lightweight local ML model.

Cloud AI should be optional.

---

## 1.4 AI should explain, not control everything

The core diagnostic system should produce structured conclusions.

Example:

```json
{
  "primaryWeakness": "cross_to_f2l",
  "confidence": 0.83,
  "secondaryWeakness": "f2l_lookahead",
  "recommendedDiagnostic": "cross_first_pair",
  "recommendedTraining": [
    "first_pair_prediction",
    "slow_f2l"
  ]
}
```

An LLM can then explain this naturally.

The LLM should not invent arbitrary drills or control application logic.

---

# 2. TARGET USERS

Support cubers ranging from beginners to advanced speedcubers.

Initial milestone system:

```text
Beginner
↓
Sub 2:00
↓
Sub 1:00
↓
Sub 45
↓
Sub 30
↓
Sub 25
↓
Sub 20
↓
Sub 15
↓
Sub 12
↓
Sub 10
```

Architecture must support adding:

```text
Sub 9
Sub 8
Sub 7
Sub 6
etc.
```

without rewriting milestone logic.

---

# 3. MAIN APPLICATION NAVIGATION

Desktop navigation should contain:

```text
Timer
Coach
Train
Algorithms
Learn
Stats
```

Settings can be accessible separately.

Mobile navigation may use a bottom navigation bar.

---

# 4. TIMER

The Timer page is the default/home experience.

It must support:

- 3x3 scramble generation
- large centered scramble
- keyboard-controlled timing
- spacebar start/stop
- touch controls on mobile
- optional WCA-style inspection
- +2
- DNF
- delete solve
- edit solve
- notes
- solve tags
- multiple sessions
- recent solve history
- current statistics
- PB indicators

---

# 5. TIMER ACCURACY

Do NOT implement the timer by incrementing a number every 10 ms.

Use:

```js
performance.now()
```

for timing.

Display updates can use:

```js
requestAnimationFrame()
```

Elapsed time should always be calculated from actual start and stop timestamps.

Store internally in milliseconds or another precise numeric representation.

Only format for display.

---

# 6. TIMER KEYBOARD BEHAVIOR

Desired desktop interaction:

### Idle

Hold space.

Timer enters ready state.

### Ready

Release space.

Timer starts.

### Running

Press space.

Timer stops.

Prevent browser scrolling caused by spacebar while timer is active.

Do NOT intercept keyboard input while the user is:

- typing in an input,
- editing notes,
- searching algorithms,
- interacting with a dialog.

Include configurable timer controls later.

---

# 7. INSPECTION

Support:

- inspection disabled,
- 15-second inspection,
- audible/visual warnings later.

State machine:

```text
IDLE
READY
INSPECTION
RUNNING
STOPPED
```

Keep this state machine isolated from UI components.

---

# 8. SOLVE DATA

Every solve should store at minimum:

```ts
interface Solve {
  id: string
  sessionId: string
  event: "333"

  scramble: string

  rawTimeMs: number
  penalty: "none" | "plus2" | "dnf"

  finalTimeMs: number | null

  createdAt: string

  source:
    | "normal"
    | "diagnostic"
    | "training"
    | "algorithm"

  exerciseId?: string

  notes?: string
  tags?: string[]
}
```

Do not permanently modify rawTime when a penalty is changed.

Calculate final time based on raw time + penalty.

---

# 9. TIMER STATISTICS

Support:

- current solve
- previous solve
- session mean
- best single
- current Ao5
- best Ao5
- current Ao12
- best Ao12
- Ao50
- Ao100
- best Ao50
- best Ao100
- median
- standard deviation
- solve count
- consistency
- rolling average
- PB progression

Ao5 should use proper WCA-style best/worst handling.

Larger averages should be implemented consistently and clearly documented.

Separate concepts such as:

```text
mean
average
rolling average
trimmed average
```

internally rather than mixing them.

---

# 10. SCRAMBLES

For normal 3x3 solving, use a reliable maintained cube scramble system.

Prefer using a well-supported cube library capable of proper 3x3 scramble generation rather than writing a weak random-move generator if a reliable solution is available.

Keep scramble generation behind an interface:

```ts
interface ScrambleProvider {
  generate(event: CubeEvent): Promise<string>
}
```

so it can be replaced later.

---

# 11. SESSIONS

Users should be able to create sessions such as:

```text
Main
Warmup
PLL Practice
Sub-10 Grind
Competition Prep
```

Each session stores:

- name
- event
- solves
- creation date
- optional description

Allow:

- create session
- rename
- archive
- delete
- switch session

---

# 12. MILESTONE SYSTEM

Milestones:

```ts
type Milestone =
  | "beginner"
  | "sub120"
  | "sub60"
  | "sub45"
  | "sub30"
  | "sub25"
  | "sub20"
  | "sub15"
  | "sub12"
  | "sub10"
```

Do not scatter milestone values through the application.

Use central configuration.

Example:

```ts
interface MilestoneDefinition {
  id: string
  label: string
  thresholdMs: number | null
  recommendedSkills: SkillId[]
  prerequisiteSkills?: SkillId[]
}
```

---

# 13. MILESTONE UI

Example:

```text
Road to Sub-10

Sub 2:00    ✓
Sub 1:00    ✓
Sub 45      ✓
Sub 30      ✓
Sub 25      ✓
Sub 20      ✓
Sub 15      ✓
Sub 12      ✓
Sub 10      ◉
```

Do not unlock milestones based on one lucky solve.

Milestone qualification should use stable performance.

Possible criteria:

- sustained Ao100,
- multiple qualifying sessions,
- configurable requirements.

Keep exact milestone qualification logic configurable because we may adjust it later.

---

# 14. SKILL SYSTEM

Create standardized skill identifiers.

Example:

```ts
type SkillId =
  | "cross_planning"
  | "cross_execution"
  | "cross_efficiency"
  | "cross_to_f2l"
  | "first_pair_prediction"
  | "f2l_recognition"
  | "f2l_efficiency"
  | "f2l_lookahead"
  | "f2l_rotations"
  | "oll_recognition"
  | "oll_execution"
  | "pll_recognition"
  | "pll_execution"
  | "auf_recognition"
  | "inspection"
  | "turning"
  | "consistency"
```

Skill profiles should support numerical scoring.

Example:

```ts
interface SkillScore {
  skillId: SkillId
  score: number // 0-100
  confidence: number // 0-1
  sampleCount: number
  updatedAt: string
}
```

Scores must include confidence.

Do not pretend to know someone's skill level from insufficient data.

---

# 15. COACH PAGE

The Coach page should show:

```text
ROAD TO SUB-10

Current Ao100
11.34

Goal
9.99

Primary weakness
F2L Lookahead

Secondary weakness
Cross → First Pair

Strongest area
PLL Execution
```

Then:

```text
TODAY'S TRAINING

Cross + First Pair
10 repetitions

Slow F2L
8 solves

PLL Recognition
20 cases

Normal Solves
12 solves
```

CTA:

```text
START TRAINING
```

---

# 16. DIAGNOSTIC PHILOSOPHY

Diagnostics should answer:

> Which component of the solve is responsible for lost time?

A diagnostic engine should:

1. inspect known data,
2. maintain candidate weaknesses,
3. identify missing evidence,
4. select the most useful next test,
5. collect enough samples,
6. update confidence,
7. stop when sufficiently confident.

---

# 17. DIAGNOSTIC EXERCISE MODEL

Create a reusable definition:

```ts
interface ExerciseDefinition {
  id: string
  name: string

  type:
    | "diagnostic"
    | "training"
    | "algorithm"

  category:
    | "cross"
    | "f2l"
    | "oll"
    | "pll"
    | "inspection"
    | "full_solve"

  description: string

  instructions: string[]

  skillsMeasured: SkillId[]
  skillsTrained: SkillId[]

  recommendedSampleCount: number

  applicableMilestones: string[]

  measurementType:
    | "time"
    | "accuracy"
    | "recognition"
    | "execution"
    | "moves"
    | "mixed"
}
```

---

# 18. INITIAL DIAGNOSTICS

V2 should eventually include at least:

## Normal solves

Baseline.

---

## Cross only

User solves only the cross.

Measure:

- cross planning/execution combined
- consistency

---

## Unlimited inspection cross

Give unlimited inspection.

Compare against limited inspection.

This helps isolate planning from execution.

---

## Cross + first pair

Solve:

```text
Cross
+
one F2L pair
```

Measure transition and first-pair awareness.

---

## Pre-solved cross

Scramble begins with cross solved.

User completes the cube.

Helps estimate how much time is associated with the beginning of the solve.

---

## F2L only

Begin with cross solved.

Stop after four F2L pairs.

---

## Slow F2L

User deliberately turns more slowly while trying never to pause.

Goal is continuity.

---

## Rotation-restricted / no-rotation F2L

Training/diagnostic tool for excessive rotations.

---

## OLL recognition

Show a case.

Timer stops when user identifies the case.

---

## OLL execution

Start from known case.

Measure execution.

---

## PLL recognition

Same concept.

---

## PLL execution

Same concept.

---

# 19. FUTURE DIAGNOSTICS

Architecture should support:

- cross move count
- cross solution planning test
- cross + first-pair prediction
- individual F2L cases
- two-pair lookahead
- last-slot F2L
- pair tracking
- OLL recognition vs execution
- PLL recognition vs execution
- AUF recognition
- algorithm recall
- low-TPS solves
- no-inspection solves
- extra-inspection solves
- first-pair tracking
- TPS bursts
- turning accuracy

---

# 20. TRAINING SYSTEM

Diagnostics discover weaknesses.

Training improves them.

Every training session should be structured.

Example:

```text
Today's Goal:
Improve Cross → First Pair

1. First-Pair Prediction
10 reps

2. Cross + First Pair
10 reps

3. Slow F2L
8 solves

4. Normal Solves
12 solves
```

Store:

```ts
interface TrainingPlan {
  id: string
  createdAt: string

  targetMilestone: string

  primarySkill: SkillId
  secondarySkills: SkillId[]

  exercises: TrainingPlanExercise[]

  completedAt?: string
}
```

---

# 21. RETESTING

Training without retesting is incomplete.

Before training:

```text
Cross + first pair:
4.20 s
```

After training:

```text
Cross + first pair:
3.72 s
```

Report:

```text
Improvement:
11.4%
```

If training produces little improvement:

```text
Improvement was smaller than expected.

Let's investigate first-pair recognition separately.
```

The app should change its hypothesis rather than repeatedly prescribing the same drill.

---

# 22. ALGORITHM TRAINER

This is a MAJOR feature, not an afterthought.

Create a dedicated:

# Algorithms

section.

The architecture must support arbitrary algorithm sets.

Initial categories should include:

## Beginner

- basic triggers
- beginner last-layer algorithms
- common beginner algorithms
- sexy move
- reverse sexy
- sledgehammer
- hedge-slammer
- basic F2L triggers

## 2-Look

- 2-look OLL
- 2-look PLL

## CFOP

- full OLL
- full PLL
- F2L cases

## Advanced

- COLL
- Winter Variation
- ZBLL

Architecture should allow adding later:

- VLS
- OLLCP
- ZBLS
- ELL
- other advanced systems
- custom user algorithm sets

Do not hard-code the UI around only OLL/PLL.

---

# 23. ALGORITHM DATA MODEL

Use a data-driven format.

Example:

```ts
interface AlgorithmCase {
  id: string

  setId: string
  subsetId?: string

  name: string

  aliases?: string[]

  caseState: CubeStateRepresentation

  primaryAlgorithm: string

  alternativeAlgorithms: AlgorithmVariant[]

  setupAlgorithm?: string

  tags?: string[]

  difficulty?: number

  prerequisites?: string[]

  notes?: string

  mirrorOf?: string

  rotationEquivalentOf?: string
}
```

Algorithm variants:

```ts
interface AlgorithmVariant {
  id: string
  algorithm: string

  name?: string

  recommended?: boolean

  notes?: string

  fingertrickNotes?: string

  source?: string
}
```

---

# 24. ALGORITHM SET MODEL

```ts
interface AlgorithmSet {
  id: string
  name: string

  description: string

  difficulty:
    | "beginner"
    | "intermediate"
    | "advanced"
    | "expert"

  category:
    | "f2l"
    | "oll"
    | "pll"
    | "last_layer"
    | "advanced"
    | "fundamentals"

  cases: AlgorithmCase[]
}
```

Load huge algorithm sets lazily.

For example, ZBLL should not make the initial application bundle enormous.

---

# 25. ALGORITHM CASE VISUALIZATION

Every case should have a clear cube diagram.

Create a reusable component:

```tsx
<CubeCaseDiagram />
```

Prefer rendering cases from cube state data rather than maintaining hundreds of unrelated image files.

The visualizer should eventually support:

- U face
- side stickers
- AUF
- cube rotations
- color-neutral viewing later

Keep rendering logic separate from algorithm data.

---

# 26. ALGORITHM TRAINER MODES

Support several training modes.

## Recognition

Show case.

Measure time until user identifies it.

---

## Execution

Show known case/name.

User performs algorithm.

Measure execution.

---

## Recognition + execution

Full case training.

---

## Recall

Show case.

User selects or types the algorithm.

---

## Flashcards

Case on front.

Algorithm on back.

---

## Weak cases

Automatically prioritize poorly performing cases.

---

## Custom drill

User manually selects specific algorithms.

Example:

```text
Ua
Ub
H
Z
```

---

# 27. ALGORITHM TRAINER STATS

For each case track:

```ts
interface AlgorithmPerformance {
  caseId: string

  attempts: number

  successfulAttempts: number

  recognitionAverageMs?: number

  executionAverageMs?: number

  totalAverageMs?: number

  bestRecognitionMs?: number

  bestExecutionMs?: number

  lastPracticedAt?: string

  masteryScore: number

  confidence: number

  dueAt?: string
}
```

---

# 28. SPACED REPETITION

Algorithm training should eventually include spaced repetition.

Do not need an overly complicated scheduler initially.

V1 can use a simple mastery system.

Later use an SM-2-like or similarly appropriate scheduling approach.

Cases the user:

- misses,
- forgets,
- recognizes slowly,
- executes slowly,

should appear more frequently.

Strong cases should appear less frequently.

---

# 29. ALGORITHM LEARNING STATES

Each algorithm can be:

```text
Not Started
Learning
Practicing
Known
Mastered
```

Allow user to mark:

```text
I know this
Learning
Ignore
Favorite
```

---

# 30. ALGORITHM VARIANTS

Users often use different algorithms for the same case.

Allow them to:

- choose preferred algorithm,
- view alternatives,
- add their own algorithm,
- save fingertrick notes,
- compare execution times.

Do NOT force everyone to use one algorithm.

---

# 31. ALGORITHM SEARCH

Search should support:

```text
T perm
PLL T
ZBLL T
Winter Variation
OLL 21
Sune
Anti-Sune
```

Support:

- aliases
- categories
- tags
- subsets

---

# 32. ALGORITHM TRAINER + COACH INTEGRATION

Algorithm performance should feed into coaching.

Example:

```text
PLL overall: strong

G-perm recognition:
0.91s

Other PLL recognition:
0.48s
```

Coach can conclude:

```text
Your PLL execution is not the problem.
Your G-perm recognition is unusually slow.
```

Then prescribe a targeted G-perm recognition session.

---

# 33. LEARN SECTION

Create structured learning paths.

## Beginner

- cube notation
- cube pieces
- first solve
- beginner method
- basic finger tricks

## CFOP

- cross
- F2L
- 2-look OLL
- 2-look PLL
- full OLL
- full PLL

## Advanced

- advanced F2L
- lookahead
- cross planning
- first pair
- rotation reduction
- x-cross
- Winter Variation
- COLL
- ZBLL
- recognition optimization
- fingertrick optimization

---

# 34. LEARNING PATH BY MILESTONE

The coach should not recommend everything to everyone.

Example:

## Beginner → Sub-2:00

Focus:

- reliably solve
- understand notation
- memorize basic method
- reduce huge pauses

Do NOT recommend ZBLL.

---

## Sub-2:00 → Sub-1:00

Focus:

- better beginner execution
- basic finger tricks
- fewer regrips
- introduction to CFOP if appropriate

---

## Sub-1:00 → Sub-45

Focus:

- intuitive F2L
- basic cross planning
- 2-look OLL
- 2-look PLL

---

## Sub-45 → Sub-30

Focus:

- stronger F2L
- planning cross
- reducing pauses
- reducing rotations
- last-layer improvement

---

## Sub-30 → Sub-25

Focus:

- F2L efficiency
- lookahead introduction
- stronger cross
- better turning
- more PLL knowledge

---

## Sub-25 → Sub-20

Focus:

- full PLL
- cross in inspection
- F2L efficiency
- recognition
- fewer rotations
- smoother solving

---

## Sub-20 → Sub-15

Focus:

- lookahead
- stronger cross
- cross → F2L
- PLL
- OLL improvement
- recognition
- execution consistency

---

## Sub-15 → Sub-12

Focus:

- advanced F2L
- full OLL becomes more valuable
- first pair
- lookahead
- fast recognition
- efficient execution

---

## Sub-12 → Sub-10

Focus:

- cross + first pair planning
- strong inspection
- advanced F2L
- low rotation count
- lookahead
- OLL/PLL recognition
- efficient finger tricks
- minimal pauses
- x-cross opportunities
- advanced algorithm choices when appropriate

---

# 35. STATS PAGE

Stats should be visually excellent.

Show:

- current average
- PB single
- PB Ao5
- PB Ao12
- PB Ao100
- session mean
- consistency
- total solves
- solves today
- solves this week
- practice streak

Charts:

- solve times over time
- rolling Ao5
- rolling Ao12
- rolling Ao100
- PB progression
- consistency
- milestone progression
- training performance

Later:

- skill progression
- cross improvement
- PLL recognition improvement
- F2L improvement

Every chart should have an accessible numerical/table representation.

---

# 36. PROGRESS HISTORY

Example:

```text
August 1
Average: 16.4

August 15
Average: 14.9

September 1
Average: 13.1

September 15
Average: 12.3
```

Also show:

```text
Cross:
2.9 → 2.1

Cross + first pair:
5.8 → 4.3

PLL recognition:
0.82 → 0.54
```

---

# 37. ACHIEVEMENTS

Keep these tasteful.

Examples:

```text
First Sub-30
First Sub-20
First Sub-15
First Sub-12
First Sub-10

100 Solves
1,000 Solves
10,000 Solves

100 PLL drills

Full PLL Learned

Full OLL Learned

7-Day Training Streak
```

Do not make the application feel like a children's game.

---

# 38. LOCAL DIAGNOSTIC ENGINE — VERSION 1

Start with deterministic expert rules.

Example conceptually:

```ts
if (
  crossOnlyIsGood &&
  crossFirstPairIsPoor
) {
  investigate("cross_to_f2l")
}
```

Another:

```ts
if (
  pllExecutionIsGood &&
  pllRecognitionIsPoor
) {
  weakness = "pll_recognition"
}
```

Rules must be:

- centralized,
- configurable,
- explainable,
- testable.

Do not scatter if-statements through React components.

Suggested location:

```text
lib/coach/rules/
```

---

# 39. IMPORTANT: DO NOT USE FALSE PRECISION

Do not hard-code simplistic statements such as:

```text
A Sub-15 cuber MUST have a 1.2 second cross.
```

Real cubers vary.

Prefer:

- relative comparisons,
- milestone ranges,
- percentiles later,
- confidence,
- repeated measurements.

Initial thresholds should live in config and be easy to tune.

---

# 40. LOCAL MACHINE-LEARNING MODEL

A future local model should NOT be a 20,000-parameter language model.

The problem is mostly structured/tabular.

Candidate approaches:

- logistic regression
- decision tree
- gradient-boosted trees
- random forest
- small MLP

Benchmark them.

Use whichever gives the best combination of:

- accuracy,
- explainability,
- model size,
- inference speed.

Do not use neural networks just because they sound more impressive.

---

# 41. POSSIBLE ML INPUT FEATURES

Examples:

```text
normal_mean
normal_median
ao5
ao12
ao100
standard_deviation

cross_mean
cross_stddev

unlimited_cross_mean

cross_first_pair_mean

presolved_cross_full_mean

f2l_only_mean

oll_recognition_mean
oll_execution_mean

pll_recognition_mean
pll_execution_mean

algorithm_accuracy

practice_frequency

rotation_score

current_milestone
target_milestone
```

Also include missing-value masks so the model knows what has not been tested.

---

# 42. ML OUTPUTS

Potential multi-head output:

### Weakness probabilities

```text
cross_planning         0.06
cross_execution        0.05
cross_to_f2l           0.42
f2l_efficiency         0.17
f2l_lookahead          0.21
oll_recognition        0.02
pll_recognition        0.05
pll_execution          0.02
```

### Recommended next diagnostic

```text
CROSS_FIRST_PAIR
```

### Recommended training category

```text
FIRST_PAIR_PREDICTION
```

---

# 43. ML DEPLOYMENT

Train model offline in Python.

Possible directory:

```text
ml/
  training/
  datasets/
  experiments/
  export/
```

Export final model to a browser-compatible format such as ONNX if appropriate.

Inference should eventually happen locally.

Do not require Python to run the web application.

---

# 44. INITIAL TRAINING DATA

Early versions may not have enough real users.

Therefore:

### Step 1

Rule engine.

### Step 2

Synthetic cuber profiles for ML experimentation.

### Step 3

Collect real opt-in anonymized performance data.

### Step 4

Train/evaluate on real data.

### Step 5

Compare ML decisions against rule engine.

Do not automatically replace the rule engine until the learned model proves better.

---

# 45. AI COACH — OPTIONAL

Create a provider abstraction.

Example:

```ts
interface CoachAIProvider {
  id: string

  generateExplanation(
    context: CoachContext
  ): Promise<CoachResponse>

  answerQuestion(
    context: CoachContext,
    question: string
  ): Promise<CoachResponse>
}
```

Possible adapters:

```text
LocalTemplateProvider
OllamaProvider
AnthropicProvider
OpenAIProvider
GeminiProvider
```

Future supported account/subscription integrations can be added later.

---

# 46. DO NOT RELY ON UNOFFICIAL SUBSCRIPTION HACKS

Do not:

- scrape Claude login credentials,
- steal browser cookies,
- extract hidden OAuth credentials,
- impersonate official Claude applications.

If a provider offers an officially supported account/subscription integration in the future, implement a dedicated adapter.

Until then support:

- local mode,
- local Ollama,
- official APIs.

---

# 47. API KEY SECURITY

If BYOK API keys are eventually supported:

Never expose private API keys publicly.

Prefer secure storage and server-side requests where appropriate.

Give users the ability to:

- add key,
- test connection,
- remove key,
- switch provider.

Local desktop builds may eventually use secure OS credential storage.

---

# 48. AI CONTEXT

The LLM should receive structured information, not 5,000 raw solve records.

Example:

```json
{
  "currentMilestone": "sub12",
  "targetMilestone": "sub10",

  "normal": {
    "ao100": 11.34,
    "median": 11.19,
    "stdDev": 1.12
  },

  "skills": {
    "crossExecution": {
      "score": 84,
      "confidence": 0.82
    },

    "crossToF2L": {
      "score": 49,
      "confidence": 0.88
    },

    "f2lLookahead": {
      "score": 55,
      "confidence": 0.71
    }
  },

  "recentDiagnostics": [],
  "trainingHistory": []
}
```

---

# 49. AI ALLOWED ACTIONS

If AI can choose actions, restrict it to defined tools/actions.

Example:

```text
EXPLAIN_RESULT
REQUEST_MORE_SAMPLES
ASSIGN_DIAGNOSTIC
CREATE_TRAINING_PLAN
ANSWER_COACHING_QUESTION
```

Only allow known exercise IDs.

Do not allow the model to invent database IDs or arbitrary app actions.

---

# 50. COACH CHAT

Eventually allow:

```text
Why are you making me practice cross?

Should I learn full OLL yet?

What is stopping me from becoming sub-10?

Should I learn ZBLL?

Why did my times get worse this week?

What should I practice today?
```

The response should use the user's actual statistics and skill profile.

---

# 51. LOCAL TEMPLATE COACH

Even with no LLM, explanations should still feel polished.

Example structured result:

```json
{
  "weakness": "cross_to_f2l",
  "evidence": [
    "Cross-only performance is strong.",
    "Cross + first-pair performance is disproportionately slower."
  ]
}
```

Template:

```text
Your cross itself looks strong.

The larger slowdown appears immediately afterward.
Your Cross + First Pair results are weaker than your Cross-only
results would predict.

Let's test your first-pair recognition next.
```

This means offline users still get useful coaching.

---

# 52. UI / DESIGN SYSTEM

This product must NOT look like:

- an admin template,
- a generic SaaS dashboard,
- a school assignment,
- a Bootstrap project,
- a random gradient-heavy AI website.

It should feel like a premium modern speedcubing tool.

---

# 53. USE 21ST.DEV

Use UI styles/components from:

# 21st.dev

This is an explicit requirement.

When the 21st.dev MCP/component registry is available:

1. search 21st.dev before building a generic component,
2. preview/select components appropriate to the design,
3. install/adapt their source into the project,
4. integrate them with the project's design tokens,
5. avoid creating a second conflicting design system.

Prefer 21st.dev components for things such as:

- dashboard cards,
- navigation,
- tabs,
- command palette,
- dialogs,
- sheets,
- progress indicators,
- metric cards,
- interactive cards,
- sidebar/mobile navigation,
- empty states,
- onboarding,
- stats displays,
- charts shells,
- settings controls.

Use shadcn/ui primitives where appropriate.

Do not install ten overlapping component libraries.

---

# 54. 21ST DESIGN RULE

Before creating a new substantial UI component:

1. check existing project components,
2. check whether an appropriate 21st.dev component exists,
3. reuse/adapt if it fits,
4. create custom only when needed.

The UI should still feel like ONE PRODUCT.

Do not combine five unrelated 21st.dev component styles.

---

# 55. VISUAL DIRECTION

Primary aesthetic:

```text
minimal
premium
fast
technical
clean
focused
modern
```

Use:

- neutral backgrounds,
- strong typography,
- large timer digits,
- clear hierarchy,
- subtle depth,
- restrained animation,
- responsive cards,
- excellent dark mode.

Avoid excessive gradients and neon.

Cube sticker colors are already visually strong.

The surrounding interface should therefore remain relatively neutral.

---

# 56. THEMING

Use design tokens.

Example:

```css
--background
--foreground
--card
--card-foreground
--muted
--muted-foreground
--border
--primary
--primary-foreground
--accent
--danger
--success
```

Do not hard-code colors throughout components.

Support:

- dark mode
- light mode
- system mode

Dark mode should be first-class.

---

# 57. TYPOGRAPHY

Timer digits need:

- tabular numerals,
- large sizing,
- excellent readability.

Stats should also use tabular numbers.

Avoid layout shift when numbers change.

---

# 58. MOTION

Animations should be subtle.

Good:

- card transitions,
- progress changes,
- page transitions,
- success states.

Bad:

- bouncing everything,
- excessive glowing,
- 3D gimmicks everywhere.

Respect:

```css
prefers-reduced-motion
```

---

# 59. ACCESSIBILITY

Must include:

- keyboard navigation
- visible focus states
- semantic HTML
- accessible dialogs
- accessible forms
- screen-reader labels
- sufficient contrast
- chart data alternatives

Timer keyboard handling must not destroy normal accessibility.

---

# 60. RESPONSIVE DESIGN

Desktop:

Timer can use large central canvas.

Coach/stats can use dashboard-style layouts.

Mobile:

- touch-friendly timer
- bottom navigation
- responsive scramble
- sheets instead of huge dialogs where appropriate

Test:

```text
375px
768px
1024px
1440px+
```

---

# 61. TECHNOLOGY STACK

Recommended baseline:

## Framework

Next.js with App Router

## Language

TypeScript

## UI

React

## Styling

Tailwind CSS

## Components

shadcn/ui + selected 21st.dev components

## Local state

Zustand where useful

Do not use Zustand for everything if React state is sufficient.

## Local database

IndexedDB

Prefer a wrapper such as Dexie if helpful.

## Validation

Zod

## Charts

Use a lightweight React chart library appropriate for the project.

## Testing

Vitest or Jest for unit tests

Playwright for end-to-end tests

---

# 62. LOCAL-FIRST STORAGE

Initial version should work without an account.

Use IndexedDB for:

- sessions,
- solves,
- algorithm progress,
- user settings,
- skill profiles,
- training sessions.

Cloud sync can be added later.

---

# 63. OPTIONAL CLOUD VERSION

Later support:

- authentication,
- PostgreSQL,
- cloud sync,
- cross-device data.

A service such as Supabase may be appropriate.

But do NOT make cloud infrastructure a requirement for V1.

---

# 64. IMPORT / EXPORT

Users must own their data.

Support:

### V1

Export JSON.

Import JSON.

### Later

CSV.

Other timer import adapters.

Potential csTimer import adapter.

Do not lock users into SolveLab.

---

# 65. PRIVACY

Training/solve data is personal usage data.

Default:

- store locally,
- do not upload unnecessarily.

If cloud AI is enabled:

Show what data is sent.

Prefer sending aggregated coaching context instead of full raw solve history.

---

# 66. PROPOSED PROJECT STRUCTURE

Use something similar to:

```text
app/
  timer/
  coach/
  train/
  algorithms/
  learn/
  stats/
  settings/

components/
  ui/
  timer/
  coach/
  training/
  algorithms/
  cube/
  stats/
  layout/

lib/
  timer/
  scramble/
  stats/
  averages/
  cube/
  algorithms/
  diagnostics/
  training/
  coach/
    rules/
    scoring/
    providers/
  storage/
  export/
  utils/

data/
  milestones/
  exercises/
  algorithms/
    beginner/
    two-look-oll/
    two-look-pll/
    oll/
    pll/
    f2l/
    coll/
    winter-variation/
    zbll/

types/

hooks/

tests/

ml/
  training/
  datasets/
  experiments/
  export/
```

Adjust if architecture requires it.

---

# 67. CORE DOMAIN SERVICES

Avoid putting logic directly in pages.

Create services/modules such as:

```text
TimerEngine
StatsEngine
MilestoneEngine
AlgorithmTrainerEngine
DiagnosticEngine
TrainingPlanEngine
SkillProfileEngine
CoachEngine
```

---

# 68. TESTING REQUIREMENTS

Write tests for important logic.

Especially:

### Timer

- start
- stop
- inspection
- penalty

### Statistics

- mean
- Ao5
- DNF handling
- +2 handling
- PB calculations
- rolling averages

### Algorithm trainer

- mastery updates
- SRS scheduling
- attempt storage

### Diagnostics

- rule evaluation
- confidence updates
- next-test recommendation

### Storage

- save solve
- edit solve
- delete solve
- migrations

---

# 69. ERROR STATES

Design proper states for:

- no solves
- not enough data
- no diagnostics completed
- algorithm set empty
- AI provider unavailable
- API error
- local storage error
- import failure

Never show broken blank screens.

---

# 70. VERSIONED IMPLEMENTATION PLAN

DO NOT implement everything at once.

Build in the following order.

---

# V0 — FOUNDATION / DESIGN PROTOTYPE

Goal:

Create the architecture and visual foundation.

Implement:

- Next.js project
- TypeScript
- Tailwind
- shadcn
- 21st.dev-compatible design system
- app shell
- navigation
- theme
- IndexedDB setup
- domain types
- initial routing
- brand config

Pages may initially use mock data.

Routes:

```text
/timer
/coach
/train
/algorithms
/learn
/stats
/settings
```

### V0 acceptance criteria

- application launches
- responsive navigation works
- dark/light mode works
- 21st-inspired design is consistent
- no major domain logic lives in React page components
- local persistence layer initialized

---

# V1 — REAL TIMER

Goal:

Make SolveLab usable as a daily timer.

Implement:

- 3x3 scramble generation
- spacebar timer
- touch timer
- inspection option
- solves
- sessions
- penalties
- notes
- recent history
- local persistence
- Ao5
- Ao12
- Ao50
- Ao100
- session mean
- PBs
- basic graphs
- export/import JSON

Timer page must be polished.

### V1 acceptance criteria

A user can:

1. open the app,
2. receive scrambles,
3. complete hundreds of solves,
4. close browser,
5. reopen,
6. retain all data,
7. review stats,
8. edit penalties,
9. switch sessions.

Timer should be reliable enough for normal use.

---

# V1.5 — ALGORITHM TRAINER

Goal:

Make the first training system genuinely useful.

Implement algorithm framework.

Initial sets:

- fundamentals/basic triggers
- 2-look OLL
- 2-look PLL
- full PLL
- full OLL

Then architecture-ready for:

- F2L
- COLL
- Winter Variation
- ZBLL

Features:

- algorithm browser
- search
- filter by set
- case diagrams
- algorithm variants
- preferred algorithm
- known/learning/mastered state
- favorites
- practice mode
- recognition mode
- execution mode
- attempt tracking
- case statistics
- weak-case mode
- initial spaced repetition

### V1.5 acceptance criteria

A user can:

- browse OLL/PLL,
- mark algorithms known,
- select preferred algorithms,
- drill cases,
- measure performance,
- see weak cases,
- resume later with progress intact.

---

# V1.75 — ADVANCED ALGORITHM SETS

Add:

- F2L cases
- COLL
- Winter Variation
- ZBLL

Ensure massive sets are:

- lazy loaded,
- searchable,
- grouped into subsets.

Do not let ZBLL make the application slow.

---

# V2 — COACH / DIAGNOSTICS

Goal:

Create the unique feature.

Implement:

- milestone system
- skill profile
- exercise framework
- diagnostic framework
- rule-based diagnostic engine
- training plan generation
- retesting
- improvement measurement

Initial diagnostics:

```text
Normal Solves
Cross Only
Unlimited Inspection Cross
Cross + First Pair
Pre-solved Cross
F2L Only
Slow F2L
OLL Recognition
OLL Execution
PLL Recognition
PLL Execution
```

### V2 coach flow

```text
Establish baseline
↓
Identify possible weakness
↓
Assign diagnostic
↓
Collect samples
↓
Update skill profile
↓
Assign another diagnostic if needed
↓
Produce diagnosis
↓
Build training plan
↓
Train
↓
Retest
```

### V2 acceptance criteria

A user can complete a diagnostic journey and receive:

- primary weakness,
- secondary weakness,
- confidence,
- explanation,
- targeted exercises,
- training plan,
- retest result.

No external LLM should be required.

---

# V2.5 — LOCAL INTELLIGENCE

Goal:

Improve diagnosis without cloud AI.

Build ML experimentation pipeline.

Compare:

- rules
- logistic regression
- decision trees
- gradient boosting
- small MLP

Do NOT assume the neural network wins.

Create:

```text
ml/
```

training environment.

Generate synthetic test profiles initially.

Create validation datasets.

Export selected model for local inference if it meaningfully improves recommendations.

### V2.5 acceptance criteria

- model runs locally,
- no internet required,
- model size is small,
- recommendation latency is negligible,
- model performance is evaluated,
- fallback rule engine remains available.

---

# V3 — OPTIONAL AI COACH

Goal:

Add conversational coaching.

Implement provider layer.

Start with:

```text
LocalTemplateProvider
OllamaProvider
```

Then optionally:

```text
AnthropicProvider
OpenAIProvider
GeminiProvider
```

Features:

- Ask Coach
- explanation generation
- weekly recap
- training-plan explanation
- questions such as:
  - Should I learn full OLL?
  - Why am I practicing this?
  - What should I do today?
  - Why did I get slower this week?

AI should receive structured statistics.

### V3 acceptance criteria

Turning AI off must NOT break:

- timer,
- diagnostics,
- training,
- algorithm trainer.

---

# V3.5 — CLOUD SYNC / ACCOUNTS

Optional.

Add:

- accounts
- authentication
- cloud database
- sync
- device migration

Maintain local-first capability.

---

# V4 — SMART CUBE

Future major version.

Support Bluetooth smart cubes.

Create adapter architecture:

```ts
interface SmartCubeAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  subscribeToMoves(callback): void
  getState(): CubeState
}
```

Different cube brands should have separate adapters.

---

# 71. SMART CUBE FUTURE ANALYSIS

With turn timestamps, SolveLab may measure:

```text
inspection
cross
cross → pair 1
pair 1
pair 2
pair 3
pair 4
OLL recognition
OLL execution
PLL recognition
PLL execution
AUF
```

Potential metrics:

- TPS
- pauses
- pause duration
- move count
- rotations
- regrips if detectable
- cross efficiency
- F2L efficiency
- algorithm used
- transition delays

---

# 72. SMART CUBE COACHING

Future examples:

```text
Your third F2L pair causes your largest pause in 43% of solves.
```

```text
You average 3.2 rotations during F2L.
```

```text
Your TPS is already sufficient for your target speed.
Your larger issue is 1.6 seconds of total F2L pauses.
```

```text
Your PLL execution is fast, but recognition costs 0.8 seconds.
```

This is V4, not MVP.

---

# 73. PRODUCT HOME / LANDING PAGE

Eventually create a public landing page.

Hero:

# Don't just time your solves.
# Find out what's slowing you down.

Supporting copy:

```text
SolveLab combines a professional speedcubing timer,
algorithm training, targeted diagnostics, and personalized
practice plans to help you reach your next milestone.
```

CTA:

```text
Start Solving
```

Secondary:

```text
See How It Works
```

Show:

```text
Solve → Diagnose → Train → Improve
```

Use a polished 21st.dev hero/component.

---

# 74. FIRST-TIME ONBOARDING

Keep onboarding short.

Ask:

```text
What's your current average?
```

Options:

```text
Over 2 minutes
1–2 minutes
45–60 seconds
30–45
25–30
20–25
15–20
12–15
10–12
Sub-10
Not sure
```

Ask:

```text
What method do you use?
```

Possible:

```text
Beginner
CFOP
Roux
ZZ
Other
Not sure
```

Initial coaching should focus primarily on CFOP because diagnostics currently assume CFOP phases.

If non-CFOP selected, timer still works but coach should clearly indicate limited method-specific coaching initially.

---

# 75. BASELINE ASSESSMENT

Optional onboarding:

```text
Complete 12 normal solves so SolveLab can establish your baseline.
```

Do not force this.

User can skip and simply use the timer.

After enough solves:

```text
We have enough data to estimate your current level.
```

Then invite them to Coach.

---

# 76. COACH DIAGNOSIS UI

Example:

```text
DIAGNOSIS

Primary Bottleneck
Cross → First Pair

Confidence
84%

Evidence

✓ Cross execution is strong.
✓ Pre-solved-cross performance is good.
✗ Cross + first-pair performance is disproportionately slow.

Next step

10 First-Pair Prediction drills
```

Do not present AI results as unquestionable truth.

Use language like:

```text
likely
appears
our current data suggests
confidence
```

---

# 77. TRAINING SESSION UI

Training should feel guided.

Example:

```text
TODAY'S TRAINING
18 minutes

1 / 4

Cross + First Pair

10 repetitions

Goal:
Plan the full cross and identify the first pair before starting.

Progress:
██████░░░░
6 / 10
```

Then automatically move to next activity.

End with:

```text
SESSION COMPLETE
```

Summary:

```text
Cross + First Pair
4.21 → 3.93

PLL Recognition
0.64 → 0.57

Normal Ao12
11.82
```

---

# 78. DO NOT OVERUSE AI

Most actions should require zero AI calls.

AI should not run:

- every solve,
- every timer tick,
- every algorithm attempt.

Cloud AI can run when:

- user asks Coach,
- diagnosis finishes,
- training plan is generated,
- weekly recap is requested.

This reduces:

- cost,
- latency,
- privacy exposure.

---

# 79. PERFORMANCE

Target:

- timer interaction feels instantaneous,
- no unnecessary network dependency,
- algorithm lists virtualized if large,
- ZBLL lazy loaded,
- charts load asynchronously if necessary,
- no giant client JS bundle.

Use server components where appropriate.

Use client components only when interaction requires them.

Timer obviously requires client-side logic.

---

# 80. OFFLINE / PWA FUTURE

Plan architecture so SolveLab can eventually become a PWA.

Ideal:

```text
Open laptop
No internet
Timer still works
Algorithms still work
Coach rules still work
Local ML still works
```

Cloud AI simply becomes unavailable.

---

# 81. BRAND CONFIG

Create one file:

```ts
export const brand = {
  name: "SolveLab",
  tagline:
    "Don't just time your solves. Find out what's slowing you down."
}
```

Do not write "SolveLab" manually in 50 components.

We may rename it later.

---

# 82. CODE QUALITY

Use:

- strict TypeScript,
- clear interfaces,
- small modules,
- pure functions for math/statistics,
- domain services,
- reusable components.

Avoid:

- giant 1,000-line components,
- duplicated logic,
- `any`,
- magic numbers,
- hidden side effects.

Document complicated cubing logic.

---

# 83. DATABASE MIGRATIONS

Local data will evolve.

Version local IndexedDB schema.

Never assume V1 users can simply lose data when V2 launches.

Plan migrations early.

---

# 84. SEED DATA

Add initial structured seed data for:

- milestones,
- skills,
- exercises,
- algorithm sets.

Do not put giant JSON blobs directly into React components.

---

# 85. ALGORITHM VALIDATION

Create utilities to validate algorithm notation.

Support standard turns:

```text
R
L
U
D
F
B

R'
R2
```

Later:

```text
r / Rw
l / Lw
u
d
f
b

M
E
S

x
y
z
```

Parser should be reusable.

---

# 86. CUBE ENGINE

Eventually maintain a basic internal cube-state representation.

Needed for:

- diagrams,
- algorithm verification,
- setup generation,
- case visualization,
- smart cube support.

Keep cube math in:

```text
lib/cube/
```

Do not couple cube math to UI.

---

# 87. FUTURE CASE GENERATION

Algorithm trainer should eventually be capable of generating a valid practice setup for a desired case.

Possible flow:

```text
desired case
↓
cube state
↓
setup sequence
↓
user performs algorithm
```

Design the data model now so this is possible later.

---

# 88. FUTURE COMPETITION MODE

Potential future feature:

```text
Competition Simulation
```

Includes:

- 15-second inspection
- Ao5
- WCA-style penalties
- no mid-average stats distraction

Not required now.

---

# 89. FUTURE GOALS

Allow users to create:

```text
Become Sub-15
Learn Full PLL
Learn Full OLL
Learn ZBLL T-set
Reduce PLL recognition below 0.5s
```

Coach can use goals when building plans.

---

# 90. FUTURE COMMUNITY FEATURES

Do NOT build these early.

Possible later:

- share training plans
- compare statistics
- public profiles
- leaderboards
- algorithm popularity
- community algorithm variants

Core personal training experience is more important.

---

# 91. WHAT NOT TO BUILD YET

Do not waste early development time on:

- social network
- messaging
- payments
- tutor marketplace
- classes
- video calls
- complicated admin system
- multiplayer
- every WCA event
- smart cube integration before core coaching works

This project is NOT related to tutoring classes.

Its purpose is speedcubing improvement.

---

# 92. PRIMARY DIFFERENTIATOR

The product is NOT:

```text
a cube timer with ChatGPT added
```

The product IS:

```text
a measurement and diagnosis system for speedcubing
```

The interesting intelligence comes from:

```text
targeted experiments
+
structured data
+
skill profiles
+
adaptive practice
```

AI explanation is only one layer.

---

# 93. KEY DEMO EXPERIENCE

Build toward this demo:

User averages:

```text
12.1
```

SolveLab says:

```text
Let's determine whether the beginning of your solve is limiting you.
```

User performs:

```text
Cross Only × 10
```

Then:

```text
Cross + First Pair × 10
```

Then:

```text
Pre-Solved Cross × 10
```

SolveLab concludes:

```text
PRIMARY BOTTLENECK

Cross → First Pair

Confidence: 82%

Your raw cross speed is strong,
but your transition into F2L is significantly slower than expected.
```

Training:

```text
First-Pair Prediction × 10
Slow F2L × 8
Normal Solves × 12
```

Retest:

```text
Cross → First Pair

Before: 4.21
After: 3.68

12.6% improvement
```

That is the product.

---

# 94. IMPLEMENTATION WORKFLOW FOR YOU, THE CODING AGENT

When starting this repository:

## Step 1

Inspect the existing repository.

Do not overwrite functioning code unnecessarily.

## Step 2

Produce a short architecture summary.

## Step 3

Identify which implementation version the repository is currently at.

## Step 4

Implement only the next logical phase.

## Step 5

Run:

- typecheck
- lint
- unit tests
- build

Fix failures before continuing.

## Step 6

Show what was implemented and what remains.

---

# 95. IF STARTING FROM AN EMPTY REPOSITORY

Start with:

# V0

Then V1.

Do NOT attempt to build all V4 features in the first pass.

The first goal is:

> A beautiful, reliable Rubik's Cube timer with the correct architecture for everything that follows.

---

# 96. FIRST DEVELOPMENT MILESTONE

The initial coding milestone should be:

## SolveLab V0 + Timer Foundation

Build:

1. project shell
2. 21st.dev-inspired design system
3. responsive navigation
4. dark/light theme
5. IndexedDB data layer
6. timer state machine
7. 3x3 scramble display
8. solve storage
9. recent solve history
10. initial statistics
11. session system

Do not add fake AI yet.

---

# 97. SECOND DEVELOPMENT MILESTONE

After timer is reliable:

## Algorithm Trainer

Implement:

- algorithm data model
- 2-look OLL
- 2-look PLL
- PLL
- OLL
- algorithm browser
- diagrams
- recognition drills
- execution drills
- mastery
- spaced repetition foundation

Then extend to:

- F2L
- COLL
- Winter Variation
- ZBLL

---

# 98. THIRD DEVELOPMENT MILESTONE

After timer + algorithms work:

## Diagnostic Coach

Implement:

- skill profile
- diagnostics
- rule engine
- training plans
- retests

Only after this works should we experiment with ML.

---

# 99. FOURTH DEVELOPMENT MILESTONE

## Local ML

Evaluate whether learned models improve diagnosis.

Do not add ML merely for marketing.

---

# 100. FIFTH DEVELOPMENT MILESTONE

## Optional LLM Coach

Add explanation/chat providers.

Core app must remain functional without them.

---

# 101. FINAL PRODUCT DEFINITION

SolveLab is:

> An intelligent Rubik's Cube timer and speedcubing training platform that measures how a user solves, identifies their weaknesses through targeted diagnostic exercises, assigns personalized training, retests improvements, tracks milestone progression, and provides a complete algorithm training system ranging from beginner methods through advanced sets such as OLL, PLL, COLL, Winter Variation, and ZBLL.

Its core intelligence is local and structured.

Optional AI can make the coaching conversational, but the underlying diagnosis should remain evidence-based and explainable.

The permanent product loop is:

# SOLVE → DIAGNOSE → TRAIN → RETEST → IMPROVE

And the core promise is:

# Don't just know your time. Know how to make it faster.