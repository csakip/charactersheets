import { User } from "@supabase/supabase-js";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { ListBox } from "primereact/listbox";
import { ScrollPanel } from "primereact/scrollpanel";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { logout, saveRoom, supabase } from "./supabase";
import { useNavigate } from "react-router";
import { Dropdown } from "primereact/dropdown";
import { systems } from "./utils";
import { Checkbox } from "primereact/checkbox";

function Rooms({ user }: { user: User }) {
  const [rooms, setRooms] = useState([]);
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [selectedSystem, setSelectedSystem] = useState();
  const [isPrivate, setIsPrivate] = useState(true);
  const toast = useRef<Toast>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const createRoom = async () => {
    if (newRoomName.trim()) {
      const room = {
        name: newRoomName.trim(),
        user_id: user.id,
        system: selectedSystem,
        private: isPrivate,
        description: newRoomDescription.trim() || "",
      };
      await saveRoom(room);
      setShowNewRoomDialog(false);
      setNewRoomName("");
      setNewRoomDescription("");
      setSelectedSystem(null);
      setIsPrivate(true);
      fetchRooms();
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <div className={`flex sidebar-open`}>
        <div className={`sidebar-container flex flex-column align-items-center h-screen`}>
          <Card
            title={
              <div className='hidden-nowrap'>
                Szobák
                <Button
                  className='ml-2'
                  icon='pi pi-sync'
                  severity='secondary'
                  text
                  pt={{ root: { className: "p-1" } }}
                  onClick={fetchRooms}
                />
              </div>
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
                {!!rooms.length && (
                  <ListBox
                    options={rooms.map((p) => ({
                      label: (
                        <>
                          <span className='font-semibold'>{p.name}</span>
                          <span className='text-sm text-300 ml-1'>
                            -&nbsp;
                            {systems.find((s) => s.value === p.system)?.label}
                          </span>
                        </>
                      ),
                      value: p.id,
                    }))}
                    onChange={(e) => {
                      navigate(`/${e.value}`);
                    }}
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
            <div className='flex align-items-center justify-content-center h-full'>
              <Button onClick={() => setShowNewRoomDialog(true)}>Új szoba létrehozása</Button>
            </div>
          </div>
        </div>
      </div>
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
              disabled={!newRoomName.trim()}
            />
          </div>
        }>
        <div className='flex flex-column gap-3'>
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
            <label htmlFor='roomDescription'>Szoba leírása</label>
            <InputText
              id='roomDescription'
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createRoom()}
            />
          </div>
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
            <div className='flex align-items-center'>
              <Checkbox
                inputId='privateRoom'
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.checked)}
                className='mr-2'
              />
              <label htmlFor='privateRoom'>A szoba csak számodra elérhető</label>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default Rooms;
