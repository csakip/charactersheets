import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { ListBox } from "primereact/listbox";

export default function TransferDialog({ visible, onHide, onSave }: { visible: boolean; onHide: () => void; onSave: (value: string) => void }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchUsersInRoom();
    }
  }, [visible]);

  const fetchUsersInRoom = async () => {
    const { data, error } = await supabase.rpc("get_users");

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setUsers(data);
    console.log(data);
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header='Válassz felhasználót!'
      style={{ width: 600 }}
      modal
      footer={
        <div>
          <Button label='Mégse' icon='pi pi-times' onClick={onHide} className='p-button-text' />
        </div>
      }>
      {!!users.length && (
        <ListBox
          options={users.map((p) => ({
            label: p.email,
            value: p.id,
          }))}
          onChange={(e) => {
            onSave(e.value);
          }}
          className='w-full'
        />
      )}
    </Dialog>
  );
}
