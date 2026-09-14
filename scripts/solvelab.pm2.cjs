module.exports = {
  apps: [
    {
      name: "solvelab",
      script: "./scripts/serve-static.mjs",
      cwd: "/home/bhargavagumpula/Work/solvelab",
      interpreter: "/home/bhargavagumpula/.nvm/versions/node/v20.20.2/bin/node",
      env: {
        PORT: "4173",
        SOLVELAB_CACHE: "1",
      },
    },
  ],
};
