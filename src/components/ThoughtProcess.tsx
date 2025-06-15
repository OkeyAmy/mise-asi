
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { ThoughtStep } from "@/data/schema";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThoughtProcessProps {
  steps: ThoughtStep[];
}

export const ThoughtProcess = ({ steps }: ThoughtProcessProps) => {
  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
          Thought Process
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {step.status === 'active' && (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    )}
                    {step.status === 'pending' && (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-px flex-grow bg-border my-1"></div>
                  )}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <p className={cn(
                      "text-sm font-medium",
                      step.status === 'completed' && "text-green-700",
                      step.status === 'active' && "text-primary",
                      step.status === 'pending' && "text-muted-foreground"
                    )}>
                      {step.step}
                  </p>
                  {step.details && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <pre className="whitespace-pre-wrap font-sans bg-background/50 p-2 rounded-sm overflow-x-auto">{step.details}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
