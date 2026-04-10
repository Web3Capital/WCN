/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-cross-module-internals",
      comment: "Modules must not import internal files from other modules. Use ports.ts or index.ts.",
      severity: "error",
      from: { path: "^lib/modules/([^/]+)/" },
      to: {
        path: "^lib/modules/([^/]+)/(?!ports\\.ts$|index\\.ts$|types\\.ts$)",
        pathNot: "^lib/modules/$1/",
      },
    },
    {
      name: "no-circular-modules",
      comment: "Modules must not have circular dependencies.",
      severity: "error",
      from: { path: "^lib/modules/" },
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
