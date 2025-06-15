import { useState, useEffect } from 'react';
import { Chatbot } from "@/components/Chatbot";
import { ThoughtProcess } from "@/components/ThoughtProcess";
import { Header } from "@/components/Header";
import { initialMealPlan } from '@/data/mock';
import { MealPlan as MealPlanType, ThoughtStep } from '@/data/schema';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Onboarding } from '@/components/Onboarding';

const Index = () => {
  const [mealPlan, setMealPlan] = useState<MealPlanType>(initialMealPlan);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [isLeftoversOpen, setIsLeftoversOpen] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // On small screens (lg breakpoint is 1024px), default the panel to closed.
    if (window.innerWidth < 1024) {
      setIsRightPanelOpen(false);
    }
  }, []);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (onboardingCompleted !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

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
      <Onboarding isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      <Header onShoppingListOpen={() => setIsShoppingListOpen(true)} onLeftoversOpen={() => setIsLeftoversOpen(true)} />
      
      <div className="flex flex-1 pt-20 relative overflow-hidden">
        {/* Main chat area - better proportions for desktop */}
        <div className={`flex-1 transition-all duration-300 ${isRightPanelOpen ? 'lg:max-w-[calc(100%-320px)]' : 'w-full'}`}>
          <Chatbot
            plan={mealPlan}
            setPlan={setMealPlan}
            isShoppingListOpen={isShoppingListOpen}
            setIsShoppingListOpen={setIsShoppingListOpen}
            isLeftoversOpen={isLeftoversOpen}
            setIsLeftoversOpen={setIsLeftoversOpen}
            setThoughtSteps={setThoughtSteps}
            session={session}
            thoughtSteps={thoughtSteps}
          />
        </div>
        
        {/* Desktop sidebar - optimized width */}
        <div className={`hidden lg:flex relative transition-all duration-300 ${isRightPanelOpen ? 'w-80' : 'w-7'} border-l flex-col min-h-0`}>
          <button
            aria-label={isRightPanelOpen ? "Collapse panel" : "Expand panel"}
            onClick={() => setIsRightPanelOpen((prev) => !prev)}
            className="absolute top-4 left-[-18px] z-50 bg-primary text-primary-foreground border border-border rounded-full shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl w-8 h-8 flex items-center justify-center"
          >
            {isRightPanelOpen ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
          <div className={`h-full transition-all duration-300 ease-in-out bg-background overflow-hidden min-h-0 ${isRightPanelOpen ? 'opacity-100 p-4' : 'opacity-0 pointer-events-none p-0'}`}>
            {isRightPanelOpen && <ThoughtProcess steps={thoughtSteps} />}
          </div>
        </div>

        {/* Mobile overlay panel */}
        <div className={`lg:hidden fixed inset-y-0 right-0 z-40 w-80 bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ top: '80px' }}>
          <div className="h-full p-4 overflow-hidden min-h-0 flex flex-col">
            <ThoughtProcess steps={thoughtSteps} />
          </div>
        </div>

        {/* Mobile toggle button */}
        <button
          aria-label={isRightPanelOpen ? "Collapse panel" : "Expand panel"}
          onClick={() => setIsRightPanelOpen((prev) => !prev)}
          className="lg:hidden fixed top-24 right-4 z-50 bg-primary text-primary-foreground border border-border rounded-full shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl w-10 h-10 flex items-center justify-center"
        >
          {isRightPanelOpen ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        {/* Mobile backdrop */}
        {isRightPanelOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/20 z-30"
            style={{ top: '80px' }}
            onClick={() => setIsRightPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
