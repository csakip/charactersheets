import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { useEffect, useState } from "react";
import { systems } from "../utils";

export default function NewCharacterDialog({
  visible,
  onHide,
  onSave,
  system,
}: {
  visible: boolean;
  onHide: () => void;
  onSave: (value: string, rollChecked?: boolean, system?: string) => void;
  system?: string;
}) {
  const [value, setValue] = useState("");
  const [rollChecked, setRollChecked] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(system || "");

  useEffect(() => {
    if (visible) {
      setValue("");
      setRollChecked(false);
    }
  }, [visible]);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header='Új karakter'
      style={{ width: 600 }}
      onShow={() => {
        document.getElementById("value").focus();
      }}
      modal
      footer={
        <div>
          <Button label='Mégse' icon='pi pi-times' onClick={onHide} className='p-button-text' />
          <Button
            label='Létrehozás'
            icon='pi pi-check'
            onClick={() => onSave(value, rollChecked, selectedSystem)}
            disabled={!value.trim()}
          />
        </div>
      }>
      <div className='flex flex-column gap-2'>
        {!system && (
          <div className='flex flex-column gap-2'>
            <label>Rendszer</label>
            <Dropdown
              value={selectedSystem}
              options={systems}
              onChange={(e) => setSelectedSystem(e.value)}
              placeholder='Válassz rendszert!'
            />
          </div>
        )}
        <div className='flex flex-column gap-2'>
          <label htmlFor='value'>Játékos neve</label>
          <InputText
            id='value'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave(value, rollChecked, selectedSystem)}
          />
          {selectedSystem === "wodu" && (
            <div className='mt-1'>
              <Checkbox
                onChange={(e) => setRollChecked(e.checked)}
                checked={rollChecked}
                inputId='rollChecked'
              />

              <label htmlFor='rollChecked' className='ml-2 '>
                Kidobott tulajdonságokkal?
              </label>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
