"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CodeEditor } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useTRPC } from "@/trpc/client";

function HomeEditor() {
  const [code, setCode] = useState("");
  const [roastMode, setRoastMode] = useState(true);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();

  const handleCountChange = (_count: number, overLimit: boolean) => {
    setIsOverLimit(overLimit);
  };

  const createRoastMutation = useMutation(
    trpc.roast.createRoast.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
      onError: (error) => {
        console.error("Failed to create roast:", error);
        alert("Failed to analyze code. Please try again.");
      },
    }),
  );

  const handleSubmit = () => {
    createRoastMutation.mutate({
      code,
      language: "javascript", // hardcoded: language auto-detection is out of scope (see spec)
      roastMode,
    });
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <CodeEditor
        value={code}
        onChange={setCode}
        onCountChange={handleCountChange}
        maxLength={100000}
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
          disabled={
            code.trim().length === 0 ||
            isOverLimit ||
            createRoastMutation.isPending
          }
          onClick={handleSubmit}
        >
          {createRoastMutation.isPending ? "$ analyzing..." : "$ roast_my_code"}
        </Button>
      </div>
    </div>
  );
}

export { HomeEditor };
