import { createClient } from "@supabase/supabase-js";
import { useStore } from "./store";

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

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error logging out:", error.message);
  } else {
    useStore.setState({ user: undefined });
    console.log("Successfully logged out");
  }
}

export const saveRoom = async (room) => {
  if (room.name.trim() === "") return 0;
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return 0;

    const { data, error } = await supabase.from("rooms").insert(room).select();

    if (error) {
      console.error("Error saving room:", error);
    } else {
      return data[0].id || 0;
    }
  } catch (error) {
    console.error("Error saving room:", error);
  }
};

export const saveCharsheet = async (charsheet, roomId) => {
  if (charsheet.data.playerName.trim() === "") return 0;
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return 0;

    delete charsheet.updated_at;
    delete charsheet.rooms_charsheets;

    const charsheetWithoutRoomId = structuredClone(charsheet);
    delete charsheetWithoutRoomId.room_id;
    // Upsert the character sheet
    const { data: charData, error: charError } = await supabase
      .from("charsheets")
      .upsert(charsheetWithoutRoomId, {
        onConflict: "id",
      })
      .select();

    if (charError) {
      console.error("Error saving charsheet:", charError);
      return 0;
    }

    // Create the room-charsheet relationship
    if (roomId && !charsheet.id) {
      const { error: relationError } = await supabase.from("rooms_charsheets").insert({
        room_id: roomId,
        charsheet_id: charData[0].id,
      });

      if (relationError) {
        console.error("Error linking charsheet to room:", relationError);
      }
    }

    const { data, error } = { data: charData, error: charError };

    if (error) {
      console.error("Error saving charsheet:", error);
    } else {
      return data[0].id || 0;
    }
  } catch (error) {
    console.error("Error saving character:", error);
  }
};

export const deleteCharsheet = async (id) => {
  console.log("Deleting charsheet with ID:", id);
  try {
    const { error: error1 } = await supabase.from("charsheets").delete().eq("id", id);
    if (error1) {
      console.error("Error deleting charsheet:", error1);
      return false;
    }

    const { error } = await supabase.from("rooms_charsheets").delete().eq("charsheet_id", id);

    if (error) {
      console.error("Error deleting charsheet:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error deleting charsheet:", error);
    return false;
  }
};

// Removes a character from a room
export const characterExitRoom = async (id) => {
  try {
    const { error } = await supabase.from("rooms_charsheets").delete().eq("charsheet_id", id);
    if (error) {
      console.error("Error removing character from room:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error removing character from room:", error);
    return false;
  }
};

export async function addCharacterToRoom(roomId, charsheetId) {
  return await supabase.from("rooms_charsheets").insert({
    room_id: roomId,
    charsheet_id: charsheetId,
  });
}
