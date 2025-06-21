
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Copy, Check, Share2, Loader2 } from "lucide-react";
import { useSharedShoppingList } from "@/hooks/useSharedShoppingList";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface ShareShoppingListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingListItem[];
  session: Session | null;
}

export const ShareShoppingListDialog = ({
  isOpen,
  onClose,
  items,
  session
}: ShareShoppingListDialogProps) => {
  const [title, setTitle] = useState("My Shopping List");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { createShareableLink, isCreating } = useSharedShoppingList(session);

  const handleCreateLink = async () => {
    if (!session || items.length === 0) {
      toast.error("Please ensure you're signed in and have items in your list");
      return;
    }

    try {
      const { shareUrl } = await createShareableLink(items, title);
      setShareUrl(shareUrl);
      toast.success("Shareable link created!");
    } catch (error) {
      console.error("Error creating shareable link:", error);
      toast.error("Failed to create shareable link");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleClose = () => {
    setShareUrl("");
    setTitle("My Shopping List");
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <DialogTitle>Share Shopping List</DialogTitle>
          </div>
        </DialogHeader>
        
        {!shareUrl ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">List Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your list"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              You're about to share {items.length} item{items.length !== 1 ? 's' : ''} from your shopping list.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-url">Shareable Link</Label>
              <div className="flex space-x-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              This link will expire in 7 days. Anyone with this link can view and import your shopping list items.
            </div>
          </div>
        )}

        <DialogFooter>
          {!shareUrl ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLink} 
                disabled={isCreating || !title.trim() || items.length === 0}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Link"
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
