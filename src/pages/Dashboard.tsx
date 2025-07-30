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
  ArrowUpRight,
  ScanLine,
  ChevronRight
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

  // Mock chat history data
  const chatHistory = [
    { title: "Ingredients For Making Jollof Rice", icon: "🍚" },
    { title: "What Can I Cook For An Afternoon Meal?", icon: "🍽️" },
    { title: "What Must I Have To Make Amala?", icon: "🥣" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-12">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face" 
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
              className="relative w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              <Bell className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-gray-800 border-gray-700 text-white"
          >
            <DropdownMenuItem onClick={handleShoppingList} className="hover:bg-gray-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Shopping List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleInventory} className="hover:bg-gray-700">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLeftovers} className="hover:bg-gray-700">
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
      <main className="px-4 pb-8">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-medium mb-1">Hi, {userName}</h1>
          <h2 className="text-lg text-white/90">
            What Would You Love<br />
            To Have <span className="text-orange-400">Today</span>
          </h2>
        </div>

        {/* Smart Chat Button */}
        <Button
          onClick={handleSmartChat}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl mb-6 transition-colors"
        >
          Smart Chat
        </Button>

        {/* Action Buttons Row */}
        <div className="flex justify-between mb-6">
          <Button
            onClick={handleAudio}
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 transition-colors"
          >
            <Mic className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 transition-colors"
          >
            <ArrowUpRight className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={handleVideo}
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 transition-colors"
          >
            <Video className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 transition-colors"
          >
            <ArrowUpRight className="w-6 h-6 rotate-180" />
          </Button>
        </div>

        {/* Feature Tiles */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button
            onClick={handleSmartChat}
            variant="ghost"
            className="h-20 bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-sm text-center leading-tight">Begin Smart<br />Chat</span>
          </Button>

          <Button
            variant="ghost"
            className="h-20 bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors"
          >
            <ScanLine className="w-6 h-6" />
            <span className="text-sm text-center leading-tight">Scan Image<br />For AI</span>
          </Button>
        </div>

        {/* Chat History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Chat History</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-400 hover:text-orange-300 text-sm"
            >
              See All
            </Button>
          </div>

          <div className="space-y-3">
            {chatHistory.map((chat, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full h-auto p-4 bg-gray-800/30 border border-gray-700/50 hover:bg-gray-700/30 rounded-xl flex items-center justify-between transition-colors"
                onClick={handleSmartChat}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">{chat.icon}</span>
                  </div>
                  <span className="text-sm text-left text-white/90">{chat.title}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;