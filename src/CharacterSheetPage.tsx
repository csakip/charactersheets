import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Fragment } from "react/jsx-runtime";
import { abilities, attributes, Participant, skills } from "./config";
import { useEffect, useState, useRef } from "react";
import { deleteCharacter, saveCharacter } from "./supabase";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";

export default function CharacterSheetPage({
  loadedParticipant,
  editable,
}: {
  loadedParticipant: Participant;
  editable: boolean;
}) {
  const [participant, setParticipant] = useState<Participant>(loadedParticipant);
  const [isDirty, setIsDirty] = useState(false);
  const toast = useRef<Toast>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const participantRef = useRef(participant);

  useEffect(() => {
    setParticipant(loadedParticipant);
    return () => {
      if (isDirty) {
        setIsDirty(false);
        saveCharacter(participantRef.current);
      }
    };
  }, [loadedParticipant]);

  useEffect(() => {
    if (!isDirty) return;

    const timeoutId = setTimeout(() => {
      saveCharacter(participantRef.current);
      setIsDirty(false);
    }, 2000); // Delay the save by 2 seconds after the last change

    return () => clearTimeout(timeoutId); // Clear the timer if `isDirty` changes again
  }, [participant, isDirty]);

  function updateCharacter(value: (prev: any) => any) {
    if (!editable) return;
    const newParticipant = {
      ...participant,
      charsheet: value(participant.charsheet),
    };
    setParticipant(newParticipant);
    participantRef.current = structuredClone(newParticipant);
    setIsDirty(true);
  }

  const handleAttributeChange = (attr: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value);
    updateCharacter((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr.toLowerCase()]: numValue,
      },
    }));
  };

  const toggleSkill = (skill: string) => {
    updateCharacter((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleAbility = (ability: string) => {
    updateCharacter((prev) => ({
      ...prev,
      abilities: prev.abilities.includes(ability)
        ? prev.abilities.filter((a) => a !== ability)
        : [...prev.abilities, ability],
    }));
  };

  const handleArmorTypeChange = (type: string, checked: boolean) => {
    if (type === "Pajzs") {
      updateCharacter((prev) => ({ ...prev, shield: checked }));
    } else {
      updateCharacter((prev) => ({ ...prev, armor: checked ? type : prev.armor }));
    }
  };

  const handleDeleteCharacter = async () => {
    const success = await deleteCharacter(participant.id);
    if (success) {
      toast.current?.show({
        severity: "success",
        summary: "Siker",
        detail: "A karakter sikeresen törölve",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Hiba",
        detail: "Nem sikerült törölni a karaktert",
        life: 3000,
      });
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <div className='flex flex-column gap-4 p-4' style={{ maxWidth: "1000px", margin: "auto" }}>
        {/* Top Fields */}
        <div className='flex gap-4'>
          <InputText
            placeholder='Név'
            className='flex-1'
            value={participant.charsheet.name}
            onChange={(e) => updateCharacter((prev) => ({ ...prev, name: e.target.value }))}
          />
          <InputText
            placeholder='Kaszt'
            className='w-10rem'
            value={participant.charsheet.class}
            onChange={(e) => updateCharacter((prev) => ({ ...prev, class: e.target.value }))}
          />
          <InputText
            placeholder='Játékos'
            className='w-10rem'
            value={participant.charsheet.playerName}
            onChange={(e) => updateCharacter((prev) => ({ ...prev, playerName: e.target.value }))}
          />
          <div className='flex align-items-center gap-2'>
            <span>Szint</span>
            <InputText
              className='w-3rem text-center'
              value={participant.charsheet.level?.toString() || ""}
              onChange={(e) =>
                updateCharacter((prev) => ({
                  ...prev,
                  level: e.target.value ? parseInt(e.target.value) : 0,
                }))
              }
            />
          </div>
        </div>

        {/* Attributes */}
        <div className='flex justify-content-between gap-4'>
          <div className='flex justify-content-between flex-row w-4 flex-wrap align-content-start'>
            <div className='w-full text-center font-bold mb-3'>Tulajdonságok</div>

            {attributes.map((attr) => (
              <div key={attr.label} className='flex flex-row align-items-center w-6 mb-3'>
                <InputText
                  className='w-4rem text-center p-inputtext-lg p-2 text-4xl'
                  value={
                    participant.charsheet.attributes[
                      attr.label.toLowerCase() as keyof typeof participant.charsheet.attributes
                    ]?.toString() || "0"
                  }
                  onChange={(e) => handleAttributeChange(attr.label.slice(0, 3), e.target.value)}
                />
                <span className='font-bold ml-3 text-3xl'>{attr.label}</span>
              </div>
            ))}
          </div>

          {/* Skills and Abilities */}
          <div className='flex w-3 flex-column'>
            <div className='w-full text-center font-bold mb-3'>Képzettségek</div>
            <div className='flex-1 border-1 border-round surface-border p-3 justify-content-between flex flex-column'>
              {skills.map((skill) => (
                <div key={skill} className='flex justify-content-between align-items-center'>
                  <span>{skill}</span>
                  <Checkbox
                    checked={participant.charsheet.skills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className='flex w-5 flex-column'>
            <div className='w-full text-center font-bold mb-3'>Különleges képességek</div>
            <div className='flex-1 border-1 border-round surface-border p-3'>
              <div className='grid'>
                {abilities.map((ab, idx) => (
                  <Fragment key={ab}>
                    <div className='col-6 flex justify-content-between align-items-center p-1'>
                      <span>{ab}</span>
                      <Checkbox
                        checked={participant.charsheet.abilities.includes(ab)}
                        onChange={() => toggleAbility(ab)}
                      />
                    </div>
                    {(idx + 1) % 4 === 0 && idx !== abilities.length - 1 && (
                      <hr className='w-full' />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weapons & Equipment */}
        <div className='flex gap-4'>
          <InputTextarea
            autoResize
            rows={5}
            placeholder='Fegyverek'
            className='flex-1'
            value={participant.charsheet.weapons}
            onChange={(e) => updateCharacter((prev) => ({ ...prev, weapons: e.target.value }))}
          />
          <InputTextarea
            autoResize
            rows={5}
            placeholder='Felszerelés'
            className='flex-1'
            value={participant.charsheet.gear}
            onChange={(e) => updateCharacter((prev) => ({ ...prev, gear: e.target.value }))}
          />
        </div>

        {/* Armor and HP */}
        <div className='flex flex-wrap gap-4 align-items-center justify-content-between'>
          {["Nincs", "Könnyű", "Teljes", "Pajzs"].map((label) => (
            <div key={label} className='flex align-items-center gap-2'>
              <Checkbox
                checked={
                  label === "Pajzs"
                    ? participant.charsheet.shield
                    : participant.charsheet.armor === label
                }
                onChange={(e) => handleArmorTypeChange(label, e.checked)}
              />
              {label}
            </div>
          ))}
          <div className='flex align-items-center gap-2'>
            <span>Össz páncél</span>
            <InputText
              className='w-3rem text-center'
              value={participant.charsheet.sumArmor?.toString() || ""}
              onChange={(e) =>
                updateCharacter((prev) => ({
                  ...prev,
                  sumArmor: e.target.value ? parseInt(e.target.value) : 0,
                }))
              }
            />
          </div>
          <div className='flex align-items-center gap-2'>
            <span>HP kocka</span>
            <InputText
              className='w-3rem text-center'
              value={participant.charsheet.hpDice?.toString() || ""}
              onChange={(e) =>
                updateCharacter((prev) => ({
                  ...prev,
                  hpDice: e.target.value ? parseInt(e.target.value) : 0,
                }))
              }
            />
          </div>
          <div className='flex align-items-center gap-2'>
            <span>HP</span>
            <InputText
              className='w-3rem text-center'
              value={participant.charsheet.hp?.toString() || ""}
              onChange={(e) =>
                updateCharacter((prev) => ({
                  ...prev,
                  hp: e.target.value ? parseInt(e.target.value) : 0,
                }))
              }
            />
          </div>
        </div>

        {/* Notes */}
        <div className='flex gap-4'>
          <InputTextarea
            autoResize
            rows={3}
            placeholder='Jegyzetek'
            className='w-full'
            value={participant.charsheet.notesLeft}
            onChange={(e) => updateCharacter((prev) => ({ ...prev, notesLeft: e.target.value }))}
          />
          <InputTextarea
            autoResize
            rows={3}
            placeholder='Jegyzetek'
            className='w-full'
            value={participant.charsheet.notesRight}
            onChange={(e) => updateCharacter((prev) => ({ ...prev, notesRight: e.target.value }))}
          />
        </div>

        {/* Bottom */}
        <div className='flex gap-4'>
          <div className='flex align-items-center gap-2 flex-1 justify-content-center'>
            <span>Pénz</span>
            <InputText
              className='w-10rem text-center'
              value={participant.charsheet.money}
              onChange={(e) => updateCharacter((prev) => ({ ...prev, money: e.target.value }))}
            />
          </div>
          <div className='flex align-items-center gap-2 flex-1 justify-content-center'>
            <span>Köv. szint</span>
            <InputText
              className='w-6rem text-center'
              value={participant.charsheet.nextLevel?.toString() || ""}
              onChange={(e) =>
                updateCharacter((prev) => ({
                  ...prev,
                  nextLevel: e.target.value ? parseInt(e.target.value) : 0,
                }))
              }
            />
          </div>
          <div className='flex align-items-center gap-2 flex-1 justify-content-center'>
            <span>XP</span>
            <InputText
              className='w-6rem text-center'
              value={participant.charsheet.xp?.toString() || ""}
              onChange={(e) =>
                updateCharacter((prev) => ({
                  ...prev,
                  xp: e.target.value ? parseInt(e.target.value) : 0,
                }))
              }
            />
          </div>
        </div>
        {editable && (
          <>
            <div className='flex align-items-center gap-2 flex-1 justify-content-end mt-3'>
              <Button
                severity='danger'
                size='small'
                text
                onClick={() => setShowDeleteConfirm(true)}>
                Karakter törlése
              </Button>
            </div>
          </>
        )}
      </div>
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
    </>
  );
}
