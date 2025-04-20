import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useEffect, useState } from "react";

export default function InputDialog({
  visible,
  onHide,
  onSave,
  title,
  content,
  defaultValue,
}: {
  visible: boolean;
  onHide: () => void;
  onSave: (value: string) => void;
  title: string;
  content: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue && visible) {
      setValue(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={title}
      style={{ width: 600 }}
      onShow={() => {
        document.getElementById("input").focus();
      }}
      modal
      footer={
        <div>
          <Button label='Mégse' icon='pi pi-times' onClick={onHide} className='p-button-text' />
          <Button
            label='Mehet'
            icon='pi pi-check'
            onClick={() => onSave(value)}
            disabled={!value.trim()}
          />
        </div>
      }>
      <div className='flex flex-column gap-2'>
        <label htmlFor='input'>{content}</label>
        <InputText
          id='input'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave(value)}
        />
      </div>
    </Dialog>
  );
}
