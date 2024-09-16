"use server";
import fs from "fs/promises";
import * as prettier from "prettier";

export async function formatCode(code: string) {
  return prettier.format(code, {
    parser: "typescript",
  });
}

export async function loadFile(filePath: string) {
  return fs.readFile(filePath, "utf-8");
}

export async function saveFile(filePath: string, content: string) {
  return fs.writeFile(filePath, await formatCode(content), "utf-8");
}
