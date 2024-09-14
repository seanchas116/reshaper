"use client";

import { useSearchParams } from "next/navigation";
import { Editor } from "@/reshaper/editor";

const Page = () => {
  const searchParams = useSearchParams();
  return <Editor path={searchParams.get("path") ?? "/"} />;
};

export default Page;
