import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface State {
  user: User | null;
  // charactersToUpdate: boolean;
  // triggerCharactersUpdate: () => void;
}

export const useStore = create<State>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    // charactersToUpdate: false,
    // triggerCharactersUpdate: () => {
    //   set({ charactersToUpdate: !get().charactersToUpdate });
    // },
  }))
);
