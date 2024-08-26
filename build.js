// build.js
const esbuild = require("esbuild");
const path = require("path");

esbuild
  .build({
    entryPoints: ["./src/index.js"], // Cambia esto a la ubicación de tu archivo principal
    bundle: true,
    platform: "node", // Asegúrate de que es para Node.js
    target: "node14", // Cambia a la versión de Node.js que estás usando
    outfile: "./dist/index.js", // Archivo de salida
    sourcemap: true, // Opcional: Genera un mapa de origen para la depuración
  })
  .catch(() => process.exit(1));
