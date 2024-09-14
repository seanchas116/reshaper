"use client";

import { Outline } from "./outline";
import { Inspector } from "./inspector";
import { Viewport } from "./viewport";
import { NavBar } from "./nav-bar";

export const EditorBody = () => {
  return (
    <div className="fixed inset-0 grid h-screen w-screen grid-rows-[auto_1fr] text-black">
      <NavBar />
      <div className="grid grid-cols-[auto_1fr_auto]">
        <Outline />
        <Viewport />
        <Inspector />
      </div>
    </div>
  );
};
