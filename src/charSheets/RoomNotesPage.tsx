import { InputTextarea } from "primereact/inputtextarea";
import { useEffect, useRef, useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";

export default function RoomNotesPage({
  text,
  setText,
}: {
  text: string;
  setText: (text: string) => void;
}) {
  const [notes, setNotes] = useState(text);
  const updateTimer = useRef(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(text);
    setSaving(false);
  }, [text]);

  useEffect(() => {
    if (text === notes) return;
    setSaving(true);
    // throttle setText
    if (updateTimer.current) {
      clearTimeout(updateTimer.current);
    }
    updateTimer.current = setTimeout(() => {
      setSaving(false);
      setText(notes);
    }, 1000);

    return () => clearTimeout(updateTimer.current);
  }, [notes]);

  return (
    <>
      <div
        className='charactersheet starwars flex flex-column gap-4 p-4 mt-3 border-round-md'
        style={{ maxWidth: "1000px", margin: "auto", backgroundColor: "#1f2937" }}>
        <h3 className='font-bold m-0'>
          Közös jegyzetek
          {saving && (
            <ProgressSpinner className='h-1rem w-2rem' strokeWidth='8' animationDuration='750' />
          )}
        </h3>
        <div className='flex flex-1 gap-3'>
          <InputTextarea
            autoResize
            spellCheck={false}
            className='flex-1 text-yellow-400 thin-scrollbar'
            maxLength={10000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
