import { describe, expect, it } from "vitest";
import swc from "@swc/core";
import fs from "fs/promises";
import path from "path";

describe("test", () => {
  it("test", async () => {
    const inputJs = await fs.readFile(
      path.resolve(__dirname, "fixture/input.js"),
      "utf-8"
    );

    const output = await swc.transform(inputJs, {
      // Some options cannot be specified in .swcrc
      filename: "fixture/input.js",
      sourceMaps: true,
      // Input files are treated as module by default.
      isModule: true,

      // All options below can be configured via .swcrc
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: true,
        },
        transform: {},
        experimental: {
          plugins: [
            [
              path.resolve(
                __dirname,
                "../target/wasm32-wasi/release/swc_plugin.wasm"
              ),
              {},
            ],
          ],
        },
      },
    });
    expect(output.code).toMatchSnapshot();
  });
});
