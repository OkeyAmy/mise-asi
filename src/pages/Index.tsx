
import { useState } from 'react';
import { Chatbot } from "@/components/Chatbot";
import { ThoughtProcess } from "@/components/ThoughtProcess";
import { initialMealPlan } from '@/data/mock';
import { MealPlan as MealPlanType, ThoughtStep } from '@/data/schema';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

const Index = () => {
  const [mealPlan, setMealPlan] = useState<MealPlanType>(initialMealPlan);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <Sidebar className="w-full max-w-2xl" collapsible="offcanvas">
          <Chatbot 
            plan={mealPlan} 
            setPlan={setMealPlan} 
            isShoppingListOpen={isShoppingListOpen}
            setIsShoppingListOpen={setIsShoppingListOpen}
            thoughtSteps={thoughtSteps}
            setThoughtSteps={setThoughtSteps}
          />
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex items-center p-2 border-b border-l">
            <SidebarTrigger />
          </header>
          <main className="flex-1">
            <div className="w-96 p-4">
              <ThoughtProcess steps={thoughtSteps} />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
