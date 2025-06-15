
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-2 sm:p-4">
      <div className="flex justify-end gap-1 sm:gap-2">
        <Button 
          variant="outline" 
          onClick={onShoppingListOpen}
          size="sm"
          className="px-2 sm:px-4 text-xs sm:text-sm"
        >
          <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden xs:inline sm:inline">Shopping</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/inventory')}
          size="sm"
          className="px-2 sm:px-4 text-xs sm:text-sm"
        >
          <Package className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden xs:inline sm:inline">Inventory</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          size="sm"
          className="px-2 sm:px-4 text-xs sm:text-sm"
        >
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden xs:inline sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};
