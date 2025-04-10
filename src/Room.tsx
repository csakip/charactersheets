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
import { Participant, emptyCharacter } from "./config";
import { saveCharacter, supabase } from "./supabase";
import { Link } from "react-router-dom";

function Room({ user }: { user: User }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const participantsRef = useRef<Participant[]>([]); // Create a ref for participants
  const [selectedParticioantId, setSelectedParticipantId] = useState<number>(null);
  const [showNewCharacterDialog, setShowNewCharacterDialog] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const toast = useRef<Toast>(null);

  useEffect(() => {
    participantsRef.current = participants; // Keep the ref updated with the latest participants
  }, [participants]);

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
            console.log("payload", payload);
            if ("id" in payload.new) {
              const newParticipant = payload.new as Participant;

              const existingParticipant = participantsRef.current.find(
                (p) => p.id === newParticipant.id
              );

              // Only update if the new participant's updated_at is later
              if (
                !existingParticipant ||
                new Date(newParticipant.updated_at) > new Date(existingParticipant.updated_at)
              ) {
                const newParticipants = [
                  ...participantsRef.current.filter((p) => p.id !== newParticipant.id),
                  newParticipant,
                ];
                setParticipants(newParticipants);
              }
            } else if ("id" in payload.old) {
              console.log("remove", payload.old);
              //@ts-expect-error there is an id
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

  const fetchCharacters = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("updated_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    console.log("setting participants", data);
    setParticipants(data || []);
  };

  const createCharacterWithName = async () => {
    if (newPlayerName.trim()) {
      const char = emptyCharacter(newPlayerName.trim());
      const id = await saveCharacter({ user_id: user.id, charsheet: char });
      setSelectedParticipantId(id);
      setShowNewCharacterDialog(false);
      setNewPlayerName("");
    }
  };

  const selectedCharacter = participants.find((c) => c.id === selectedParticioantId);
  const userHasCharacter = participants.some((c) => c.user_id === user.id);

  return (
    <>
      <Toast ref={toast} />
      <div className='flex'>
        <div className='flex flex-column align-items-center p-3 gap-3 w-27rem h-screen'>
          <Card
            title='World of Dungeons'
            subTitle={
              <a
                href='https://csokav.notion.site/World-of-Dungeons-1ca0f93292ad80db9f5dccfbfede8180'
                target='_blank'
                rel='noopener noreferrer'
                className='text-300 text-sm'>
                Ismertető
              </a>
            }
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
                          p.charsheet?.name ? ` - ${p.charsheet?.name}` : ""
                        }`,
                        value: p.id,
                      }))}
                    onChange={(e) => setSelectedParticipantId(e.value)}
                    className='w-full'
                  />
                )}
              </div>
            </ScrollPanel>
          </Card>
        </div>
        <div className='flex-1'>
          <ScrollPanel className='w-full h-screen'>
            {selectedCharacter ? (
              <CharacterSheetPage
                loadedParticipant={participants.find((c) => c.id === selectedParticioantId)}
                editable={user.id === selectedCharacter.user_id}
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
          </ScrollPanel>
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
        </div>
      </Dialog>
    </>
  );
}

export default Room;
