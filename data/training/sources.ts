import type { TrainingSource } from "./types";

/**
 * Where the teaching in these packs comes from. Everything in the packs is
 * written in our own words; these are the places to read more, and the places
 * a claim can be checked against.
 */
export const SOURCES = {
  getFaster: {
    label: "CubeSkills: How to get faster",
    url: "https://www.cubeskills.com/blog/how-to-get-faster",
  },
  lookaheadFramework: {
    label: "CubeSkills: Lookahead progression framework",
    url: "https://www.cubeskills.com/blog/lookahead-progression-framework",
  },
  turningSpeed: {
    label: "CubeSkills: Improving turning speed",
    url: "https://www.cubeskills.com/blog/improving-turning-speed",
  },
  practiceTips: {
    label: "CubeSkills: Cubing practice tips",
    url: "https://www.cubeskills.com/blog/cubing-practice-tips",
  },
  colourNeutrality: {
    label: "CubeSkills: Colour neutrality",
    url: "https://www.cubeskills.com/blog/colour-neutrality",
  },
  extendedCross: {
    label: "CubeSkills: 25 extended cross examples",
    url: "https://www.cubeskills.com/blog/25-extended-cross-examples",
  },
  crossPlusPair: {
    label: "CubeSkills: Planning cross and one F2L pair",
    url: "https://www.cubeskills.com/tutorials/advanced-f2l/planning-cross-1-f2l-pair",
  },
  crossTransition: {
    label: "CubeSkills: Improving the cross to F2L transition",
    url: "https://www.cubeskills.com/tutorials/intermediate-cross-and-f2l/improving-crossf2l-transition",
  },
  predictPll: {
    label: "CubeSkills: Predicting PLL drill",
    url: "https://www.cubeskills.com/tutorials/advanced-last-layer/practice-drill-predicting-pll",
  },
  limits: {
    label: "CubeSkills: What are the limits?",
    url: "https://www.cubeskills.com/blog/what-are-the-limits",
  },
  jpermCfop: { label: "J Perm: CFOP", url: "https://jperm.net/3x3/cfop" },
  jpermCross: { label: "J Perm: Cross", url: "https://www.jperm.net/3x3/cfop/cross" },
  jpermF2l: { label: "J Perm: F2L", url: "https://jperm.net/3x3/cfop/f2l" },
  cubefreakLookahead: {
    label: "Cubefreak: A guide to F2L lookahead",
    url: "https://cubefreak.net/speed/articles/lookahead.php",
  },
  cubefreakCross: {
    label: "Cubefreak: Cross",
    url: "http://www.cubefreak.net/speed/cfop/cross.php",
  },
  badmephistoF2l: {
    label: "Badmephisto: F2L (mirror)",
    url: "https://defhacks.github.io/badmephisto-mirror/f2l.html",
  },
  emptySlots: {
    label: "Jayden McNeill: Taking advantage of empty slots",
    url: "https://www.jaydenmcneillcubing.com/blog/blog-post-twelve-s6blk",
  },
  keyhole: {
    label: "SpeedSolving wiki: Keyhole F2L",
    url: "https://www.speedsolving.com/wiki/index.php?title=Keyhole_F2L",
  },
  pseudoslotting: {
    label: "Solved: Pseudoslotting",
    url: "https://solved.no/guides/pseudoslotting",
  },
  fingerTricks: {
    label: "SpeedSolving wiki: Finger tricks",
    url: "https://www.speedsolving.com/wiki/index.php/Finger_tricks",
  },
  colourNeutralWiki: {
    label: "SpeedSolving wiki: Color neutrality",
    url: "https://www.speedsolving.com/wiki/index.php/Color_neutrality",
  },
  subTen: {
    label: "SpeedSolving: How to be sub-10 with CFOP",
    url: "https://www.speedsolving.com/threads/how-to-be-sub-10-with-the-cfop-method.93567/",
  },
  deliberatePractice: {
    label: "SpeedSolving: Applying deliberate practice to cubing",
    url: "https://www.speedsolving.com/threads/applying-deliberate-practice-to-cubing.36962/",
  },
  slowF2l: {
    label: "SpeedSolving: Going slow and looking ahead",
    url: "https://www.speedsolving.com/threads/fridrich-f2l-going-slow-and-looking-ahead-tutorial.15213/",
  },
  subTwenty: {
    label: "CuberPal: How to get sub-20 on 3x3",
    url: "https://www.cuberpal.com/guides/how-to-get-sub-20-on-3x3",
  },
  cuberpalLookahead: {
    label: "CuberPal: F2L lookahead",
    url: "https://www.cuberpal.com/guides/f2l-lookahead",
  },
  solveSplits: {
    label: "CuberPal: CFOP solve splits",
    url: "https://www.cuberpal.com/blog/cfop-solve-splits",
  },
  pllRecognitionGuide: {
    label: "CuberPal: PLL recognition",
    url: "https://www.cuberpal.com/blog/pll-recognition",
  },
  practiceSession: {
    label: "CuberPal: A better practice session plan",
    url: "https://www.cuberpal.com/blog/how-to-practice-speedcubing",
  },
  sarahPll: {
    label: "Sarah's Cubing Site: PLL recognition guide",
    url: "https://sarah.cubing.net/3x3x3/pll-recognition-guide",
  },
  twoSidedPll: {
    label: "Two-sided PLL recognition",
    url: "https://logiqx.github.io/cubing-algs/html/2spll.html",
  },
  ollAlgs: { label: "SpeedCubeDB: OLL algorithms", url: "https://speedcubedb.com/a/3x3/OLL" },
  crossPlanning: {
    label: "AI Cube Trainer: The complete guide to cross planning",
    url: "https://aicubetrainer.com/cross-planning",
  },
  wcaRegulations: {
    label: "WCA Regulations",
    url: "https://www.worldcubeassociation.org/regulations/",
  },
  subMinute: {
    label: "SpeedCubeShop: How to become sub 1 minute on 3x3",
    url: "https://speedcubeshop.com/a/blog/sub-1-minute-on-3x3",
  },
  cubicleImprove: {
    label: "TheCubicle: How to improve at speedcubing",
    url: "https://www.thecubicle.com/blogs/thecubicle-blogs/how-to-improve-at-speedcubing",
  },
  feliksTension: {
    label: "Feliks Zemdegs: How to tension your speedcube",
    url: "https://www.speedcube.us/pages/how-to-tension-your-speedcube",
  },
  feliksLube: {
    label: "Feliks Zemdegs: How to lubricate your speedcube",
    url: "https://www.speedcube.us/pages/how-to-lubricate-your-speedcube",
  },
  cubeSetup: {
    label: "AI Cube Trainer: How to set up a speedcube",
    url: "https://aicubetrainer.com/cube-setup-guide",
  },
  learnF2l: {
    label: "CuberPal: How to learn F2L after the beginner method",
    url: "https://www.cuberpal.com/guides/how-to-learn-f2l",
  },
  f2lSlowerFirst: {
    label: "Cubelelo: F2L increases time initially, but eventually helps",
    url: "https://www.cubelelo.com/blogs/cubing/f2l-in-cfop-increases-time-initially-but-eventually-helps",
  },
  twoLookOllWiki: {
    label: "SpeedSolving wiki: 2-Look OLL",
    url: "https://www.speedsolving.com/wiki/index.php/2-Look_OLL",
  },
  twoLookOll: {
    label: "CuberPal: 2-look OLL",
    url: "https://www.cuberpal.com/blog/two-look-oll",
  },
  pairSelection: {
    label: "SpeedSolving: F2L first pair selection",
    url: "https://www.speedsolving.com/threads/f2l-first-pair-selection.39850/",
  },
  stuckPieces: {
    label: "SpeedSolving: F2L open-slot and stuck-piece algorithms",
    url: "https://www.speedsolving.com/threads/list-of-all-f2l-open-slot-and-stuck-pieces-algorithms.63442/",
  },
  f2lAllSlots: {
    label: "CubeSkills: F2L algorithms for all four slots (PDF)",
    url: "https://www.cubeskills.com/uploads/pdf/tutorials/f2l-algorithms-different-slot-positions.pdf",
  },
  aufTips: {
    label: "Jayden McNeill: 3 tips to boost your AUF game",
    url: "https://www.jaydenmcneillcubing.com/blog/blog-post-five-7llsk",
  },
  dualNeutral: {
    label: "SpeedSolving: When should you learn to be dual colour neutral?",
    url: "https://www.speedsolving.com/threads/when-should-you-learn-to-be-dual-color-neutral.94502/",
  },
  xcrossTrainer: {
    label: "Solved: X-cross inspection trainer",
    url: "https://www.solved.no/trainers/3x3/inspection/xcross",
  },
  xcrossThread: {
    label: "SpeedSolving: X-cross tips and discussion",
    url: "https://www.speedsolving.com/threads/xcross-tips-and-discussion.8638/",
  },
  multislotting: {
    label: "ZZ Method: Multislotting",
    url: "https://www.zzmethod.com/improvement-guide/zzf2l/multislotting",
  },
  algSets: {
    label: "Cubing Content: All major 3x3 algorithm sets and which to learn",
    url: "https://cubingcontent.com/2023/01/25/getting-faster-all-major-3x3-alg-sets-and-which-ones-to-learn/",
  },
  llHierarchy: {
    label: "SpeedSolving: Hierarchy of last-layer sub-steps",
    url: "https://www.speedsolving.com/threads/hierarchy-of-last-layer-sub-steps-subsets-of-ollcp-and-zbll.53675/",
  },
  sub10Thread: {
    label: "SpeedSolving: What makes a sub-10 cuber?",
    url: "https://www.speedsolving.com/threads/what-makes-a-sub-10-cuber.48000/",
  },
  reconstructionWiki: {
    label: "SpeedSolving wiki: Reconstruction",
    url: "https://www.speedsolving.com/wiki/index.php/Reconstruction",
  },
  metricWiki: {
    label: "SpeedSolving wiki: Metric",
    url: "https://www.speedsolving.com/wiki/index.php/Metric",
  },
  reconStats: {
    label: "ReconStats: Learning from the pros",
    url: "https://basilio.dev/cubing/recons/",
  },
  wcaCompetitor: {
    label: "WCA: Competitor tutorial (PDF)",
    url: "https://documents.worldcubeassociation.org/edudoc/competitor-tutorial/tutorial.pdf",
  },
  firstCompetition: {
    label: "AI Cube Trainer: Your first WCA competition",
    url: "https://aicubetrainer.com/wca-competition-guide",
  },
  sub15Thread: {
    label: "SpeedSolving: How do I get sub-15 on 3x3?",
    url: "https://www.speedsolving.com/threads/how-do-i-get-sub-15-on-3x3.23094/",
  },
  edgeOrientationWiki: {
    label: "SpeedSolving wiki: Edge orientation",
    url: "https://www.speedsolving.com/wiki/index.php/Edge_Orientation",
  },
  advancedF2lTricks: {
    label: "SpeedSolving: Advanced F2L tricks",
    url: "https://www.speedsolving.com/threads/advanced-f2l-tricks.77803/",
  },
  vhlsWiki: {
    label: "SpeedSolving wiki: VHLS",
    url: "https://www.speedsolving.com/wiki/index.php/VHLS",
  },
  partialEdgeControl: {
    label: "SpeedSolving wiki: Partial Edge Control",
    url: "https://www.speedsolving.com/wiki/index.php/Partial_Edge_Control",
  },
  edgeControlThread: {
    label: "SpeedSolving: Edge control vs. full OLL",
    url: "https://www.speedsolving.com/threads/edge-control-vs-full-oll.77167/",
  },
  f2lAlgs: { label: "SpeedCubeDB: F2L algorithms", url: "https://speedcubedb.com/a/3x3/F2L" },
  f2lSheet: {
    label: "CubeSkills: F2L algorithms (PDF)",
    url: "https://www.cubeskills.com/uploads/pdf/tutorials/f2l.pdf",
  },
  usefulF2l: {
    label: "CubeSkills: Some useful F2L cases (PDF)",
    url: "https://www.cubeskills.com/uploads/pdf/tutorials/useful-f2l-algorithms.pdf",
  },
  f2lTrainer: { label: "f2l.app: F2L trainer", url: "https://f2l.app/" },
  pllAlgs: { label: "SpeedCubeDB: PLL algorithms", url: "https://speedcubedb.com/a/3x3/PLL" },
  pllAngles: {
    label: "SpeedSolving: PLL guide for all 84 angles",
    url: "https://www.speedsolving.com/threads/new-pll-guide-with-algorithms-and-performance-notes-for-all-84-angles.54081/",
  },
  feliksCommentary: {
    label: "CubeSkills: 5.80 reconstructions and commentary",
    url: "https://www.cubeskills.com/blog/580-reconstructions-commentary",
  },
  // F2L at the fast end
  feliks597: {
    label: "CubeSkills: 5.97 reconstructions and commentary",
    url: "https://www.cubeskills.com/blog/597-reconstructions-commentary",
  },
  feliks1021: {
    label: "CubeSkills: 10.21 reconstructions and commentary",
    url: "https://www.cubeskills.com/blog/1021-reconstructions-commentary",
  },
  smmsWiki: {
    label: "SpeedSolving wiki: SMMS",
    url: "https://www.speedsolving.com/wiki/index.php/SMMS",
  },
  phaseShares: {
    label: "SpeedSolving: A method of CFOP training that yields systematic progress",
    url: "https://www.speedsolving.com/threads/a-method-of-cfop-speedcubing-training-that-yields-systematic-progress.39406/",
  },
  f2lEoGuide: {
    label: "SpeedSolving: F2L edge orientation guide",
    url: "https://www.speedsolving.com/threads/f2l-edge-orientation-guide.25525/",
  },
  rotationsVsLookahead: {
    label: "SpeedSolving: F2L without cube rotations vs lookahead",
    url: "https://www.speedsolving.com/threads/f2l-without-cuberotations-vs-lookahead.22586/",
  },
  rotationVsFb: {
    label: "SpeedSolving: Cube rotation vs F/B moves during F2L",
    url: "https://www.speedsolving.com/threads/cube-rotation-vs-f-b-moves-during-f2l.46804/",
  },
  tipTooEarly: {
    label: "SpeedSolving: A good tip you learned too early",
    url: "https://www.speedsolving.com/threads/what%E2%80%99s-a-%E2%80%9Cgood-tip%E2%80%9D-you-learned-too-early-that-ended-up-hurting-you.96446/",
  },
  // Inspection at the fast end
  crossStudy: {
    label: "Lars Vandenbergh: Cross study",
    url: "http://www.cubezone.be/crossstudy.html",
  },
  xcrossCounts: {
    label: "SpeedSolving: 2x2x2, x-cross and 3x2x2 move counts",
    url: "https://www.speedsolving.com/threads/2x2x2-x-cross-and-3x2x2-move-count.12403/",
  },
  neutralityExperiment: {
    label: "CubeSkills: Colour neutrality part 2, the experiment",
    url: "https://www.cubeskills.com/blog/colour-neutrality-part-2-experiment-qa",
  },
  inspectionUse: {
    label: "SpeedSolving: How to use your inspection time",
    url: "https://www.speedsolving.com/threads/how-to-use-your-inspection-time.70672/",
  },
  recordHistory: {
    label: "SpeedSolving wiki: History of 3x3x3 world records",
    url: "https://www.speedsolving.com/wiki/index.php?title=History_of_World_Records%2F3x3x3",
  },
  pseudoXcrossTrainer: {
    label: "Solved: Pseudo x-cross inspection trainer",
    url: "https://solved.no/trainers/3x3/inspection/pseudo_xcross",
  },
  csTimer: {
    label: "csTimer: timer with a cross solver in its tools",
    url: "https://cstimer.net/",
  },
  // The last layer without gaps
  roll: {
    label: "Jayden McNeill: ROLL, predicting PLL from the corners",
    url: "https://www.jaydenmcneillcubing.com/blog/blog-post-nine-9w8xs",
  },
  ocllPermutations: {
    label: "SpeedSolving: Predicting PLL before or while solving OLL",
    url: "https://speedsolving.com/forum/threads/predicting-pll-before-while-solving-oll.53104",
  },
  twoSidedGuide: {
    label: "SpeedSolving: Two-sided PLL recognition guide (mark49152)",
    url: "https://www.speedsolving.com/threads/two-sided-pll-recognition-guide.41108/",
  },
  yihengRecon: {
    label: "reco.nz: Yiheng Wang's 4.49, reconstructed",
    url: "https://reco.nz/solve/9720",
  },
  ollPllPause: {
    label: "SpeedSolving: OLL execution and PLL recognition at the same time",
    url: "https://www.speedsolving.com/threads/oll-execution-and-pll-recognition-at-the-same.89966/",
  },
  pllTimeAttack: {
    label: "SpeedSolving: Yiheng Wang's PLL time attack sequence",
    url: "https://www.speedsolving.com/threads/yiheng-wangs-pll-time-attack-sequence.96294/",
  },
  // Where the pauses are
  pauseStudy: {
    label: "Boyce & Storm: What separates the fastest solvers from the rest? (JEI, 2022)",
    url: "https://emerginginvestigators.org/articles/21-189",
  },
  reconTymon454: {
    label: "reco.nz: Tymon Kolasiński 4.54",
    url: "https://reco.nz/solve/6370",
  },
  reconXuanyi305: {
    label: "reco.nz: Xuanyi Geng 3.05 (world record)",
    url: "https://reco.nz/solve/11719",
  },
  tpsWiki: {
    label: "SpeedSolving wiki: Turns per second",
    url: "https://www.speedsolving.com/wiki/index.php/Turns_per_second",
  },
  tpsMattersThread: {
    label: "SpeedSolving: At what point does TPS matter?",
    url: "https://www.speedsolving.com/threads/at-what-point-does-tps-matter.50544/",
  },
  // Beyond the plateau
  compPerformance: {
    label: "CubeSkills: Thoughts on competition performance",
    url: "https://www.cubeskills.com/blog/thoughts-on-competition-performance",
  },
  averageWiki: {
    label: "SpeedSolving wiki: Average",
    url: "https://www.speedsolving.com/wiki/index.php/Average",
  },
  okPlateau: {
    label: "The Marginalian: Joshua Foer on the OK plateau",
    url: "https://www.themarginalian.org/2013/10/17/ok-plateau/",
  },
  contextualInterference: {
    label: "Shea & Morgan (1979): Contextual interference and motor skill (ERIC)",
    url: "https://eric.ed.gov/?id=EJ215260",
  },
  sleepMotorSkill: {
    label: "Walker et al. (2002): Practice with sleep makes perfect (PubMed)",
    url: "https://pubmed.ncbi.nlm.nih.gov/12123620/",
  },
  skillFocusedAttention: {
    label: "Beilock et al. (2002): When paying attention becomes counterproductive (PubMed)",
    url: "https://pubmed.ncbi.nlm.nih.gov/12009178/",
  },
  routinesMeta: {
    label: "Rupprecht, Tran & Gröpel (2021): Pre-performance routines, a meta-analysis",
    url: "https://doi.org/10.1080/1750984X.2021.1944271",
  },
} as const satisfies Record<string, TrainingSource>;
