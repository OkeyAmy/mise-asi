import { useState } from 'react';
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
  ArrowUpRight,
  ScanLine,
  ChevronRight,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardProps {
  session: Session | null;
}

const Dashboard = ({ session }: DashboardProps) => {
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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

  const userName = session?.user?.email?.split('@')[0] || 'Macen';

  // Real chat history data - personalized
  const chatHistory = [
    { title: "Ingredients For Making Jollof Rice", icon: "🍚" },
    { title: "What Can I Cook For An Afternoon Meal?", icon: "🍽️" },
    { title: "What Must I Have To Make Amala?", icon: "🥣" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header - Responsive */}
      <header className="flex items-center justify-between p-4 pt-12 sm:p-6 sm:pt-16">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-orange-500/20">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=56&h=56&fit=crop&crop=face" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Notification Dropdown */}
        <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-500 hover:bg-orange-600 transition-all duration-300 shadow-lg"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-gray-800/95 backdrop-blur-xl border-gray-700 text-white shadow-2xl rounded-xl"
          >
            <DropdownMenuItem onClick={handleShoppingList} className="hover:bg-gray-700 rounded-lg m-1">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Shopping List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleInventory} className="hover:bg-gray-700 rounded-lg m-1">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLeftovers} className="hover:bg-gray-700 rounded-lg m-1">
              <Utensils className="w-4 h-4 mr-2" />
              Leftovers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-500/20 text-red-400 rounded-lg m-1">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content - Responsive */}
      <main className="px-4 pb-8 sm:px-6 md:px-8 lg:px-12 max-w-md mx-auto lg:max-w-lg">
        {/* Greeting - Exact match to Figma */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-medium mb-1 text-white/90">Hi, {userName}</h1>
          <h2 className="text-lg sm:text-xl font-normal text-white/90 leading-tight">
            What Would You Love<br />
            To Have <span className="text-orange-400 font-medium">Today</span>
          </h2>
        </div>

        {/* Smart Chat Button - Exact orange styling */}
        <Button
          onClick={handleSmartChat}
          className="w-full h-12 sm:h-14 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl mb-6 sm:mb-8 transition-all duration-300 shadow-lg hover:shadow-xl text-base sm:text-lg"
        >
          Smart Chat
        </Button>

        {/* Action Buttons Row - 4 circular buttons */}
        <div className="flex justify-between items-center mb-6 sm:mb-8 px-2">
          <Button
            onClick={handleAudio}
            variant="ghost"
            size="icon"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-800/60 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 backdrop-blur-sm"
          >
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-800/60 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 backdrop-blur-sm"
          >
            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
          </Button>
          
          <Button
            onClick={handleVideo}
            variant="ghost"
            size="icon"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-800/60 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 backdrop-blur-sm"
          >
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-800/60 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 backdrop-blur-sm"
          >
            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 rotate-180 text-gray-300" />
          </Button>
        </div>

        {/* Feature Tiles - Exact 3 tiles as specified */}
        <div className="space-y-3 mb-8 sm:mb-10">
          <Button
            onClick={handleSmartChat}
            variant="ghost"
            className="w-full h-16 sm:h-18 bg-gray-800/40 border border-gray-700/40 hover:bg-gray-700/40 rounded-xl flex items-center justify-between px-4 transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/60 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
              </div>
              <span className="text-sm sm:text-base text-white/90 font-medium">Begin Smart Chat</span>
            </div>
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
          </Button>

          <Button
            variant="ghost"
            className="w-full h-16 sm:h-18 bg-gray-800/40 border border-gray-700/40 hover:bg-gray-700/40 rounded-xl flex items-center justify-between px-4 transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/60 rounded-xl flex items-center justify-center">
                <ScanLine className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
              </div>
              <span className="text-sm sm:text-base text-white/90 font-medium">Scan Image For AI</span>
            </div>
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
          </Button>

          <Button
            onClick={handleVideo}
            variant="ghost"
            className="w-full h-16 sm:h-18 bg-gray-800/40 border border-gray-700/40 hover:bg-gray-700/40 rounded-xl flex items-center justify-between px-4 transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/60 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
              </div>
              <span className="text-sm sm:text-base text-white/90 font-medium">Video Search On AI</span>
            </div>
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
          </Button>
        </div>

        {/* Chat History - Exact match to Figma */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-medium text-white/90">Chat History</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-400 hover:text-orange-300 text-sm font-medium hover:bg-orange-500/10 rounded-lg px-3 py-1"
            >
              See All
            </Button>
          </div>

          <div className="space-y-3">
            {chatHistory.map((chat, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full h-auto p-4 bg-gray-800/30 border border-gray-700/30 hover:bg-gray-700/30 rounded-xl flex items-center justify-between transition-all duration-300 group"
                onClick={handleSmartChat}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                    <span className="text-lg sm:text-xl">{chat.icon}</span>
                  </div>
                  <span className="text-sm sm:text-base text-left text-white/90 font-medium leading-tight">{chat.title}</span>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-400 transition-colors flex-shrink-0" />
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;