
import React from "react";
import { SharedShoppingListImport } from "@/components/SharedShoppingListImport";
import { useShoppingList } from "@/hooks/useShoppingList";
import { Session } from "@supabase/supabase-js";

interface SharedShoppingListPageProps {
  session: Session | null;
  onTriggerAIResponse: (message: string) => void;
}

export const SharedShoppingListPage = ({ session, onTriggerAIResponse }: SharedShoppingListPageProps) => {
  const { addItems } = useShoppingList(session, "default");

  return (
    <SharedShoppingListImport
      session={session}
      onAddItems={addItems}
      onTriggerAIResponse={onTriggerAIResponse}
    />
  );
};
