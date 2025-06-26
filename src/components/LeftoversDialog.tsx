
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeftoverItem } from "@/data/schema";
import { Trash2, Minus, Plus } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import * as React from "react";
import { useToast } from "@/hooks/use-toast";

interface LeftoversDialogProps {
  items: LeftoverItem[];
  isLoading: boolean;
  onRemove: (id: string) => void;
  onUpdateServings: (id: string, servings: number) => void;
  onAdd?: (leftover: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

export const LeftoversDialog = ({ items, isLoading, onRemove, onUpdateServings, onAdd }: LeftoversDialogProps) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newLeftover, setNewLeftover] = React.useState<{
    meal_name: string;
    servings: number;
    date_created: string;
    notes: string;
  }>({
    meal_name: "",
    servings: 1,
    date_created: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    notes: ""
  });

  const { toast } = useToast();

  const handleServingsChange = (id: string, currentServings: number, change: number) => {
    const newServings = currentServings + change;
    if (newServings >= 0) {
      onUpdateServings(id, newServings);
    }
  };

  const handleAddLeftover = () => {
    if (newLeftover.meal_name.trim() && onAdd) {
      onAdd({
        meal_name: newLeftover.meal_name.trim(),
        servings: newLeftover.servings,
        date_created: newLeftover.date_created,
        notes: newLeftover.notes.trim() || null
      });
      setNewLeftover({
        meal_name: "",
        servings: 1,
        date_created: new Date().toISOString().split('T')[0],
        notes: ""
      });
      setShowAddForm(false);
      toast({
        title: "Leftover added",
        description: `${newLeftover.meal_name} has been added to your leftovers.`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Leftovers</CardTitle>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Leftover
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-3">
              <Input
                placeholder="Meal name"
                value={newLeftover.meal_name}
                onChange={(e) => setNewLeftover(prev => ({ ...prev, meal_name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Servings"
                  value={newLeftover.servings}
                  onChange={(e) => setNewLeftover(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
                <Input
                  type="date"
                  value={newLeftover.date_created}
                  onChange={(e) => setNewLeftover(prev => ({ ...prev, date_created: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Notes (optional)"
                value={newLeftover.notes}
                onChange={(e) => setNewLeftover(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={handleAddLeftover} size="sm" disabled={!newLeftover.meal_name.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button onClick={() => setShowAddForm(false)} size="sm" variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

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
