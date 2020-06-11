import { rollup } from "rollup";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
// @ts-ignore
import virtual from "@rollup/plugin-virtual";
import fs from "fs/promises";
import path from "path";

type BundleInfo = {
  path?: string;
  type: "esm" | "cjs";
};

import pkg from "./package.json";

const plugins = [commonjs(), nodeResolve()];

async function main() {
  await fs.mkdir(path.join(`denode_modules`), {}).catch((err) => {});
  const importMap: { imports: { [k: string]: string } } = { imports: {} };
  await Promise.all(
    Object.entries(pkg.denode as { [k: string]: BundleInfo }).map(
      async ([target, opts]) => {
        let code: string = "";
        if (opts.type === "cjs") {
          const resolved = require.resolve(target);
          code = `import {__moduleExports} from "${resolved}";\nexport {__moduleExports as default };`;
        } else if (opts.type === "esm") {
          code = `export * from "${path.join(target, opts.path || "")}"`;
        }
        const built = await (
          await rollup({
            input: `__input__.js`,
            plugins: [
              ...plugins,
              virtual({
                "__input__.js": code,
              }),
            ],
          })
        ).generate({
          format: "esm",
          file: `dist/${target}.js`,
        });

        const outpath = path.join(`denode_modules`, target + ".js");
        await fs.mkdir(path.dirname(outpath), {}).catch((err) => {});
        await fs.writeFile(outpath, built.output[0].code);
        importMap.imports[target] =
          "./" + path.relative(process.cwd(), outpath);
        console.log(
          "[gen]",
          target,
          "=>",
          "./" + outpath,
          Math.floor(built.output[0].code.length / 1000) + "kb"
        );
      }
    )
  );
  await fs.writeFile(
    path.join(process.cwd(), "importmap.json"),
    JSON.stringify(importMap, null, 2)
  );
}

main();
