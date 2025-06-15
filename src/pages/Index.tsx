
import { useState, useEffect } from 'react';
import { Chatbot } from "@/components/Chatbot";
import { ThoughtProcess } from "@/components/ThoughtProcess";
import { initialMealPlan } from '@/data/mock';
import { MealPlan as MealPlanType, ThoughtStep } from '@/data/schema';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from "lucide-react";

const Index = () => {
  const [mealPlan, setMealPlan] = useState<MealPlanType>(initialMealPlan);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
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
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className={`flex-1 max-w-2xl relative transition-all duration-300`}>
        <div className="absolute top-4 right-4 z-10">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <Chatbot
          plan={mealPlan}
          setPlan={setMealPlan}
          isShoppingListOpen={isShoppingListOpen}
          setIsShoppingListOpen={setIsShoppingListOpen}
          setThoughtSteps={setThoughtSteps}
          session={session}
        />
      </div>
      {/* Collapsible right panel */}
      <div className={`relative transition-all duration-300 ${isRightPanelOpen ? 'w-96' : 'w-7'} border-l p-0 flex flex-col items-stretch`}>
        <button
          aria-label={isRightPanelOpen ? "Collapse panel" : "Expand panel"}
          onClick={() => setIsRightPanelOpen((prev) => !prev)}
          className={`absolute top-4 left-[-18px] z-20
            bg-muted border rounded-full p-1 shadow-sm transition-all duration-300
            hover:bg-muted-foreground/20`}
          style={{ width: 32, height: 32 }}
        >
          {isRightPanelOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        <div
          className={`h-full transition-all duration-300 ease-in-out
            bg-background
            ${isRightPanelOpen ? 'opacity-100 p-4' : 'opacity-0 pointer-events-none p-0'}
            `}
        >
          {isRightPanelOpen && <ThoughtProcess steps={thoughtSteps} />}
        </div>
      </div>
    </div>
  );
};

export default Index;

