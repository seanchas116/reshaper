"use server";
import fs from "fs/promises";

export async function loadFile(filePath: string) {
  return fs.readFile(filePath, "utf-8");
}

export async function saveFile(filePath: string, content: string) {
  return fs.writeFile(filePath, content, "utf-8");
}
