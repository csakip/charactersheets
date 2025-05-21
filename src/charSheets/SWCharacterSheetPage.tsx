import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useCallback, useEffect, useRef, useState } from "react";
import CharacterSheetBottom from "../components/CharacterSheetBottom";
import { Charsheet, starWarsAttributesAndSkills, StarWarsData } from "../constants";
import { saveCharsheet } from "../supabase";
import { FloatLabel } from "primereact/floatlabel";
import D6Value from "../components/D6Value";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ListBox } from "primereact/listbox";
import { format, roll } from "../dice";
import Dice from "../components/Dice";
import { useHotkeys } from "react-hotkeys-hook";

export default function SWCharacterSheetPage({
  loadedCharsheet,
  editable,
  updateCharacterDisplay,
}: {
  loadedCharsheet: Charsheet;
  editable: boolean;
  updateCharacterDisplay: (charsheet: Charsheet) => void;
}) {
  const [charsheet, setCharsheet] = useState<Charsheet>(loadedCharsheet);
  const [isDirty, setIsDirty] = useState(false);
  const [improveMode, setImproveMode] = useState(true);
  const [addSkillToAttribute, setAddSkillToAttribute] = useState<string | undefined>();
  const [newSkillName, setNewSkillName] = useState("");
  const toast = useRef<Toast>(null);

  const charsheetData = charsheet.data as StarWarsData;

  useEffect(() => {
    setCharsheet(loadedCharsheet);
    return () => {
      if (isDirty) {
        setIsDirty(false);
        saveCharsheet(charsheet);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedCharsheet]);

  useEffect(() => {
    if (!isDirty) return;

    updateCharacterDisplay(charsheet);

    const timeoutId = setTimeout(() => {
      saveCharsheet(charsheet);
      setIsDirty(false);
    }, 1000); // Delay the save

    return () => clearTimeout(timeoutId); // Clear the timer if `isDirty` changes again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charsheet, isDirty]);

  function updateData(value: (prev: any) => any) {
    if (!editable) return;
    const newCharsheet = {
      ...charsheet,
      data: value(charsheetData),
    };
    setCharsheet(newCharsheet);
    setIsDirty(true);
  }

  function findAttribute(attr: string) {
    return charsheetData.attributes.find((a) => a.name === attr);
  }

  const updateAttribute = (attr: string, value: number) => {
    if (!editable) return;

    const attribute = charsheetData.attributes.find((a) => a.name === attr);
    if (!attr) return;

    attribute.value = value;

    updateData((prev) => ({
      ...prev,
    }));
  };

  function updateSkill(attribute: string, skill: string, value: number) {
    if (!editable) return;
    const characterAttribute = charsheetData.attributes.find((a) => a.name === attribute);
    const characterSkill = characterAttribute?.skills.find((s) => s.name === skill);
    if (!characterSkill) return;

    if (value === 0) {
      // remove skill from the array
      characterAttribute.skills = characterAttribute.skills.filter((s) => s.name !== skill);
    } else {
      characterSkill.value = value;
    }
    updateData((prev) => ({
      ...prev,
    }));
  }

  const rollToast = useCallback((label, value) => {
    toast.current?.show({
      className: "toast-body",
      severity: "warn",
      summary: label + ": " + format(value),
      icon: " ",
      detail: <Dice roll={roll(value, label)} />,
      life: 10000,
      closable: false,
    });
  }, []);

  const onHotkeys = useCallback(
    (e) => {
      const key = e.key === "0" ? 10 : parseInt(e.key);
      rollToast("Dobás", key * 3);
    },
    [rollToast]
  );

  useHotkeys("1,2,3,4,5,6,7,8,9,0", onHotkeys);

  function Skill({ attribute, skill }: { attribute: string; skill: string }) {
    const characterSkill = charsheetData.attributes
      .find((a) => a.name === attribute)
      ?.skills.find((s) => s.name === skill);
    // if (!characterSkill) return <></>;
    return (
      <D6Value
        className='ml-3'
        label={skill}
        parentValue={findAttribute(attribute)?.value || 0}
        value={characterSkill?.value || 0}
        onChange={(value) => updateSkill(attribute, skill, value)}
        onClick={rollToast}
        showArrows={improveMode}
      />
    );
  }

  function addNewSkill(attributeName: string, skillName: string) {
    if (!editable) return;
    const attribute = charsheetData.attributes.find((a) => a.name === attributeName);
    if (!attribute) return;
    attribute.skills.push({ name: skillName, value: 1 });
    updateData((prev) => ({
      ...prev,
    }));
    setAddSkillToAttribute(undefined);
  }

  const characterSkillNames = charsheetData.attributes.flatMap((a) => a.skills.map((s) => s.name));

  return (
    <>
      <Toast ref={toast} position='bottom-right' pt={{ root: { className: "w-18rem" } }} />
      <div
        className='charactersheet starwars flex flex-column gap-4 p-4 mt-3 border-round-md'
        style={{ maxWidth: "1000px", margin: "auto", backgroundColor: "#1f2937" }}>
        <div className='flex gap-3'>
          <FloatLabel className='flex-1'>
            <InputText
              className='w-full text-yellow-400'
              maxLength={50}
              value={charsheetData.name}
              onChange={(e) => updateData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <label>Név</label>
          </FloatLabel>
          <FloatLabel className='w-10rem'>
            <InputText
              className='w-full text-yellow-400'
              maxLength={50}
              value={charsheetData.species}
              onChange={(e) => updateData((prev) => ({ ...prev, species: e.target.value }))}
            />
            <label>Faj</label>
          </FloatLabel>
          <FloatLabel className='w-5rem'>
            <InputText
              className='w-full text-yellow-400'
              maxLength={50}
              value={charsheetData.gender}
              onChange={(e) => updateData((prev) => ({ ...prev, gender: e.target.value }))}
            />
            <label>Nem</label>
          </FloatLabel>
          <FloatLabel className='w-5rem'>
            <InputText
              className='w-full text-yellow-400'
              maxLength={50}
              value={charsheetData.age}
              onChange={(e) => updateData((prev) => ({ ...prev, age: e.target.value }))}
            />
            <label>Kor</label>
          </FloatLabel>
          <FloatLabel className='w-10rem'>
            <InputText
              className='w-full text-yellow-400'
              maxLength={50}
              value={charsheetData.playerName}
              onChange={(e) => updateData((prev) => ({ ...prev, playerName: e.target.value }))}
            />
            <label>Játékos</label>
          </FloatLabel>
        </div>
        <div className='flex gap-3'>
          <FloatLabel className='flex-1'>
            <InputText
              className='w-full text-yellow-400'
              maxLength={50}
              value={charsheetData.physicalDescription}
              onChange={(e) =>
                updateData((prev) => ({ ...prev, physicalDescription: e.target.value }))
              }
            />
            <label>Külső megjelenés</label>
          </FloatLabel>
        </div>
        <div className='flex gap-3'>
          <FloatLabel className='flex-1'>
            <InputText
              className='w-full text-yellow-400'
              maxLength={50}
              value={charsheetData.personality}
              onChange={(e) => updateData((prev) => ({ ...prev, personality: e.target.value }))}
            />
            <label>Személyiség</label>
          </FloatLabel>
        </div>
        {/* Attributes */}
        <div className='flex-1 flex flex-column'>
          <div className='flex gap-5 flex-wrap'>
            {starWarsAttributesAndSkills.map((a, idx) => (
              <div
                key={idx}
                className='flex gap-1 flex-column justify-content-start'
                style={{ width: "calc(33.3% - 1.4rem)" }}>
                <D6Value
                  label={starWarsAttributesAndSkills[idx].name}
                  value={findAttribute(starWarsAttributesAndSkills[idx].name)?.value || 0}
                  onChange={(value) =>
                    updateAttribute(starWarsAttributesAndSkills[idx].name, value)
                  }
                  minValue={3}
                  showArrows={improveMode}
                  onClick={rollToast}
                />
                {findAttribute(starWarsAttributesAndSkills[idx].name)?.skills.map((s) => (
                  <Skill
                    key={s.name}
                    attribute={starWarsAttributesAndSkills[idx].name}
                    skill={s.name}
                  />
                ))}
                {improveMode && (
                  <Button
                    severity='secondary'
                    text
                    size='small'
                    onClick={() => {
                      setAddSkillToAttribute(starWarsAttributesAndSkills[idx].name);
                    }}>
                    Új jártasság
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {editable && (
        <CharacterSheetBottom charsheet={charsheet} setCharsheet={setCharsheet}>
          <Button size='small' text onClick={() => setImproveMode(!improveMode)}>
            {improveMode ? "Váltás játék módba" : "Karakter fejlesztése"}
          </Button>
        </CharacterSheetBottom>
      )}

      <Dialog
        visible={!!addSkillToAttribute}
        onHide={() => {
          setAddSkillToAttribute(undefined);
          setNewSkillName("");
        }}
        style={{ width: "600px" }}
        header='Válassz jártasságot!'
        modal
        footer={
          <Button
            label='Mégse'
            onClick={() => {
              setAddSkillToAttribute(undefined);
              setNewSkillName("");
            }}
            className='p-button-text'
          />
        }>
        <div className='flex flex-column gap-2'>
          <ListBox
            options={starWarsAttributesAndSkills
              .find((a) => a.name === addSkillToAttribute)
              ?.skills.filter((s) => !characterSkillNames.includes(s))}
            onChange={(e) => addNewSkill(addSkillToAttribute, e.value)}
            className='w-full'
            emptyMessage='Nincs több választható jártasság'
          />
          <span className='p-float-label mt-4'>
            <label htmlFor='newSkillName'>Listában nem szereplő jártasság</label>
            <div className='p-inputgroup flex-1'>
              <InputText
                id='newSkillName'
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className='w-full'
              />

              <Button
                icon='pi pi-check'
                onClick={() => addNewSkill(addSkillToAttribute, newSkillName)}
              />
            </div>
          </span>
        </div>
      </Dialog>
    </>
  );
}
