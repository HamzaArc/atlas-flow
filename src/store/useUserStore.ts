import { create } from 'zustand';
import { CompanyUser } from '@/types/index';
import { UserService } from '@/services/user.service';
import { useToast } from "@/components/ui/use-toast";

interface UserState {
  users: CompanyUser[];
  activeUser: CompanyUser | null; // For editing
  isLoading: boolean;
  
  fetchUsers: () => Promise<void>;
  setActiveUser: (user: CompanyUser | null) => void;
  createNewUser: () => void;
  saveUser: (user: CompanyUser) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  activeUser: null,
  isLoading: false,

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
        const users = await UserService.fetchAll();
        set({ users, isLoading: false });
    } catch (e: any) {
        set({ isLoading: false });
        useToast.getState().toast("Failed to load users", "error");
    }
  },

  setActiveUser: (user) => set({ activeUser: user }),

  createNewUser: () => set({ activeUser: UserService.createEmpty() }),

  saveUser: async (user) => {
      set({ isLoading: true });
      try {
          const saved = await UserService.save(user);
          const { users } = get();
          const exists = users.find(u => u.id === user.id);
          
          let newUsers = [...users];
          if(exists) {
              newUsers = users.map(u => u.id === user.id ? saved : u);
          } else {
              newUsers = [...users, saved];
          }

          set({ users: newUsers, activeUser: null, isLoading: false });
          useToast.getState().toast("User saved successfully", "success");
      } catch (e: any) {
          set({ isLoading: false });
          useToast.getState().toast(e.message, "error");
      }
  },

  deleteUser: async (id) => {
      set({ isLoading: true });
      try {
          await UserService.delete(id);
          set(state => ({ 
              users: state.users.filter(u => u.id !== id),
              isLoading: false 
          }));
          useToast.getState().toast("User removed", "success");
      } catch (e: any) {
          set({ isLoading: false });
          useToast.getState().toast(e.message, "error");
      }
  }
}));