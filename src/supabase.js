import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cgevwsmvmboahhgjfhya.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZXZ3c212bWJvYWhoZ2pmaHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTQ5NzAsImV4cCI6MjA1OTc5MDk3MH0.wzGIid04rCys32UWJvBrekANP0x3NPqu6W6JqXVXoSY";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkAuth = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(!!session);
  });
};

export const saveCharacter = async (character) => {
  if (character.charsheet.playerName.trim() === "") return 0;
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return 0;

    const { data, error } = await supabase
      .from("rooms")
      .upsert(
        {
          charsheet: character.charsheet,
          user_id: user.id,
        },
        {
          onConflict: "user_id",
        }
      )
      .select();

    if (error) {
      console.error("Error saving character:", error);
    } else {
      return data[0].id || 0;
    }
  } catch (error) {
    console.error("Error saving character:", error);
  }
};

export const deleteCharacter = async (id) => {
  try {
    const { error } = await supabase.from("rooms").delete().eq("id", id);

    if (error) {
      console.error("Error deleting character:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error deleting character:", error);
    return false;
  }
};

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error logging out:", error.message);
  } else {
    console.log("Successfully logged out");
  }
}
