import { User } from "@supabase/supabase-js";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { ListBox } from "primereact/listbox";
import { ScrollPanel } from "primereact/scrollpanel";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import CharacterSheetPage from "./CharacterSheetPage";
import { Participant, attributes, emptyCharacter, rollAttribute } from "./utils";
import { logout, saveCharacter, supabase } from "./supabase";
import useLocalStorageState from "use-local-storage-state";
import { Checkbox } from "primereact/checkbox";

function Room({ user }: { user: User }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticioantId, setSelectedParticipantId] = useLocalStorageState<number>(
    "wodu-selected-participant",
    {
      defaultValue: null,
    }
  );
  const [showNewCharacterDialog, setShowNewCharacterDialog] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useLocalStorageState("wodu-sidebar", {
    defaultValue: true,
  });
  const [rollChecked, setRollChecked] = useState(false);
  const toast = useRef<Toast>(null);
  const participantsRef = useRef(participants); // Store the participants array in a ref to avoid stale data

  useEffect(() => {
    fetchCharacters();

    const channel = supabase
      .channel("room_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE" ||
            payload.eventType === "DELETE"
          ) {
            if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
              const newParticipant = payload.new as Participant;

              // Don't update my own character
              if (newParticipant.user_id === user.id && payload.eventType === "UPDATE") return;

              const newParticipants = [
                ...participantsRef.current.filter((p) => p.id !== newParticipant.id),
                newParticipant,
              ];
              setParticipants(newParticipants);
            } else if (payload.eventType === "DELETE") {
              setParticipants([...participantsRef.current.filter((p) => p.id !== payload.old.id)]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const fetchCharacters = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("updated_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setParticipants(data || []);
  };

  const createCharacterWithName = async () => {
    if (newPlayerName.trim()) {
      const char = emptyCharacter(newPlayerName.trim());
      if (rollChecked) {
        do {
          attributes.forEach((a) => {
            const roll = rollAttribute();
            char.attributes[a.label.toLowerCase()] = roll;
          });
        } while (Object.values(char.attributes).reduce((sum, c) => sum + c, 0) < 5);
      }
      const id = await saveCharacter({ user_id: user.id, charsheet: char });
      setSelectedParticipantId(id);
      setShowNewCharacterDialog(false);
      setNewPlayerName("");
    }
  };

  function updateCharacterDisplay(name: string, playerName: string) {
    const character = participants.find((c) => c.user_id === user.id);
    if (!character) return;

    character.charsheet.name = name;
    character.charsheet.playerName = playerName;

    setParticipants([...participants]);
  }

  const selectedCharacter = participants.find((c) => c.id === selectedParticioantId);
  const userHasCharacter = participants.some((c) => c.user_id === user.id);

  return (
    <>
      <Toast ref={toast} />
      <div className={`flex ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className={`sidebar-container flex flex-column align-items-center h-screen`}>
          <Card
            title={
              <>
                <div className='hidden-nowrap'>{sidebarOpen ? "World of Dungeons" : "WoDu"}</div>
                <Button
                  icon={sidebarOpen ? "pi pi-chevron-left" : "pi pi-chevron-right"}
                  className='sidebar-toggle bg-yellow-900  border-0'
                  rounded
                  size='small'
                  onClick={() => setSidebarOpen(!sidebarOpen)}></Button>
              </>
            }
            subTitle={
              <a
                href='https://csokav.notion.site/World-of-Dungeons-1ca0f93292ad80db9f5dccfbfede8180'
                target='_blank'
                rel='noopener noreferrer'
                className='text-300 text-sm'>
                Ismertető <i className='pi pi-external-link text-xs ml-1'></i>
              </a>
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
                {!!participants.length && (
                  <ListBox
                    value={selectedParticioantId}
                    options={participants
                      .toSorted((a, b) =>
                        a.charsheet.playerName < b.charsheet.playerName ? 1 : -1
                      )
                      .map((p) => ({
                        label: `${p.charsheet?.playerName}${
                          p.charsheet?.name && sidebarOpen ? ` - ${p.charsheet?.name}` : ""
                        }`,
                        value: p.id,
                      }))}
                    onChange={(e) => setSelectedParticipantId(e.value)}
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
              <CharacterSheetPage
                loadedParticipant={participants.find((c) => c.id === selectedParticioantId)}
                editable={user.id === selectedCharacter.user_id}
                updateCharacterDisplay={updateCharacterDisplay}
              />
            ) : (
              !userHasCharacter && (
                <div className='flex align-items-center justify-content-center h-full'>
                  <Button onClick={() => setShowNewCharacterDialog(true)}>
                    Új karakter létrehozása
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <Dialog
        visible={showNewCharacterDialog}
        onHide={() => setShowNewCharacterDialog(false)}
        header='Új karakter'
        style={{ width: 600 }}
        onShow={() => {
          document.getElementById("playerName").focus();
        }}
        modal
        footer={
          <div>
            <Button
              label='Cancel'
              icon='pi pi-times'
              onClick={() => setShowNewCharacterDialog(false)}
              className='p-button-text'
            />
            <Button
              label='Create'
              icon='pi pi-check'
              onClick={createCharacterWithName}
              disabled={!newPlayerName.trim()}
            />
          </div>
        }>
        <div className='flex flex-column gap-2'>
          <label htmlFor='playerName'>Játékos neve</label>
          <InputText
            id='playerName'
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createCharacterWithName()}
          />
          <div className='mt-1'>
            <Checkbox
              onChange={(e) => setRollChecked(e.checked)}
              checked={rollChecked}
              inputId='rollChecked'
            />
            <label htmlFor='rollChecked' className='ml-2 '>
              Kidobott tualjdonságokkal?
            </label>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default Room;
