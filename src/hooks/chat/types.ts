
import { MealPlan, ShoppingListItem, ThoughtStep, UserPreferences, LeftoverItem } from "@/data/schema";
import { InventoryItem } from "@/hooks/useInventory";

export interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export interface UseChatProps {
  apiKey: string | null;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  onApiKeyMissing: () => void;
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
}

export const initialMessages: Message[] = [
  {
    id: 1,
    text: "Welcome to NutriMate! To get started, tell me about your eating habits, any restrictions, and your nutrition goals. You can also tell me what ingredients you have in your pantry.",
    sender: "bot",
  },
];

export const getInitialMessages = (): Message[] => {
  if (typeof window === 'undefined') return initialMessages;
  try {
    const stored = localStorage.getItem("chat_history");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Could not parse chat history from local storage", e);
  }
  return initialMessages;
}
