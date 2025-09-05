"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface TranslationProgressProps {
  chain: ChainItem[];
  currentStep: number;
  isTranslating: boolean;
}

export function TranslationProgress({
  chain,
  currentStep,
  isTranslating,
}: TranslationProgressProps) {
  if (!isTranslating && currentStep === 0) {
    return null;
  }

  const progress = chain.length > 0 ? (currentStep / chain.length) * 100 : 0;

  return (
    <div className="space-y-3 p-4 w-full bg-muted/50 rounded-lg border animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Translation Progress</span>
        <span className="text-xs text-muted-foreground">
          {currentStep}/{chain.length} steps
        </span>
      </div>

      <Progress
        value={progress}
        className="h-3 transition-all duration-500 ease-out"
      />

      <div className="space-y-2 max-w-full p-6 max-h-40 overflow-y-auto">
        {chain.map((item, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep && isTranslating;
          const isPending = index > currentStep;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                isCurrent ? "scale-105 bg-primary/5 rounded p-1" : ""
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-500 animate-in zoom-in-50 duration-300" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}

              <span
                className={`flex-1 transition-all duration-200 ${
                  isCurrent
                    ? "font-medium text-primary"
                    : isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {item.language.name} ({item.language.code})
              </span>

              <Badge
                variant="outline"
                className={`text-xs transition-all duration-200 ${
                  isCurrent ? "border-primary text-primary" : ""
                }`}
              >
                {item.engine === "google" ? "Google" : "Microsoft"}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
