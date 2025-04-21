import { User } from "@supabase/supabase-js";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ListBox } from "primereact/listbox";
import { ScrollPanel } from "primereact/scrollpanel";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useLocalStorageState from "use-local-storage-state";
import WoDuCharacterSheetPage from "./WoDuCharacterSheetPage";
import { logout, saveCharsheet, supabase } from "./supabase";
import {
  attributes,
  BladesData,
  Charsheet,
  emptyBladesData,
  emptyWoduData,
  rollAttribute,
  Room,
  systems,
  WoduData,
} from "./utils";
import InputDialog from "./components/InputDialog";
import NewCharacterDialog from "./components/NewCharacterDialog";
import BladesCharacterSheetPage from "./BladesCharacterSheetPage";

function RoomPage({ user }: { user: User }) {
  const [charsheets, setCharsheets] = useState<Charsheet[]>([]);
  const [selectedCharsheetId, setSelectedCharsheetId] = useLocalStorageState<number>(
    "wodu-selected-charsheet",
    {
      defaultValue: null,
    }
  );
  const [showNewCharacterDialog, setShowNewCharacterDialog] = useState(false);
  const [room, setRoom] = useState<Room>();
  const [sidebarOpen, setSidebarOpen] = useLocalStorageState("wodu-sidebar", {
    defaultValue: true,
  });
  const toast = useRef<Toast>(null);
  const charsheetsRef = useRef(charsheets); // Store the charsheets array in a ref to avoid stale data
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const { roomId } = useParams();

  useEffect(() => {
    fetchRoom();
    fetchCharsheets();

    const channel = supabase
      .channel("charsheets_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "charsheets",
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE" ||
            payload.eventType === "DELETE"
          ) {
            console.log("Change received!", payload);
            if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
              const newCharsheet = payload.new as Charsheet;

              // Don't update my own character
              if (newCharsheet.user_id === user.id && payload.eventType === "UPDATE") return;

              const newCharsheets = [
                ...charsheetsRef.current.filter((p) => p.id !== newCharsheet.id),
                newCharsheet,
              ];
              setCharsheets(newCharsheets);
            } else if (payload.eventType === "DELETE") {
              setCharsheets([...charsheetsRef.current.filter((p) => p.id !== payload.old.id)]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    charsheetsRef.current = charsheets;
  }, [charsheets]);

  async function fetchRoom() {
    const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();

    if (error) {
      console.error("Error fetching room:", error);
      return;
    }

    if (data) {
      setRoom(data);
    }
  }

  const fetchCharsheets = async () => {
    const { data, error } = await supabase
      .from("rooms_charsheets")
      .select("charsheets(*)") // Get full charsheet data
      .eq("room_id", roomId);

    const charsheets = data?.map((item) => item.charsheets) || [];

    if (data) {
      setCharsheets(charsheets as unknown as Charsheet[]);
    }

    if (error) {
      console.error("Error fetching characters:", error);
      return;
    }
  };

  const createCharacterWithName = async (
    newPlayerName: string,
    rollChecked: boolean,
    selectedSystem = system.value
  ) => {
    console.log("Creating new character with name:", newPlayerName, rollChecked, selectedSystem);
    if (newPlayerName.trim()) {
      let char: WoduData | BladesData = null;

      if (selectedSystem === "wodu") {
        char = emptyWoduData(newPlayerName.trim());

        // Roll attributes if the checkbox is checked
        if (rollChecked) {
          do {
            attributes.forEach((a) => {
              const roll = rollAttribute();
              (char as WoduData).attributes[a.label.toLowerCase()] = roll;
            });
          } while (Object.values((char as WoduData).attributes).reduce((sum, c) => sum + c, 0) < 5);
        }
      }

      if (selectedSystem === "blades") {
        char = emptyBladesData(newPlayerName.trim());
      }
      console.log("Creating new character:", char, selectedSystem);

      const id = await saveCharsheet(
        { user_id: user.id, system: selectedSystem, data: char },
        roomId
      );
      setSelectedCharsheetId(id);
      setShowNewCharacterDialog(false);
    }
  };

  function updateCharacterDisplay(charsheet: Charsheet) {
    const charsheetToUpdate = charsheets.find((c) => c.id === charsheet.id);
    if (!charsheetToUpdate) return;

    charsheetToUpdate.data = charsheet.data;
    charsheetToUpdate.updated_at = new Date().toISOString();

    setCharsheets([...charsheets]);
  }

  function renameRoom(newName: string) {
    if (newName.trim() === "") return;
    setRenameDialogOpen(false);
    console.log("Renaming room to:", newName);
    supabase
      .from("rooms")
      .update({ name: newName })
      .eq("id", roomId)
      .then(() => {
        fetchRoom();
        toast.current?.show({
          severity: "success",
          summary: "Szoba átnevezve",
          detail: `A szoba új neve: ${newName}`,
        });
      });
  }

  const selectedCharacter = charsheets.find((c) => c.id === selectedCharsheetId);
  const system = systems.find((s) => s.value === room?.system);

  if (!room) return <></>;

  return (
    <>
      <Toast ref={toast} />
      <div className={`flex ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className={`sidebar-container flex flex-column align-items-center h-screen`}>
          <Card
            title={
              <>
                <Link to='/' className='text-base'>
                  <i className='pi pi-arrow-left mr-1 mb-4'></i> Szobák
                </Link>
                <div className='flex gap-1 justify-content-between align-items-center'>
                  <div className='hidden-nowrap'>{room.name}</div>
                  {sidebarOpen && user.id === room.user_id && (
                    <Button
                      icon='pi pi-pencil'
                      severity='secondary'
                      text
                      size='small'
                      pt={{ root: { className: "p-0 w-1" } }}
                      title='Szoba átnevezése'
                      onClick={() => setRenameDialogOpen(true)}></Button>
                  )}
                </div>
                <div className='hidden-nowrap text-base text-400 mt-1 font-normal'>
                  {sidebarOpen ? system.label : system.shortLabel}
                </div>
                <Button
                  icon={sidebarOpen ? "pi pi-chevron-left" : "pi pi-chevron-right"}
                  className='sidebar-toggle bg-yellow-900  border-0'
                  rounded
                  size='small'
                  onClick={() => setSidebarOpen(!sidebarOpen)}></Button>
              </>
            }
            subTitle={
              system.value === "wodu" && (
                <a
                  href='https://csokav.notion.site/World-of-Dungeons-1ca0f93292ad80db9f5dccfbfede8180'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-300 text-sm'>
                  Ismertető <i className='pi pi-external-link text-xs ml-1'></i>
                </a>
              )
            }
            pt={{
              content: {
                className: "flex-grow-1 flex flex-column justify-content-between pb-0 ",
              },
              body: { className: "flex flex-column flex-1" },
              title: { className: "relative" },
            }}
            className='w-full flex-grow-1 flex flex-column'>
            <ScrollPanel>
              <div className='flex flex-column gap-2'>
                {!!charsheets.length && (
                  <ListBox
                    value={selectedCharsheetId}
                    options={charsheets
                      .toSorted((a, b) => (a.data.playerName < b.data.playerName ? 1 : -1))
                      .map((p) => ({
                        label: `${p.data?.playerName}${
                          p.data?.name && sidebarOpen ? ` - ${p.data?.name}` : ""
                        }`,
                        value: p.id,
                      }))}
                    onChange={(e) => setSelectedCharsheetId(e.value)}
                    className='w-full'
                  />
                )}
              </div>
            </ScrollPanel>
            <Button text className='p-0 align-self-start' size='small' onClick={logout}>
              Kijelentkezés
            </Button>
          </Card>
        </div>
        <div className='flex-1'>
          <div className='w-full h-screen overflow-auto thin-scrollbar'>
            {selectedCharacter ? (
              <>
                {system.value === "wodu" && (
                  <WoDuCharacterSheetPage
                    loadedCharsheet={charsheets.find((c) => c.id === selectedCharsheetId)}
                    editable={user.id === selectedCharacter.user_id}
                    updateCharacterDisplay={updateCharacterDisplay}
                  />
                )}
                {system.value === "blades" && (
                  <BladesCharacterSheetPage
                    loadedCharsheet={charsheets.find((c) => c.id === selectedCharsheetId)}
                    editable={user.id === selectedCharacter.user_id}
                    updateCharacterDisplay={updateCharacterDisplay}
                  />
                )}
              </>
            ) : (
              <div className='flex align-items-center justify-content-center h-full'>
                <Button onClick={() => setShowNewCharacterDialog(true)}>
                  Új karakter létrehozása
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <NewCharacterDialog
        visible={showNewCharacterDialog}
        onHide={() => setShowNewCharacterDialog(false)}
        onSave={createCharacterWithName}
        system={system.value}
      />

      <InputDialog
        visible={renameDialogOpen}
        onHide={() => setRenameDialogOpen(false)}
        onSave={renameRoom}
        title='Szoba átnevezése'
        content='Új név'
        defaultValue={room.name}
      />
    </>
  );
}

export default RoomPage;
