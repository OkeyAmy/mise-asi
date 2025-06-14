export interface Meal {
  name: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: { item: string; quantity: number; unit: string }[];
}

export interface DayPlan {
  date: string;
  day: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal;
  };
}

export interface MealPlan {
  plan_id: string;
  days: DayPlan[];
}

export interface ShoppingListItem {
  item: string;
  quantity: number;
  unit: string;
}

export interface ThoughtStep {
  id: string;
  step: string;
  status: 'pending' | 'active' | 'completed';
  details?: string;
}
