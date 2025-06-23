
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, ShoppingCart, Package, Utensils, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    setIsLoading(true);
    onGetStarted();
  };

  const features = [
    {
      icon: ChefHat,
      title: "AI Meal Planning",
      description: "Get personalized meal suggestions based on your preferences and available ingredients"
    },
    {
      icon: Package,
      title: "Smart Inventory",
      description: "Track your kitchen inventory and get alerts before items expire"
    },
    {
      icon: Utensils,
      title: "Leftover Optimization",
      description: "Transform your leftovers into delicious new meals with AI suggestions"
    },
    {
      icon: ShoppingCart,
      title: "Intelligent Shopping Lists",
      description: "Generate shopping lists based on your meal plans and current inventory"
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
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Know your kitchen.
                <span className="text-orange-500"> Own your meals.</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your AI-powered nutrition assistant for smart meal planning, inventory management, and reducing food waste.
              </p>
            </div>

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
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3 text-lg border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Watch Demo
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
              <Card key={index} className="border-orange-100 hover:shadow-lg transition-shadow duration-300">
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
          © 2024 Mise AI. Empowering kitchens with intelligent meal planning.
        </div>
      </footer>
    </div>
  );
};
