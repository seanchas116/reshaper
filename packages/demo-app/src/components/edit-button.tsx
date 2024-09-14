"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

export const EditButton = () => {
  const pathname = usePathname();

  if (pathname.startsWith("/edit__")) {
    return null;
  }

  return (
    <Button
      asChild
      className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600"
    >
      <Link
        href={"/edit__?path=" + encodeURIComponent(pathname)}
        target="_blank"
      >
        Edit Page{" "}
      </Link>
    </Button>
  );
};
