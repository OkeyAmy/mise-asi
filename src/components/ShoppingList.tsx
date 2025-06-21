
import { useState } from "react";
import { Check, Minus, Plus, Share2, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";
import { ShareShoppingListDialog } from "./ShareShoppingListDialog";

interface ShoppingListProps {
  items: ShoppingListItem[];
  onRemove: (itemName: string) => void;
  onUpdate: (itemName: string, updates: Partial<ShoppingListItem>) => void;
  session: Session | null;
}

export function ShoppingList({ items, onRemove, onUpdate, session }: ShoppingListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ item: string; quantity: number; unit: string }>({
    item: "",
    quantity: 0,
    unit: "",
  });
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const startEdit = (item: ShoppingListItem) => {
    setEditingId(item.id);
    setEditValues({
      item: item.item,
      quantity: item.quantity,
      unit: item.unit,
    });
  };

  const saveEdit = () => {
    if (editingId) {
      const currentItem = items.find(i => i.id === editingId);
      if (currentItem) {
        onUpdate(currentItem.item, editValues);
      }
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const updateQuantity = (item: ShoppingListItem, delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    onUpdate(item.item, { quantity: newQuantity });
  };

  const toggleComplete = (item: ShoppingListItem) => {
    onUpdate(item.item, { completed: !item.completed });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Your shopping list is empty.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Ask the AI to add items or create a meal plan to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Shopping List ({items.length} item{items.length !== 1 ? 's' : ''})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsShareDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              item.completed ? "bg-muted/50" : "bg-background"
            }`}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleComplete(item)}
              className={`h-6 w-6 p-0 rounded-full border-2 ${
                item.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-muted-foreground/30"
              }`}
            >
              {item.completed && <Check className="h-3 w-3" />}
            </Button>

            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editValues.item}
                    onChange={(e) => setEditValues({ ...editValues, item: e.target.value })}
                    className="flex-1"
                    placeholder="Item name"
                  />
                  <Input
                    type="number"
                    value={editValues.quantity}
                    onChange={(e) => setEditValues({ ...editValues, quantity: Number(e.target.value) })}
                    className="w-20"
                    min="0"
                  />
                  <Input
                    value={editValues.unit}
                    onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                    className="w-20"
                    placeholder="Unit"
                  />
                  <Button size="sm" onClick={saveEdit}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`cursor-pointer ${item.completed ? "line-through text-muted-foreground" : ""}`}
                  onClick={() => startEdit(item)}
                >
                  <span className="font-medium">{item.item}</span>
                  <span className="text-muted-foreground ml-2">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              )}
            </div>

            {editingId !== item.id && (
              <>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item, -1)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item, 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item.item)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <ShareShoppingListDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        items={items}
        session={session}
      />
    </div>
  );
}
