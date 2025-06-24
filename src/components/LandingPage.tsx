import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, ShoppingCart, Package, Utensils, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import { TypingAnimation } from '@/components/TypingAnimation';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Add keyframes for card animation
  const slideUpKeyframes = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes borderGlow {
      0% {
        border-color: rgba(249, 115, 22, 0.2);
        box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.1);
      }
      50% {
        border-color: rgba(249, 115, 22, 0.6);
        box-shadow: 0 0 15px 2px rgba(249, 115, 22, 0.3);
      }
      100% {
        border-color: rgba(249, 115, 22, 0.2);
        box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.1);
      }
    }

    .feature-card {
      position: relative;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .feature-card:hover {
      animation: borderGlow 1.5s ease-in-out infinite;
      transform: translateY(-2px);
    }
  `;

  // Insert keyframes into document head
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = slideUpKeyframes;
    if (!document.head.querySelector('style[data-slide-up]')) {
      style.setAttribute('data-slide-up', 'true');
      document.head.appendChild(style);
    }
  }

  const featureTexts = [
    "ChatGPT for your kitchen.",
    "Your personal sous chef that never sleeps.",
    "Turn leftovers into gourmet meals.",
    "Smart shopping lists with Amazon integration.",
    "Track every ingredient you own.",
    "Get meal suggestions based on your inventory.",
    "Reduce food waste with AI intelligence.",
    "Personalized nutrition guidance.",
    "Never wonder 'what's for dinner' again.",
    "Your kitchen's memory and brain.",
    "Meal planning made effortless.",
    "Dietary restrictions? No problem."
  ];

  const handleGetStarted = async () => {
    setIsLoading(true);
    onGetStarted();
  };

  const features = [
    {
      icon: ChefHat,
      title: "Instant Meal Ideas",
      description: "Ask 'What's for dinner?' and get instant, single-meal suggestions from your personal AI chef."
    },
    {
      icon: Package,
      title: "Know Your Inventory",
      description: "Mise tracks every ingredient you own, so you always know what you have before you shop."
    },
    {
      icon: Utensils,
      title: "End Food Waste",
      description: "Unlock the potential of your leftovers with creative ideas that save you money."
    },
    {
      icon: ShoppingCart,
      title: "Shop Smarter",
      description: "Auto-generate shopping lists and instantly check prices on Amazon."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col">
      {/* Header */}
      <header className="w-full p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Logo className="text-2xl" />
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight min-h-[120px] lg:min-h-[160px]">
              <span className="block">Know your kitchen.</span>
              <span className="block text-orange-500">Own your meals.</span>
              <div className="mt-4 text-2xl lg:text-3xl text-gray-700">
                <TypingAnimation 
                  texts={featureTexts}
                  typingSpeed={80}
                  deletingSpeed={40}
                  pauseDuration={3000}
                />
              </div>
            </h1>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
              >
                {isLoading ? 'Getting Started...' : 'Get Started Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                ✓ No credit card required
              </span>
              <span className="flex items-center gap-1">
                ✓ Setup in 2 minutes
              </span>
            </div>
          </div>

          {/* Right Content - Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="feature-card border-orange-100 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{
                  animationDelay: `${index * 150}ms`,
                  opacity: 0,
                  transform: 'translateY(20px)',
                  animation: `slideUp 0.6s ease-out forwards ${index * 150}ms`
                }}
              >
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <feature.icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500 text-sm">
        <div className="max-w-6xl mx-auto">
          © 2025 Mise AI. Empowering kitchens with intelligent nutrition assistance.
        </div>
      </footer>
    </div>
  );
};
