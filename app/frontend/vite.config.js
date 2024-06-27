import { defineConfig } from 'vite';
import * as fs from "fs";


const config = JSON.parse(fs.readFileSync("tsconfig.json"));

let aliases = {};
for (const [k, v] of Object.entries(config.compilerOptions.paths)) {
  aliases[k.substring(0, k.length-2)] = v[0].substring(1, v[0].length-2);
}

export default defineConfig((cmd, mode) => {
  return {
    build: {
      minify: mode === "production",
      rollupOptions: {
        // ignore warning which doesn't matter
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("@tanstack/react-query")) {
            return;
          }
          warn(warning);
        }
      }
    },
    base: "/static",
    resolve: {
      alias: aliases
    }
  };
});
