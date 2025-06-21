
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface ResetConversationButtonProps {
  onReset: () => void;
  iconOnly?: boolean;
  className?: string;
}

export const ResetConversationButton = ({
  onReset,
  iconOnly = false,
  className = "",
}: ResetConversationButtonProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className={`${className} ${iconOnly ? 'p-0 rounded-full aspect-square' : 'w-full justify-start'}`}
          aria-label="Reset chat"
        >
          <RotateCcw className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">Reset Chat</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Conversation</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear your current chat history but keep all your meal plans, shopping lists, leftovers, inventory, and preferences intact. Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onReset}>Reset Chat</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
