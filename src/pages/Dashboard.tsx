import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Video, 
  Mic, 
  ShoppingCart, 
  Package, 
  Utensils, 
  LogOut,
  Bell,
  ChevronDown,
  History,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatHistory } from '@/hooks/useChatHistory';
import { Message } from '@/data/schema';

interface DashboardProps {
  session: Session | null;
}

const Dashboard = ({ session }: DashboardProps) => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const chatHistory = useChatHistory(session);
  const conversations = []; // Mock data for now, will be replaced with actual data

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSmartChat = () => {
    navigate('/chat');
  };

  const handleVideo = () => {
    navigate('/video');
  };

  const handleAudio = () => {
    navigate('/audio');
  };

  const handleShoppingList = () => {
    navigate('/shopping-list');
  };

  const handleInventory = () => {
    navigate('/inventory');
  };

  const handleLeftovers = () => {
    navigate('/leftovers');
  };

  const userName = session?.user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Liquid Glass Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-600/15 to-amber-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-400/10 to-amber-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-semibold">Mise AI</span>
        </div>

        {/* Notification Dropdown with Liquid Glass Effect */}
        <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="liquid-glass-button relative overflow-hidden backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <Bell className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="liquid-glass-menu backdrop-blur-xl bg-gray-900/80 border-gray-700/50 text-white w-48"
          >
            <DropdownMenuItem onClick={handleShoppingList} className="hover:bg-white/10">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Shopping List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleInventory} className="hover:bg-white/10">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLeftovers} className="hover:bg-white/10">
              <Utensils className="w-4 h-4 mr-2" />
              Leftovers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-500/20 text-red-400">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-6">
        {/* Greeting Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {userName}
          </h1>
          <p className="text-lg text-gray-300">
            What Would You Love To Have Today
          </p>
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Smart Chat Button */}
          <Button
            onClick={handleSmartChat}
            className="liquid-glass-card h-32 backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/20 hover:from-orange-500/30 hover:to-amber-500/30 transition-all duration-300 rounded-2xl flex flex-col items-center justify-center space-y-3 text-white hover:text-white group"
          >
            <MessageSquare className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-semibold text-lg">Smart Chat</span>
          </Button>

          {/* Video Button */}
          <Button
            onClick={handleVideo}
            className="liquid-glass-card h-32 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-2xl flex flex-col items-center justify-center space-y-3 text-white hover:text-white group"
          >
            <Video className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-semibold text-lg">Video</span>
          </Button>

          {/* Audio Button */}
          <Button
            onClick={handleAudio}
            className="liquid-glass-card h-32 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-2xl flex flex-col items-center justify-center space-y-3 text-white hover:text-white group"
          >
            <Mic className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-semibold text-lg">Audio</span>
          </Button>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={handleSmartChat}
            className="liquid-glass-card h-24 backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 rounded-xl flex flex-col items-center justify-center space-y-2 text-white hover:text-white"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-sm">Begin Smart Chat</span>
          </Button>

          <Button
            onClick={() => navigate('/scan')}
            className="liquid-glass-card h-24 backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 rounded-xl flex flex-col items-center justify-center space-y-2 text-white hover:text-white"
          >
            <div className="w-6 h-6 border-2 border-current rounded"></div>
            <span className="text-sm">Scan Image For AI</span>
          </Button>

          <Button
            onClick={handleVideo}
            className="liquid-glass-card h-24 backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 rounded-xl flex flex-col items-center justify-center space-y-2 text-white hover:text-white"
          >
            <Video className="w-6 h-6" />
            <span className="text-sm">Video Chat</span>
          </Button>

          <Button
            onClick={handleAudio}
            className="liquid-glass-card h-24 backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 rounded-xl flex flex-col items-center justify-center space-y-2 text-white hover:text-white"
          >
            <Mic className="w-6 h-6" />
            <span className="text-sm">Voice Chat</span>
          </Button>
        </div>

        {/* Chat History Section */}
        <div className="liquid-glass-section backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <History className="w-5 h-5 mr-2" />
              Chat History
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-400 hover:text-orange-300 hover:bg-white/10"
              onClick={() => navigate('/chat-history')}
            >
              See All
            </Button>
          </div>

          <div className="space-y-3">
            {conversations.length > 0 ? (
              conversations.slice(0, 3).map((conversation, index) => (
                <div 
                  key={index}
                  className="liquid-glass-item backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/chat?conversation=${conversation.id}`)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-orange-300 transition-colors duration-300 truncate">
                        {conversation.title || 'New Conversation'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg] group-hover:text-orange-300 transition-colors duration-300" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start your first chat to see history here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;