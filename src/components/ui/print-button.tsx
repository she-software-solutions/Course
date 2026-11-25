"use client";

import { Download } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("primary")}>
      <Download className="h-4 w-4" /> {label}
    </button>
  );
}
