import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import Dashboard from '@/pages/Dashboard';
import Index from '@/pages/Index';
import AudioChat from '@/pages/AudioChat';
import { LandingPage } from '@/components/LandingPage';
import { useNavigate } from 'react-router-dom';

const AppWrapper = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  // Show loading state while checking auth
  if (isAuthChecking) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!session) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Route logic for authenticated users
  if (location.pathname === '/') {
    return <Dashboard session={session} />;
  } else if (location.pathname === '/audio') {
    return <AudioChat session={session} />;
  } else if (location.pathname === '/chat' || location.pathname === '/video') {
    return <Index />;
  }

  // For other routes, render the Index component (this handles inventory, etc.)
  return <Index />;
};

export default AppWrapper;