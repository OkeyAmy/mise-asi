
import { useState, useEffect } from 'react';
import { Chatbot } from "@/components/Chatbot";
import { ThoughtProcess } from "@/components/ThoughtProcess";
import { Header } from "@/components/Header";
import { initialMealPlan } from '@/data/mock';
import { MealPlan as MealPlanType, ThoughtStep } from '@/data/schema';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

const Index = () => {
  const [mealPlan, setMealPlan] = useState<MealPlanType>(initialMealPlan);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // On small screens (lg breakpoint is 1024px), default the panel to closed.
    if (window.innerWidth < 1024) {
      setIsRightPanelOpen(false);
    }
  }, []);

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
  
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header onShoppingListOpen={() => setIsShoppingListOpen(true)} />
      
      <div className="flex flex-col lg:flex-row flex-1 pt-20">
        <div className={`flex-1 w-full lg:max-w-2xl relative transition-all duration-300`}>
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
        <div className={`relative transition-all duration-300 ${isRightPanelOpen ? 'h-[50vh] lg:h-auto w-full lg:w-96' : 'h-0 lg:h-auto w-full lg:w-7'} border-t lg:border-t-0 lg:border-l p-0 flex flex-col items-stretch`}>
          <button
            aria-label={isRightPanelOpen ? "Collapse panel" : "Expand panel"}
            onClick={() => setIsRightPanelOpen((prev) => !prev)}
            className={`absolute top-4 z-20
              bg-muted border rounded-full p-1 shadow-sm transition-all duration-300
              hover:bg-muted-foreground/20 lg:left-[-18px] right-4 lg:right-auto`}
            style={{ width: 32, height: 32 }}
          >
            {isRightPanelOpen ? (
              <>
                <ChevronRight className="w-5 h-5 hidden lg:block" />
                <ChevronDown className="w-5 h-5 lg:hidden" />
              </>
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 hidden lg:block" />
                <ChevronUp className="w-5 h-5 lg:hidden" />
              </>
            )}
          </button>
          <div
            className={`h-full transition-all duration-300 ease-in-out
              bg-background overflow-hidden
              ${isRightPanelOpen ? 'opacity-100 p-4' : 'opacity-0 pointer-events-none p-0'}
              `}
          >
            {isRightPanelOpen && <ThoughtProcess steps={thoughtSteps} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
