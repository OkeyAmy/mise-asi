import * as React from "react";
import { ShoppingListItem } from "@/data/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Download, Share2, Edit, Check, X, Eye, Copy, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { AmazonProductView } from "./AmazonProductView";
import { useSharedShoppingList } from "@/hooks/useSharedShoppingList";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface ShoppingListProps {
  items: ShoppingListItem[];
  onRemove: (item: string) => void;
  onUpdate?: (itemName: string, quantity: number, unit: string) => void;
  isLoading?: boolean;
  session?: Session | null;
}

export const ShoppingList = ({ items, onRemove, onUpdate, isLoading, session }: ShoppingListProps) => {
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set());
  const [itemToRemove, setItemToRemove] = React.useState<ShoppingListItem | null>(null);
  const [editingItem, setEditingItem] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<{ quantity: number; unit: string }>({ quantity: 0, unit: "" });
  const [viewingProduct, setViewingProduct] = React.useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string>("");
  
  const { createShareableLink, isCreating } = useSharedShoppingList(session);
  const { toast } = useToast();

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
    if (items.length === 0) {
      toast({
        title: "Nothing to share",
        description: "Your shopping list is empty.",
        variant: "destructive"
      });
      return;
    }

    if (navigator.share && !shareDialogOpen) {
      // Use native sharing if available
      try {
        const listContent = formatShoppingList();
        await navigator.share({
          title: 'My Shopping List',
          text: listContent,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fall back to shareable link
        await createAndShowShareLink();
      }
    } else {
      // Create shareable link
      await createAndShowShareLink();
    }
  };

  const createAndShowShareLink = async () => {
    try {
      const { shareUrl: url } = await createShareableLink(items, "My Shopping List");
      setShareUrl(url);
      setShareDialogOpen(true);
    } catch (error) {
      console.error('Error creating shareable link:', error);
      toast({
        title: "Error",
        description: "Failed to create shareable link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const canShare = typeof navigator !== 'undefined' && (!!navigator.share || session?.user);

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
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleShare}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Share
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

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Shopping List</DialogTitle>
            <DialogDescription>
              Anyone with this link can import your shopping list items. The link expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="flex-1"
              />
              <Button onClick={copyShareUrl} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              When someone opens this link, they'll be able to add these items to their own shopping list and get AI suggestions for what to do with them.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AmazonProductView 
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        productName={viewingProduct || ""}
      />
    </>
  );
};
