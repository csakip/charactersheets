import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCharacterToRoom, characterExitRoom, deleteCharsheet } from "../supabase";
import { Charsheet } from "../constants";
import RoomDialog from "./RoomDialog";

export default function CharacterSheetBottom({
  charsheet,
  setCharsheet,
  children,
}: {
  charsheet: Charsheet;
  setCharsheet: (charsheet: Charsheet) => void;
  children?: React.ReactNode;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExitRoomConfirm, setShowExitRoomConfirm] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);

  const navigate = useNavigate();

  const toast = useRef<Toast>(null);

  const handleDeleteCharacter = async () => {
    const success = await deleteCharsheet(charsheet.id);
    if (success) {
      toast.current?.show({
        severity: "success",
        summary: "Siker",
        detail: "A karakter sikeresen törölve.",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Hiba",
        detail: "Nem sikerült törölni a karaktert.",
        life: 3000,
      });
    }
  };

  function handleExitRoom() {
    const success = characterExitRoom(charsheet.id);
    if (success) {
      setShowExitRoomConfirm(false);
      setCharsheet({ ...charsheet, room_id: undefined });
      toast.current?.show({
        severity: "success",
        summary: "Siker",
        detail: "A karakter sikeresen kilépett a szobából.",
        life: 3000,
      });
    }
  }

  async function addToRoom(roomId: number) {
    setCharsheet({ ...charsheet, room_id: roomId });
    const success = await addCharacterToRoom(roomId, charsheet.id);
    if (success) {
      navigate(`/${roomId}`);
    }
    setShowRoomDialog(false);
  }

  return (
    <>
      <div className='flex mb-3 mt-1 justify-content-end'>
        {children}
        {charsheet.room_id && (
          <Button severity='warning' size='small' text onClick={() => setShowExitRoomConfirm(true)}>
            Kilépés a szobából
          </Button>
        )}
        {!charsheet.room_id && (
          <Button severity='warning' size='small' text onClick={() => setShowRoomDialog(true)}>
            Belépés egy szobába
          </Button>
        )}
        <Button severity='danger' size='small' text onClick={() => setShowDeleteConfirm(true)}>
          Karakter törlése
        </Button>
      </div>
      <Toast ref={toast} />

      <ConfirmDialog
        visible={showExitRoomConfirm}
        onHide={() => setShowExitRoomConfirm(false)}
        message='Biztosan kilépsz a szobából?'
        header='Megerősítés'
        icon='pi pi-exclamation-circle'
        accept={handleExitRoom}
        acceptLabel='Igen'
        rejectLabel='Nem'
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        message='Biztosan törölni szeretnéd ezt a karaktert?'
        header='Megerősítés'
        icon='pi pi-exclamation-circle'
        accept={handleDeleteCharacter}
        acceptLabel='Igen'
        rejectLabel='Nem'
      />

      <RoomDialog
        visible={showRoomDialog}
        onHide={() => setShowRoomDialog(false)}
        system={charsheet.system}
        onSave={addToRoom}
      />
    </>
  );
}
