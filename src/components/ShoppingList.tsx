
import * as React from "react";
import { ShoppingListItem } from "@/data/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface ShoppingListProps {
  items: ShoppingListItem[];
  onRemove: (item: string) => void;
  isLoading?: boolean;
}

export const ShoppingList = ({ items, onRemove, isLoading }: ShoppingListProps) => {
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set());
  const [itemToRemove, setItemToRemove] = React.useState<ShoppingListItem | null>(null);

  const handleCheckedChange = (checked: boolean, item: ShoppingListItem) => {
    if (checked) {
      setItemToRemove(item);
    }
  };

  const handleRemoveConfirm = () => {
    if (itemToRemove) {
      // Add to checked items for instant UI feedback
      setCheckedItems(prev => new Set(prev).add(itemToRemove.item));
      onRemove(itemToRemove.item);
      setItemToRemove(null); // Close dialog
    }
  };

  const handleRemoveCancel = () => {
    setItemToRemove(null); // Close dialog
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Smart Shopping List</CardTitle>
          <CardDescription>
            Only items you need for your meal plan are listed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {(isLoading ? <div>Loading...</div> : null)}
            {items.map((item) => (
              <div
                key={`${item.item}-${item.unit}`}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    id={`${item.item}-${item.unit}`}
                    checked={checkedItems.has(item.item) || itemToRemove?.item === item.item}
                    onCheckedChange={(checked) =>
                      handleCheckedChange(!!checked, item)
                    }
                  />
                  <label
                    htmlFor={`${item.item}-${item.unit}`}
                    className={cn(
                      "text-sm font-medium leading-none transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                      (checkedItems.has(item.item) || itemToRemove?.item === item.item) && "line-through text-muted-foreground"
                    )}
                  >
                    {item.item}
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.quantity} {item.unit}
                </div>
              </div>
            ))}
            {items.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground my-12">
                No more items! All done 🎉
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-6">
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button variant="outline" className="w-full">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={!!itemToRemove} onOpenChange={(open) => !open && handleRemoveCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{itemToRemove?.item}" from your shopping list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRemoveCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
