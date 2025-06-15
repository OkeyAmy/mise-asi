
import { useState } from 'react';
import { Chatbot } from "@/components/Chatbot";
import { ThoughtProcess } from "@/components/ThoughtProcess";
import { initialMealPlan } from '@/data/mock';
import { MealPlan as MealPlanType, ThoughtStep } from '@/data/schema';

const Index = () => {
  const [mealPlan, setMealPlan] = useState<MealPlanType>(initialMealPlan);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [inventory, setInventory] = useState<string[]>(['Eggs', 'Bread', 'Milk']);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className="flex-1 max-w-2xl">
        <Chatbot 
          plan={mealPlan} 
          setPlan={setMealPlan} 
          isShoppingListOpen={isShoppingListOpen}
          setIsShoppingListOpen={setIsShoppingListOpen}
          setThoughtSteps={setThoughtSteps}
          inventory={inventory}
          setInventory={setInventory}
        />
      </div>
      <div className="w-96 border-l p-4">
        <ThoughtProcess steps={thoughtSteps} />
      </div>
    </div>
  );
};

export default Index;
