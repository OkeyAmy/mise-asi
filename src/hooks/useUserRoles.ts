
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'user';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export function useUserRoles(session: Session | null) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user.id) {
      fetchUserRoles();
    }
  }, [session]);

  const fetchUserRoles = async () => {
    if (!session?.user.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      setUserRoles(data?.map(item => item.role as UserRole) || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  return {
    userRoles,
    isLoading,
    hasRole,
    isAdmin,
    refetch: fetchUserRoles
  };
}
