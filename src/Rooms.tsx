import { User } from "@supabase/supabase-js";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ListBox } from "primereact/listbox";
import { TabPanel, TabView } from "primereact/tabview";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import useLocalStorageState from "use-local-storage-state";
import BladesCharacterSheetPage from "./charSheets/BladesCharacterSheetPage";
import SWCharacterSheetPage from "./charSheets/SWCharacterSheetPage";
import WoDuCharacterSheetPage from "./charSheets/WoDuCharacterSheetPage";
import CharacterSheetList from "./components/CharacterSheetList";
import NewCharacterDialog from "./components/NewCharacterDialog";
import { attributes, Charsheet, systems } from "./constants";
import { useStore } from "./store";
import { logout, saveRoom, supabase } from "./supabase";
import { createCharacter } from "./utils";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [showNewCharacterDialog, setShowNewCharacterDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedSystem, setSelectedSystem] = useState();
  const [isPrivate, setIsPrivate] = useState(true);
  const toast = useRef<Toast>(null);
  const [charsheets, setCharsheets] = useState<Charsheet[]>([]);
  const [selectedCharsheetId, setSelectedCharsheetId] = useLocalStorageState<number>(
    "wodu-selected-charsheet",
    {
      defaultValue: null,
    }
  );

  const user: User = useStore((state) => state.user);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    fetchCharsheets();
    setSelectedCharsheetId(null);

    console.log("user.id", user.id);

    const channel1 = supabase
      .channel("rooms_charsheets_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms_charsheets",
          // filter: `user_id=eq.${user.id}`,
        },
        fetchCharsheets
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms_charsheets",
          filter: `private=eq.false`,
        },
        fetchCharsheets
      )
      .subscribe();

    const channel2 = supabase
      .channel("charsheets_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "charsheets",
          // filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Don't update my own character
          if ((payload.new as Charsheet).user_id === user.id && payload.eventType === "UPDATE")
            return;
          fetchCharsheets();
        }
      )
      .subscribe();

    const channel3 = supabase
      .channel("rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          // filter: `user_id=eq.${user.id}`,
        },
        fetchRooms
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `private=eq.false`,
        },
        fetchRooms
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selected = charsheets.find((c) => c.id === selectedCharsheetId);
    setTimeout(() => {
      if (selected && selected.rooms_charsheets?.length) {
        navigate(`/${selected.rooms_charsheets[0].room_id}`);
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharsheetId]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .or(`user_id.eq.${user.id},private.eq.false`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching rooms:", error);
      return;
    }

    setRooms(data);
  };

  const fetchCharsheets = async () => {
    const { data, error } = await supabase
      .from("charsheets")
      .select("*, rooms_charsheets(room_id)")
      .eq("user_id", user.id);

    if (data) {
      data.forEach((c) => {
        c.room_id = c.rooms_charsheets?.[0]?.room_id;
      });
      setCharsheets(data as unknown as Charsheet[]);
    }

    if (error) {
      console.error("Error fetching characters:", error);
      return;
    }
  };

  const createRoom = async () => {
    if (newRoomName.trim()) {
      const room = {
        name: newRoomName.trim(),
        user_id: user.id,
        system: selectedSystem,
        private: isPrivate,
      };
      await saveRoom(room);
      // Reset dialog
      fetchRooms();
      setShowNewRoomDialog(false);
      setNewRoomName("");
      setSelectedSystem(null);
      setIsPrivate(true);
    }
  };

  const createCharacterWithName = async ({
    playerName,
    rollChecked,
    system,
    type,
  }: {
    playerName: string;
    rollChecked?: boolean;
    system?: string;
    type?: string;
  }) => {
    if (playerName.trim() && type === "character") {
      const id = await createCharacter(
        user.id,
        system,
        playerName.trim(),
        rollChecked,
        attributes,
        null
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

  const refreshData = async () => {
    await fetchRooms();
    await fetchCharsheets();
    toast.current?.show({ severity: "info", summary: "Adatok frissítve", life: 1000 });
  };

  const selectedCharsheet = charsheets.find((c) => c.id === selectedCharsheetId);

  return (
    <>
      <Toast ref={toast} />
      <div className={`flex sidebar-open`}>
        <div className={`sidebar-container flex flex-column align-items-center h-screen`}>
          <div
            className='flex flex-column w-full flex-1 p-3 thin-scrollbar overflow-y-auto relative'
            style={{ backgroundColor: "#1f2937" }}>
            <div className='float-right absolute right-0 mr-3 mt-1 z-5'>
              <Button
                icon={`pi pi-sync`}
                severity='secondary'
                text
                size='small'
                title='Frissítés'
                onClick={refreshData}></Button>
            </div>
            <TabView pt={{ panelContainer: { className: "px-0" } }}>
              <TabPanel className='flex flex-column gap-2' header='Szobák'>
                {!!rooms.length && (
                  <ListBox
                    options={rooms.map((p, idx) => ({
                      title: "Szobák",

                      label: (
                        <div id={`room-${idx}`}>
                          <Tooltip target={`#room-${idx}`} position='right' showDelay={300}>
                            {systems.find((s) => s.value === p.system)?.label}
                          </Tooltip>
                          <span className='text-sm mr-1'>
                            {systems.find((s) => s.value === p.system)?.shortLabel}
                            &nbsp;-
                          </span>
                          <span className='font-semibold'>{p.name}</span>
                          {p.private && (
                            <i
                              className='pi pi-lock ml-1 text-300'
                              style={{ float: "right" }}
                              title='Privát szoba'
                            />
                          )}
                        </div>
                      ),
                      value: p.id,
                    }))}
                    onChange={(e) => {
                      navigate(`/${e.value}`);
                    }}
                    className='w-full'
                  />
                )}
              </TabPanel>
              <TabPanel className='flex flex-column gap-2' header='Karakterlapjaid'>
                <CharacterSheetList
                  charsheets={charsheets}
                  selectedCharsheetId={selectedCharsheetId}
                  setSelectedCharsheetId={setSelectedCharsheetId}
                  showSystem={true}
                  showPlayerName={false}
                />
              </TabPanel>
            </TabView>
            <Button
              text
              className='p-0 align-self-start mt-auto flex-shrink-0'
              size='small'
              onClick={logout}>
              Kijelentkezés
            </Button>
          </div>
        </div>
        <div className='flex-1'>
          <div className='w-full h-screen overflow-auto thin-scrollbar'>
            {selectedCharsheet && selectedCharsheet.system === "wodu" && (
              <WoDuCharacterSheetPage
                loadedCharsheet={selectedCharsheet}
                editable={selectedCharsheet.user_id === user.id}
                updateCharacterDisplay={updateCharacterDisplay}
              />
            )}
            {selectedCharsheet && selectedCharsheet.system === "blades" && (
              <BladesCharacterSheetPage
                loadedCharsheet={selectedCharsheet}
                editable={selectedCharsheet.user_id === user.id}
                updateCharacterDisplay={updateCharacterDisplay}
              />
            )}
            {selectedCharsheet && selectedCharsheet.system === "starwars" && (
              <SWCharacterSheetPage
                loadedCharsheet={selectedCharsheet}
                editable={selectedCharsheet.user_id === user.id}
                updateCharacterDisplay={updateCharacterDisplay}
                roomSettings={{}}
              />
            )}
            {!selectedCharsheet && (
              <div className='flex flex-column gap-3 align-items-center justify-content-center h-full'>
                <Button
                  onClick={() => setShowNewRoomDialog(true)}
                  pt={{ root: { className: "w-14rem justify-content-center w-full" } }}>
                  Új szoba létrehozása
                </Button>
                <Button
                  onClick={() => setShowNewCharacterDialog(true)}
                  pt={{ root: { className: "w-14rem justify-content-center w-full" } }}>
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
      />

      <Dialog
        visible={showNewRoomDialog}
        onHide={() => setShowNewRoomDialog(false)}
        header='Új szoba'
        style={{ width: 600 }}
        onShow={() => {
          document.getElementById("roomName").focus();
        }}
        modal
        footer={
          <div>
            <Button
              label='Mégse'
              icon='pi pi-times'
              onClick={() => setShowNewRoomDialog(false)}
              className='p-button-text'
            />
            <Button
              label='Létrehozás'
              icon='pi pi-check'
              onClick={createRoom}
              disabled={!newRoomName.trim() || !selectedSystem}
            />
          </div>
        }>
        <div className='flex flex-column gap-3'>
          <div className='flex flex-column gap-2'>
            <label>Rendszer</label>
            <Dropdown
              value={selectedSystem}
              options={systems}
              onChange={(e) => setSelectedSystem(e.value)}
              placeholder='Válassz rendszert!'
            />
          </div>
          <div className='flex flex-column gap-2'>
            <label htmlFor='roomName'>Szoba neve</label>
            <InputText
              id='roomName'
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createRoom()}
            />
          </div>
          <div className='flex flex-column gap-2'>
            <div className='flex align-items-center'>
              <Checkbox
                inputId='privateRoom'
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.checked)}
                className='mr-2'
              />
              <label htmlFor='privateRoom'>A szoba csak számodra legyen elérhető most</label>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default Rooms;
