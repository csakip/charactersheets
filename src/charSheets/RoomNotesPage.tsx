import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import { User } from "@supabase/supabase-js";

export default function RoomNotesPage({ roomId, user }: { roomId: string; user: User }) {
  const [saving, setSaving] = useState(false);
  const timeout = useRef(null);
  const [triggerSave, setTriggerSave] = useState(false);
  const firstLoad = useRef(true);

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: { attributes: { class: "flex-1 outline-none my-0" } },
    onUpdate: () => {
      setTriggerSave(!triggerSave);
    },
  });

  useEffect(() => {
    function fetchRoomNotes() {
      supabase
        .from("room_notes")
        .select("text")
        .eq("room_id", roomId)
        .then(({ data, error }) => {
          if (error) {
            console.error(error);
          } else {
            if (data[0]) {
              editor?.commands.setContent(data[0].text);
            }
          }
        });
    }

    fetchRoomNotes();
    return () => {
      editor?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    const channel = supabase
      .channel("room_notes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_notes",
          filter: `room_id=eq.${roomId}`, // dynamic filtering
        },
        (payload) => {
          // @ts-expect-error but there is
          if (payload.new.lastEditedBy !== user.id) {
            // @ts-expect-error but there is
            editor?.commands.setContent(payload.new.text);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    function saveRoomNotes() {
      supabase
        .from("room_notes")
        .upsert({ room_id: roomId, text: editor.getHTML(), lastEditedBy: user.id })
        .eq("room_id", roomId)
        .then(() => setSaving(false));
    }

    setSaving(true);
    timeout.current = setTimeout(saveRoomNotes, 3000);

    return () => {
      setSaving(false);
      clearTimeout(timeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSave]);

  return (
    <>
      <div
        className='charactersheet starwars flex flex-column  p-4 mt-3 border-round-md'
        style={{ maxWidth: "1000px", margin: "auto", backgroundColor: "#1f2937" }}>
        <h3 className='font-bold mt-0 mb-2'>
          Közös jegyzetek
          {saving && (
            <ProgressSpinner className='h-1rem w-2rem' strokeWidth='8' animationDuration='750' />
          )}
        </h3>

        <div className='flex gap-2 mb-2'>
          <Button
            size='small'
            text
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={(editor.isActive("h1") ? "font-bold text-white" : "") + " p-1"}>
            <b>H1</b>
          </Button>
          <Button
            size='small'
            text
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={(editor.isActive("h2") ? "font-bold text-white" : "") + " p-1"}>
            <b>H2</b>
          </Button>
          <Button
            size='small'
            text
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={(editor.isActive("h3") ? "font-bold text-white" : "") + " p-1"}>
            <b>H3</b>
          </Button>
          <Button
            size='small'
            text
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={(editor.isActive("bold") ? "font-bold text-white" : "") + " p-1"}>
            <b>B</b>
          </Button>
          <Button
            size='small'
            text
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={(editor.isActive("italic") ? "italic text-white" : "") + " p-1"}>
            <i>I</i>
          </Button>
          <Button
            size='small'
            text
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={(editor.isActive("bulletList") ? "text-white" : "") + " p-1"}>
            <span>• Lista</span>
          </Button>
          <Button
            size='small'
            text
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={(editor.isActive("orderedList") ? "text-white" : "") + " p-1"}>
            <span># Lista</span>
          </Button>
          {/* Add more buttons as needed */}
        </div>
        <EditorContent
          editor={editor}
          className='flex-1 flex text-yellow-400 thin-scrollbar p-inputtextarea p-inputtext p-component p-filled flex-column py-0'
        />
      </div>
    </>
  );
}
