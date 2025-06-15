
import { useState, useEffect } from 'react';
import { Chatbot } from "@/components/Chatbot";
import { ThoughtProcess } from "@/components/ThoughtProcess";
import { initialMealPlan } from '@/data/mock';
import { MealPlan as MealPlanType, ThoughtStep } from '@/data/schema';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [mealPlan, setMealPlan] = useState<MealPlanType>(initialMealPlan);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      } else {
        navigate('/auth');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  if (!session) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className="flex-1 max-w-2xl relative">
         <div className="absolute top-4 right-4 z-10">
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        <Chatbot 
          plan={mealPlan} 
          setPlan={setMealPlan} 
          isShoppingListOpen={isShoppingListOpen}
          setIsShoppingListOpen={setIsShoppingListOpen}
          setThoughtSteps={setThoughtSteps}
        />
      </div>
      <div className="w-96 border-l p-4">
        <ThoughtProcess steps={thoughtSteps} />
      </div>
    </div>
  );
};

export default Index;

