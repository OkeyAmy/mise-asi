
import * as React from "react";
import { ShoppingListItem } from "@/data/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Download, Share2, Edit, Check, X, Eye } from "lucide-react";
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
import { AmazonProductView } from "./AmazonProductView";

interface ShoppingListProps {
  items: ShoppingListItem[];
  onRemove: (item: string) => void;
  onUpdate?: (itemName: string, quantity: number, unit: string) => void;
  isLoading?: boolean;
}

export const ShoppingList = ({ items, onRemove, onUpdate, isLoading }: ShoppingListProps) => {
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set());
  const [itemToRemove, setItemToRemove] = React.useState<ShoppingListItem | null>(null);
  const [editingItem, setEditingItem] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<{ quantity: number; unit: string }>({ quantity: 0, unit: "" });
  const [viewingProduct, setViewingProduct] = React.useState<string | null>(null);

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

  const handleEditStart = (item: ShoppingListItem) => {
    setEditingItem(item.item);
    setEditValues({ quantity: item.quantity, unit: item.unit });
  };

  const handleEditSave = () => {
    if (editingItem && onUpdate) {
      onUpdate(editingItem, editValues.quantity, editValues.unit);
    }
    setEditingItem(null);
  };

  const handleEditCancel = () => {
    setEditingItem(null);
  };

  const handleViewProduct = (productName: string) => {
    setViewingProduct(productName);
  };

  const formatShoppingList = () => {
    return items
      .map((item) => `${item.item}: ${item.quantity} ${item.unit}`)
      .join('\n');
  };

  const handleDownload = () => {
    const listContent = formatShoppingList();
    const blob = new Blob([listContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shopping-list.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const listContent = formatShoppingList();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Shopping List',
          text: listContent,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Sharing is not supported on this browser. You can download the list instead.');
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Smart Shopping List</CardTitle>
          <CardDescription>
            Only items you need for your meal plan are listed here. Click edit to adjust quantities or view to see Amazon options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {(isLoading ? <div>Loading...</div> : null)}
            {items.map((item) => (
              <div
                key={`${item.item}-${item.unit}`}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted group"
              >
                <div className="flex items-center gap-4 flex-1">
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
                      "text-sm font-medium leading-none transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1",
                      (checkedItems.has(item.item) || itemToRemove?.item === item.item) && "line-through text-muted-foreground"
                    )}
                  >
                    {item.item}
                  </label>
                </div>
                
                {/* Quantity/Unit Display or Edit Mode */}
                <div className="flex items-center gap-2">
                  {editingItem === item.item ? (
                    // Edit mode
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editValues.quantity}
                        onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                        className="w-16 h-8 text-sm"
                        min="0"
                        step="0.1"
                      />
                      <Input
                        value={editValues.unit}
                        onChange={(e) => setEditValues(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-20 h-8 text-sm"
                        placeholder="unit"
                      />
                      <Button size="sm" variant="ghost" onClick={handleEditSave} className="h-8 w-8 p-0">
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleEditCancel} className="h-8 w-8 p-0">
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    // Display mode
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleViewProduct(item.item)}
                          className="h-8 w-8 p-0"
                          title="View on Amazon"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        {onUpdate && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditStart(item)}
                            className="h-8 w-8 p-0"
                            title="Edit quantity"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
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
            <Button className="w-full" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            {canShare && (
              <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            )}
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

      <AmazonProductView 
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        productName={viewingProduct || ""}
      />
    </>
  );
};
