
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { ThoughtStep } from "@/data/schema";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ThoughtProcessProps {
  steps: ThoughtStep[];
}

export const ThoughtProcess = ({ steps }: ThoughtProcessProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
          Thought Process
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-120px)] p-6">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {steps.map((step) => (
              <AccordionItem value={step.id} key={step.id} className="border-b-0 bg-secondary/30 rounded-md">
                <AccordionTrigger
                  disabled={!step.details}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-md transition-colors hover:no-underline",
                    "hover:bg-muted/50 data-[state=open]:bg-muted/60",
                     !step.details && "cursor-default"
                  )}
                >
                  <div className="mt-1">
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
                  <p className={cn(
                      "text-sm font-medium text-left flex-1",
                      step.status === 'completed' && "text-green-700",
                      step.status === 'active' && "text-primary",
                      step.status === 'pending' && "text-muted-foreground"
                    )}>
                      {step.step}
                  </p>
                </AccordionTrigger>
                {step.details && (
                  <AccordionContent className="p-3 pt-0 pl-12 text-xs text-muted-foreground">
                    <pre className="whitespace-pre-wrap font-sans bg-background/50 p-2 rounded-sm">{step.details}</pre>
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
