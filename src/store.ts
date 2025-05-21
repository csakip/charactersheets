import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface State {
  user: User | null;
}

export const useStore = create<State>()(
  subscribeWithSelector(() => ({
    user: null,
  }))
);
