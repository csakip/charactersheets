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
    console.info("Successfully logged out");
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

export const deleteRoom = async (roomId) => {
  try {
    const { error: error1 } = await supabase.from("rooms_charsheets").delete().eq("room_id", roomId);
    if (error1) {
      console.error("Error deleting rooms_charsheets entries:", error1);
    }
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) {
      console.error("Error deleting room:", error);
    }
  } catch (error) {
    console.error("Error deleting room:", error);
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

export async function backupPublicSchema() {
  const { data: tables, error: tablesError } = await supabase.rpc("pg_catalog.pg_tables").select("tablename").eq("schemaname", "public");
  if (tablesError) throw tablesError;

  const backup = {};
  for (const { tablename } of tables) {
    const { data, error } = await supabase.from(tablename).select("*");
    if (error) throw error;
    backup[tablename] = data;
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  console.log("Backup saved.");
}
