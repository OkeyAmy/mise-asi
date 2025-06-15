
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { MessageSquare, List, Utensils, PartyPopper } from "lucide-react";

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

const onboardingSteps = [
    {
        icon: MessageSquare,
        title: "Chat to Manage",
        description: "Use the chat to add items to your inventory, create meal plans, and more. Just type what you need!",
    },
    {
        icon: List,
        title: "Your Digital Pantry",
        description: "Navigate to the Inventory page to see all your items, check expiry dates, and manage quantities.",
    },
    {
        icon: Utensils,
        title: "Plan Your Meals",
        description: "Ask Mise to create a meal plan for you based on your inventory and preferences.",
    },
    {
        icon: PartyPopper,
        title: "You're all set!",
        description: "Start chatting with Mise to organize your kitchen.",
    },
];

export function Onboarding({ isOpen, onClose }: OnboardingProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }
 
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  const isLastStep = current === count && count > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0">
        <Carousel setApi={setApi} className="w-full pt-8">
          <CarouselContent>
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <CarouselItem key={index}>
                    <div className="text-center px-8 pb-16">
                        <div className="flex justify-center items-center mb-6">
                            <div className="bg-primary/10 p-4 rounded-full">
                                <Icon className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                    </div>
                </CarouselItem>
            )})}
          </CarouselContent>
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center space-x-4">
                <CarouselPrevious className="static -translate-y-0" />
                <div className="text-center text-sm text-muted-foreground tabular-nums">
                   {current} / {count}
                </div>
                <CarouselNext className="static -translate-y-0" />
            </div>
        </Carousel>
        <DialogFooter className="px-6 pb-6 pt-0">
          <Button onClick={onClose} className="w-full">
            {isLastStep ? "Get Started" : "Skip Onboarding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
