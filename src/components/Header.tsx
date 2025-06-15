
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, LogOut } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  onShoppingListOpen: () => void;
}

export const Header = ({ onShoppingListOpen }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onShoppingListOpen}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Shopping List
        </Button>
        <Button variant="outline" onClick={() => navigate('/inventory')}>
          <Package className="w-4 h-4 mr-2" />
          Inventory
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};
