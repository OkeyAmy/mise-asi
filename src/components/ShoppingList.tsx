
import { ShoppingListItem } from "@/data/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Download, Share2 } from "lucide-react";

interface ShoppingListProps {
  items: ShoppingListItem[];
}

export const ShoppingList = ({ items }: ShoppingListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Smart Shopping List</CardTitle>
        <CardDescription>Only items you need for your meal plan are listed here.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {items.map((item) => (
            <div key={item.item} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
              <div className="flex items-center gap-4">
                <Checkbox id={item.item} />
                <label htmlFor={item.item} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {item.item}
                </label>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.quantity} {item.unit}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-6">
            <Button className="w-full"><Download className="mr-2 h-4 w-4" /> Download</Button>
            <Button variant="outline" className="w-full"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
        </div>
      </CardContent>
    </Card>
  );
};
