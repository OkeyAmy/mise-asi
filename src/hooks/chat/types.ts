import { MealPlan, ShoppingListItem, ThoughtStep, UserPreferences, LeftoverItem } from "@/data/schema";
import { InventoryItem } from "@/hooks/useInventory";
import { Session } from "@supabase/supabase-js";

export interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export interface UseChatProps {
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  onUpdateShoppingList?: (items: ShoppingListItem[]) => void;
  onUpdateInventory?: (items: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }[]) => Promise<void>;
  onGetInventory?: () => Promise<InventoryItem[]>;
  shoppingListItems?: ShoppingListItem[];
  onAddItemsToShoppingList?: (items: ShoppingListItem[]) => Promise<void>;
  onRemoveItemsFromShoppingList?: (itemNames: string[]) => Promise<void>;
  onGetUserPreferences?: () => Promise<UserPreferences | null>;
  onUpdateUserPreferences?: (updates: Partial<UserPreferences>) => Promise<void>;
  // Leftovers props
  setIsLeftoversOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onGetLeftovers: () => Promise<LeftoverItem[]>;
  onAddLeftover: (item: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'date_created'> & { date_created?: string }) => Promise<void>;
  onUpdateLeftover: (id: string, updates: Partial<{ servings: number; notes: string }>) => Promise<void>;
  onRemoveLeftover: (id: string) => Promise<void>;
  // Session and thought steps for persistence
  session?: Session | null;
  thoughtSteps?: ThoughtStep[];
}

export const initialMessages: Message[] = [
  {
    id: 1,
    text: "Welcome to NutriMate! To get started, tell me about your eating habits, any restrictions, and your nutrition goals. You can also tell me what ingredients you have in your pantry.",
    sender: "bot",
  },
];

// Remove the getInitialMessages function as we'll handle this in the hook now
