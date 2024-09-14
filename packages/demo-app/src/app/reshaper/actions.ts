"use server";
import fs from "fs/promises";

export async function loadFile(filePath: string) {
  return fs.readFile(filePath, "utf-8");
}
