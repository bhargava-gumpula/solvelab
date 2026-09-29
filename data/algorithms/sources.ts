/**
 * Where each set's algorithms are published. Every algorithm in the bank is
 * also checked against SolveLab's own cube, so these are credit and further
 * reading, not the reason to trust them.
 */
export interface SetSource {
  label: string;
  url: string;
}

const JPERM = "J Perm";
const CUBESKILLS = "CubeSkills";
const SPEEDCUBEDB = "SpeedCubeDB";
const WIKI = "SpeedSolving wiki";
const FOUR_LOOK = "https://www.cubeskills.com/uploads/pdf/tutorials/4-look-last-layer.pdf";

export const SET_SOURCES: Readonly<Record<string, readonly SetSource[]>> = {
  "two-look-oll": [
    { label: JPERM, url: "https://jperm.net/algs/2lookoll" },
    { label: CUBESKILLS, url: FOUR_LOOK },
    { label: SPEEDCUBEDB, url: "https://speedcubedb.com/a/3x3/2LookOLL" },
    { label: WIKI, url: "https://www.speedsolving.com/wiki/index.php/OCLL" },
  ],
  "two-look-pll": [
    { label: JPERM, url: "https://jperm.net/algs/2lookpll" },
    { label: CUBESKILLS, url: FOUR_LOOK },
    { label: SPEEDCUBEDB, url: "https://speedcubedb.com/a/3x3/2LookPLL" },
    { label: WIKI, url: "https://www.speedsolving.com/wiki/index.php/2-Look_PLL" },
  ],
  f2l: [
    { label: SPEEDCUBEDB, url: "https://speedcubedb.com/a/3x3/F2L" },
    { label: CUBESKILLS, url: "https://www.cubeskills.com/uploads/pdf/tutorials/f2l.pdf" },
    { label: WIKI, url: "https://www.speedsolving.com/wiki/index.php/First_Two_Layers" },
  ],
  pll: [
    { label: JPERM, url: "https://jperm.net/algs/pll" },
    {
      label: CUBESKILLS,
      url: "https://www.cubeskills.com/uploads/pdf/tutorials/pll-algorithms.pdf",
    },
    { label: SPEEDCUBEDB, url: "https://speedcubedb.com/a/3x3/PLL" },
    { label: WIKI, url: "https://www.speedsolving.com/wiki/index.php/PLL" },
  ],
  oll: [
    { label: JPERM, url: "https://jperm.net/algs/oll" },
    {
      label: CUBESKILLS,
      url: "https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf",
    },
    { label: SPEEDCUBEDB, url: "https://speedcubedb.com/a/3x3/OLL" },
    { label: WIKI, url: "https://www.speedsolving.com/wiki/index.php/OLL" },
  ],
  coll: [
    { label: JPERM, url: "https://jperm.net/algs/coll" },
    {
      label: CUBESKILLS,
      url: "https://www.cubeskills.com/uploads/pdf/tutorials/coll-algorithms.pdf",
    },
    { label: SPEEDCUBEDB, url: "https://speedcubedb.com/a/3x3/COLL" },
  ],
  "winter-variation": [
    { label: SPEEDCUBEDB, url: "https://speedcubedb.com/a/3x3/WV" },
    { label: WIKI, url: "https://www.speedsolving.com/wiki/index.php/Winter_Variation" },
  ],
};
