
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle2, Loader, CircleDashed } from "lucide-react";
import { ThoughtStep } from "@/data/schema";
import { cn } from "@/lib/utils";

interface ThoughtProcessProps {
  steps: ThoughtStep[];
}

const statusIcons = {
  pending: <CircleDashed className="h-5 w-5 text-muted-foreground" />,
  in_progress: <Loader className="h-5 w-5 text-primary animate-spin" />,
  completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
};

export const ThoughtProcess = ({ steps }: ThoughtProcessProps) => {
  if (steps.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Thought Process</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {statusIcons[step.status]}
              {index < steps.length - 1 && <div className={cn("w-px h-6 mt-1", step.status === 'completed' ? 'bg-green-500' : 'bg-border')} />}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="font-medium">{step.title}</p>
              {step.details && <p className="text-sm text-muted-foreground">{step.details}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
