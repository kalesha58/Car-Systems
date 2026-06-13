import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ISidebarStore {
  isOpen: boolean;
  expandedGroups: Record<string, boolean>;
  toggle: () => void;
  open: () => void;
  close: () => void;
  toggleGroup: (groupId: string) => void;
  setGroupExpanded: (groupId: string, expanded: boolean) => void;
}

export const useSidebarStore = create<ISidebarStore>()(
  persist(
    (set) => ({
      isOpen: true,
      expandedGroups: {},
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggleGroup: (groupId) =>
        set((state) => ({
          expandedGroups: {
            ...state.expandedGroups,
            [groupId]: !state.expandedGroups[groupId],
          },
        })),
      setGroupExpanded: (groupId, expanded) =>
        set((state) => ({
          expandedGroups: {
            ...state.expandedGroups,
            [groupId]: expanded,
          },
        })),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({
        isOpen: state.isOpen,
        expandedGroups: state.expandedGroups,
      }),
    },
  ),
);
