import { User } from "@supabase/supabase-js";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useLocalStorageState from "use-local-storage-state";
import BladesCharacterSheetPage from "./charSheets/BladesCharacterSheetPage";
import SWCharacterSheetPage from "./charSheets/SWCharacterSheetPage";
import WoDuCharacterSheetPage from "./charSheets/WoDuCharacterSheetPage";
import CharacterSheetList from "./components/CharacterSheetList";
import InputDialog from "./components/InputDialog";
import NewCharacterDialog from "./components/NewCharacterDialog";
import { attributes, Charsheet, Room, systems } from "./constants";
import { useStore } from "./store";
import { deleteRoom, logout, supabase } from "./supabase";
import { createCharacter, shortenName } from "./utils";
import RoomNotesPage from "./charSheets/RoomNotesPage";

function RoomPage() {
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
  const roomMenu = useRef(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const user: User = useStore((state) => state.user);

  const { roomId } = useParams();
  const navigate = useNavigate();

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
          table: "rooms_charsheets",
          filter: `room_id=eq.${roomId}`, // dynamic filtering
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            fetchCharsheets();
          }
        }
      )
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
      .select("charsheets(*), room_id") // Get full charsheet data
      .eq("room_id", roomId);

    const charsheets = data?.map((c) => ({ ...c.charsheets, room_id: c.room_id })) || [];

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
    if (newPlayerName.trim()) {
      const id = await createCharacter(
        user.id,
        selectedSystem,
        newPlayerName.trim(),
        rollChecked,
        attributes,
        roomId
      );
      fetchCharsheets();
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

  function toggleRoomPrivate() {
    supabase
      .from("rooms")
      .update({ private: !room.private })
      .eq("id", roomId)
      .then(() => {
        fetchRoom();
        toast.current?.show({
          severity: "success",
          summary: "Szoba beállítások frissítve",
          detail: `A szoba most ${room.private ? "nyilvános." : "privát."}`,
        });
      });
  }

  const selectedCharacter = charsheets.find((c) => c.id === selectedCharsheetId);
  const system = systems.find((s) => s.value === room?.system);

  if (!room) return <></>;

  const menuItems = [
    {
      label: `${room.private ? "Nyilvánossá tesz" : "Priváttá tesz"}`,
      icon: `pi ${room.private ? "pi-lock" : "pi-lock-open"}`,
      value: "private",
      command: toggleRoomPrivate,
    },
    {
      label: "Szoba átnevezése",
      icon: "pi pi-pencil",
      value: "rename",
      command: () => setRenameDialogOpen(true),
    },
    {
      label: "Szoba törlése",
      icon: "pi pi-trash",
      value: "delete",
      command: () => setShowDeleteConfirm(true),
    },
  ];

  return (
    <>
      <Toast ref={toast} />
      <div className={`flex ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className='sidebar-container flex flex-column align-items-center h-screen relative'>
          <Button
            icon={sidebarOpen ? "pi pi-chevron-left" : "pi pi-chevron-right"}
            className='sidebar-toggle bg-yellow-900 border-0'
            rounded
            size='small'
            onClick={() => setSidebarOpen(!sidebarOpen)}></Button>
          <div
            className='flex flex-column flex-1 p-3 pt-4 thin-scrollbar overflow-y-auto  w-full'
            style={{ backgroundColor: "#1f2937" }}>
            <div>
              <Link to='/' className='text-base text-yellow-400'>
                <i className='pi pi-arrow-left mr-1 mb-4'></i> Szobák
              </Link>
            </div>
            <div className='flex gap-1 justify-content-start align-items-center'>
              <div className='hidden-nowrap text-2xl font-bold opacity-90'>
                {sidebarOpen ? room.name : shortenName(room.name)}
              </div>

              {sidebarOpen && user.id === room.user_id && (
                <>
                  <Menu
                    model={menuItems}
                    popup
                    ref={roomMenu}
                    id='popup_menu_left'
                    pt={{ root: { className: "w-14rem" } }}
                  />
                  <Button
                    icon='pi pi-bars'
                    className='ml-auto'
                    text
                    size='small'
                    pt={{ root: { className: "p-0 w-1" }, icon: { className: "text-400" } }}
                    onClick={(event) => roomMenu.current.toggle(event)}></Button>
                </>
              )}
            </div>
            <div className='hidden-nowrap text-base text-400 mt-1 font-normal'>
              {sidebarOpen ? system.label : system.shortLabel}
            </div>
            {system.value === "wodu" && (
              <a
                href='https://csokav.notion.site/World-of-Dungeons-1ca0f93292ad80db9f5dccfbfede8180'
                target='_blank'
                rel='noopener noreferrer'
                className='text-300 text-sm'>
                Ismertető <i className='pi pi-external-link text-xs ml-1'></i>
              </a>
            )}

            <div className='flex-grow-1 flex flex-column justify-content-start pb-0 mt-3'>
              <CharacterSheetList
                charsheets={[...charsheets, { id: -1, data: { name: "Jegyzetek" } }]}
                selectedCharsheetId={selectedCharsheetId}
                setSelectedCharsheetId={setSelectedCharsheetId}
                sidebarOpen={sidebarOpen}
              />

              <Button text className='p-0 align-self-start mt-auto' size='small' onClick={logout}>
                Kijelentkezés
              </Button>
            </div>
          </div>
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
                {system.value === "starwars" && (
                  <SWCharacterSheetPage
                    loadedCharsheet={charsheets.find((c) => c.id === selectedCharsheetId)}
                    editable={user.id === selectedCharacter.user_id}
                    updateCharacterDisplay={updateCharacterDisplay}
                  />
                )}
              </>
            ) : selectedCharsheetId === -1 ? (
              <RoomNotesPage roomId={roomId} user={user} />
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

      <ConfirmDialog
        visible={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        message={
          <>
            Biztosan törölni akarod a szobat?
            <br />A karakterek megmaradnak.
          </>
        }
        header='Szoba törlése'
        icon='pi pi-exclamation-circle text-red-500'
        acceptClassName='p-button-danger'
        acceptLabel='Törlés'
        rejectLabel='Mégse'
        accept={async () => {
          await deleteRoom(roomId);
          navigate("/");
        }}
        reject={() => setShowDeleteConfirm(false)}></ConfirmDialog>
    </>
  );
}

export default RoomPage;
