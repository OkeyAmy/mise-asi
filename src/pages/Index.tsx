
import { useState } from 'react';
import { Chatbot } from "@/components/Chatbot";
import { MealPlan } from "@/components/MealPlan";
import { initialMealPlan } from '@/data/mock';
import { MealPlan as MealPlanType } from '@/data/schema';
import { Button } from '@/components/ui/button';
import { BotMessageSquare, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Index = () => {
  const [mealPlan, setMealPlan] = useState<MealPlanType>(initialMealPlan);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:hidden">
         <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <BotMessageSquare className="h-6 w-6" />
                    <span>NutriMate</span>
                </div>
                <a href="#" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">Meal Plan</a>
                <a href="#" className="flex items-center gap-4 px-2.5 text-foreground">Goals</a>
                <a href="#" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">Pantry</a>
              </nav>
            </SheetContent>
          </Sheet>
      </header>
      <div className="flex">
        <aside className="hidden lg:block w-64 border-r p-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary mb-8">
                <BotMessageSquare className="h-6 w-6" />
                <span>NutriMate</span>
            </div>
            <nav className="grid gap-4 text-sm font-medium">
                <a href="#" className="flex items-center gap-3 rounded-lg bg-primary text-primary-foreground px-3 py-2 transition-all">Meal Plan</a>
                <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Goals</a>
                <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Pantry</a>
                <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Settings</a>
            </nav>
        </aside>
        <main className="flex-1">
          <MealPlan plan={mealPlan} />
        </main>
      </div>
      <Chatbot plan={mealPlan}/>
    </div>
  );
};

export default Index;
