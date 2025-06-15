
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface ResetConversationButtonProps {
  onReset: () => void;
  iconOnly?: boolean;
}

export const ResetConversationButton = ({ onReset, iconOnly = false }: ResetConversationButtonProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className={iconOnly ? "w-8 h-8 p-0 flex items-center justify-center" : "gap-2"}>
          <RotateCcw className="h-5 w-5" />
          {!iconOnly && "Reset Chat"}
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
