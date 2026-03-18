"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

function HomeEditor() {
  const [code, setCode] = useState("");
  const [roastMode, setRoastMode] = useState(true);
  const [isOverLimit, setIsOverLimit] = useState(false);

  const handleCountChange = (count: number, overLimit: boolean) => {
    setIsOverLimit(overLimit);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <CodeEditor
        value={code}
        onChange={setCode}
        onCountChange={handleCountChange}
        maxLength={5000}
        className="w-full max-w-3xl"
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between w-full max-w-3xl">
        <div className="flex items-center gap-4">
          <Toggle
            checked={roastMode}
            onCheckedChange={setRoastMode}
            label="roast mode"
          />
          <span className="font-mono text-xs text-text-tertiary">
            {"// maximum sarcasm enabled"}
          </span>
        </div>

        <Button
          variant="primary"
          size="lg"
          disabled={code.trim().length === 0 || isOverLimit}
        >
          $ roast_my_code
        </Button>
      </div>
    </div>
  );
}

export { HomeEditor };
