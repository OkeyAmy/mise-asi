
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeftoverItem } from "@/data/schema";
import { Trash2, Minus, Plus } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface LeftoversDialogProps {
  items: LeftoverItem[];
  isLoading: boolean;
  onRemove: (id: string) => void;
  onUpdateServings: (id: string, servings: number) => void;
}

export const LeftoversDialog = ({ items, isLoading, onRemove, onUpdateServings }: LeftoversDialogProps) => {

  const handleServingsChange = (id: string, currentServings: number, change: number) => {
    const newServings = currentServings + change;
    if (newServings >= 0) {
      onUpdateServings(id, newServings);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Leftovers</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading leftovers...</p>
        ) : items.length === 0 ? (
          <p>You have no leftovers. Good job!</p>
        ) : (
          <ScrollArea className="h-72">
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-semibold">{item.meal_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(item.date_created).toLocaleDateString()}
                    </p>
                    {item.notes && <p className="text-xs text-muted-foreground italic">Notes: {item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleServingsChange(item.id, item.servings, -1)} disabled={item.servings <= 0}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-mono w-8 text-center">{item.servings}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleServingsChange(item.id, item.servings, 1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="text-destructive h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
