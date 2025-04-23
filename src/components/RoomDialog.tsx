import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { ListBox } from "primereact/listbox";
import { useStore } from "../store";

export default function RoomDialog({
  visible,
  system,
  onHide,
  onSave,
}: {
  visible: boolean;
  system: string;
  onHide: () => void;
  onSave: (value: number) => void;
}) {
  const [rooms, setRooms] = useState([]);

  const user = useStore((state) => state.user);

  useEffect(() => {
    if (visible) {
      fetchRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("system", system)
      .or(`user_id.eq.${user.id},private.eq.false`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching rooms:", error);
      return;
    }

    setRooms(data);
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header='Válassz szobát!'
      style={{ width: 600 }}
      modal
      footer={
        <div>
          <Button label='Mégse' icon='pi pi-times' onClick={onHide} className='p-button-text' />
        </div>
      }>
      {!!rooms.length && (
        <ListBox
          options={rooms.map((p) => ({
            label: p.name,
            value: p.id,
          }))}
          onChange={(e) => {
            onSave(e.value as number);
          }}
          className='w-full'
        />
      )}
    </Dialog>
  );
}
