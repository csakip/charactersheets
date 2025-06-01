import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import CharacterSheetBottom from "../components/CharacterSheetBottom";
import { Charsheet, starWarsAttributesAndSkills, StarWarsData } from "../constants";
import { saveCharsheet } from "../supabase";
import { FloatLabel } from "primereact/floatlabel";
import D6Value from "../components/D6Value";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ListBox } from "primereact/listbox";
import { format, parseDice, roll } from "../dice";
import Dice from "../components/Dice";
import { useHotkeys } from "react-hotkeys-hook";
import InputDialog from "../components/InputDialog";
import { findParentAttributeAndSkill } from "../utils";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";

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
  const [improveMode, setImproveMode] = useState(false);
  const [addSkillToAttribute, setAddSkillToAttribute] = useState<string | undefined>();
  const [newSkillName, setNewSkillName] = useState("");
  const [addSpecFunction, setAddSpecFunction] = useState<(specName: string) => void | undefined>();
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

  function updateSpec(spec, value) {
    if (value === 0) {
      const { skill } = findParentAttributeAndSkill(charsheetData.attributes, spec);
      skill.specs = skill.specs.filter((s) => s.name !== spec.name);
    }
    spec.value = value;
    updateData((prev) => ({
      ...prev,
    }));
  }

  const rollToast = useCallback(
    (label: string, value: number, severityOverride?: "success" | "info" | "warn" | "error") => {
      if (value < 3) {
        toast.current?.show({
          className: "toast-body",
          severity: "error",
          summary: "Oh!",
          icon: " ",
          detail: "Nincs dobható kocka.",
          life: 10000,
          closable: false,
        });
        return;
      }

      const rolled = roll(value, label);
      const summary = label + ": " + format(value);

      toast.current?.show({
        className: "toast-body",
        severity:
          severityOverride ??
          (charsheetData.stunned || charsheetData.wounded || charsheetData.wounded2
            ? "error"
            : "warn"),
        summary,
        icon: " ",
        detail: <Dice roll={rolled} />,
        life: 10000,
        closable: false,
      });
    },
    [charsheetData]
  );

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
        onClick={(l, v) => rollToast(l, v - woundModifier)}
        showArrows={improveMode}>
        {improveMode && (
          <Button
            severity='secondary'
            text
            size='small'
            className='m-0 p-0 px-1 ml-2'
            onClick={() =>
              setAddSpecFunction(() => (newSpec) => addNewSpec(attribute, skill, newSpec))
            }
            title='Új specializáció hozzáadása'>
            +S
          </Button>
        )}
      </D6Value>
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

  function addNewSpec(attributeName: string, skillName: string, specName: string) {
    if (!editable) return;
    const attribute = charsheetData.attributes.find((a) => a.name === attributeName);
    if (!attribute) return;
    const skill = attribute.skills.find((s) => s.name === skillName);
    if (!skill) return;
    if (!skill.specs) skill.specs = [];
    skill.specs?.push({ name: specName, value: 3 });
    updateData((prev) => ({
      ...prev,
    }));
    setAddSpecFunction(undefined);
  }

  function addNewWeapon() {
    if (!editable) return;
    charsheetData.weapons.push({ name: "", range: "", damage: "", notes: "" });
    updateData((prev) => ({
      ...prev,
    }));
  }

  function deleteWeapon(idx: number) {
    if (!editable) return;
    charsheetData.weapons.splice(idx, 1);
    updateData((prev) => ({
      ...prev,
    }));
  }

  function updateWeapon(idx: number, property: string, value: string) {
    const weapon = charsheetData.weapons[idx];
    weapon[property] = value;
    updateData((prev) => ({
      ...prev,
    }));
  }

  function getAttribtesSum() {
    return format(charsheetData.attributes.reduce((sum, a) => sum + a.value, 0));
  }

  function getSkillsSum() {
    return format(
      charsheetData.attributes.reduce(
        (sum, a) => sum + a.skills.reduce((sum, s) => sum + s.value, 0),
        0
      )
    );
  }

  function getSpecsSum() {
    return format(
      charsheetData.attributes.reduce(
        (sum, attribute) =>
          sum +
          attribute.skills.reduce(
            (skillSum, skill) =>
              skillSum + (skill.specs?.reduce((specSum, spec) => specSum + spec.value, 0) || 0),
            0
          ),
        0
      )
    );
  }

  const characterSkillNames = charsheetData.attributes.flatMap((a) => a.skills.map((s) => s.name));
  const woundModifier =
    (charsheetData.stunned ? 3 : 0) +
    (charsheetData.wounded ? 3 : 0) +
    (charsheetData.wounded2 ? 3 : 0);

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
              maxLength={20}
              value={charsheetData.species}
              onChange={(e) => updateData((prev) => ({ ...prev, species: e.target.value }))}
            />
            <label>Faj</label>
          </FloatLabel>
          <FloatLabel className='w-4rem'>
            <InputText
              className='w-full text-yellow-400 text-center'
              maxLength={5}
              value={charsheetData.gender}
              onChange={(e) => updateData((prev) => ({ ...prev, gender: e.target.value }))}
            />
            <label>Nem</label>
          </FloatLabel>
          <FloatLabel className='w-5rem'>
            <InputText
              className='w-full text-yellow-400 text-center'
              maxLength={5}
              value={charsheetData.age}
              onChange={(e) => updateData((prev) => ({ ...prev, age: e.target.value }))}
            />
            <label>Kor</label>
          </FloatLabel>
          <FloatLabel className='w-10rem'>
            <InputText
              className='w-full text-yellow-400'
              maxLength={20}
              value={charsheetData.playerName}
              onChange={(e) => updateData((prev) => ({ ...prev, playerName: e.target.value }))}
            />
            <label>Játékos</label>
          </FloatLabel>
        </div>
        <div className='flex gap-3'>
          <FloatLabel className='flex-1 flex'>
            <InputTextarea
              rows={1}
              autoResize
              spellCheck={false}
              className='flex-1 text-yellow-400 thin-scrollbar'
              maxLength={1000}
              value={charsheetData.physicalDescription}
              onChange={(e) =>
                updateData((prev) => ({ ...prev, physicalDescription: e.target.value }))
              }
            />
            <label>Külső megjelenés</label>
          </FloatLabel>
        </div>
        <div className='flex gap-3'>
          <FloatLabel className='flex-1 flex'>
            <InputTextarea
              rows={1}
              autoResize
              spellCheck={false}
              className='flex-1 text-yellow-400 thin-scrollbar'
              maxLength={2000}
              value={charsheetData.personality}
              onChange={(e) => updateData((prev) => ({ ...prev, personality: e.target.value }))}
            />
            <label>Személyiség, háttér, kapcsolatok, célkitűzések</label>
          </FloatLabel>
        </div>

        {improveMode && (
          <div className='flex w-full gap-5 text-xl'>
            <div>
              Főjellemzők: <span className='text-yellow-400'>{getAttribtesSum()}</span>
            </div>
            <div>
              Jártasságok: <span className='text-yellow-400'>{getSkillsSum()}</span>
            </div>
            <div>
              Specializációk: <span className='text-yellow-400'>{getSpecsSum()}</span>
            </div>
          </div>
        )}

        {/* Attributes */}
        <div className='flex-1 flex flex-column border-1 border-50 border-round p-3'>
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
                  onClick={(l, v) => rollToast(l, v - woundModifier)}
                />
                {findAttribute(starWarsAttributesAndSkills[idx].name)?.skills.map((s) => (
                  <Fragment key={s.name}>
                    <Skill attribute={starWarsAttributesAndSkills[idx].name} skill={s.name} />

                    {s.specs?.map((sp) => (
                      <D6Value
                        key={sp.name}
                        prefix='↳ '
                        label={sp.name}
                        parentValue={
                          findAttribute(starWarsAttributesAndSkills[idx].name).value + s.value
                        }
                        value={sp.value}
                        onChange={(value) => updateSpec(sp, value)}
                        showArrows={improveMode}
                        className='ml-3'
                        onClick={(l, v) => rollToast(l, v - woundModifier)}
                      />
                    ))}
                  </Fragment>
                ))}
                {improveMode && (
                  <Button
                    severity='secondary'
                    className='px-3 py-1'
                    text
                    size='small'
                    onClick={() => {
                      setAddSkillToAttribute(starWarsAttributesAndSkills[idx].name);
                    }}
                    title='Új jártasság hozzáadása'>
                    Új jártasság
                  </Button>
                )}
              </div>
            ))}
            {charsheetData.forceSensitive && (
              <>
                <div
                  className='flex gap-1 flex-column justify-content-start'
                  style={{ width: "calc(33.3% - 1.4rem)" }}>
                  <D6Value
                    label='Kontrol'
                    value={charsheetData.control || 0}
                    onChange={(value) => updateData((prev) => ({ ...prev, control: value }))}
                    showArrows={improveMode}
                    onClick={(l, v) => rollToast(l, v - woundModifier)}
                  />
                </div>
                <div
                  className='flex gap-1 flex-column justify-content-start'
                  style={{ width: "calc(33.3% - 1.4rem)" }}>
                  <D6Value
                    label='Észlelés'
                    value={charsheetData.sense || 0}
                    onChange={(value) => updateData((prev) => ({ ...prev, sense: value }))}
                    showArrows={improveMode}
                    onClick={(l, v) => rollToast(l, v - woundModifier)}
                  />
                </div>
                <div
                  className='flex gap-1 flex-column justify-content-start'
                  style={{ width: "calc(33.3% - 1.4rem)" }}>
                  <D6Value
                    label='Változtatás'
                    value={charsheetData.alter || 0}
                    onChange={(value) => updateData((prev) => ({ ...prev, alter: value }))}
                    showArrows={improveMode}
                    onClick={(l, v) => rollToast(l, v - woundModifier)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Weapons, other stats */}
        <div className='flex w-full gap-3'>
          <div className='w-8 flex flex-column gap-3'>
            <div className='w-full flex flex-column light-inputs'>
              <div className='w-full flex gap-3'>
                <div className='w-4 flex justify-content-between border-1 border-50 border-round p-3 align-items-center'>
                  <label>BLOKK</label>
                  <InputText
                    type='number'
                    className='w-2rem text-yellow-400 text-center'
                    maxLength={20}
                    value={charsheetData.block?.toString() || ""}
                    disabled={!improveMode}
                    onChange={(e) =>
                      updateData((prev) => ({ ...prev, block: parseInt(e.target.value) }))
                    }
                  />
                </div>
                <div className='w-4 flex justify-content-between border-1 border-50 border-round p-3 align-items-center'>
                  <label>KITÉRÉS</label>
                  <InputText
                    type='number'
                    className='w-2rem  text-yellow-400 text-center'
                    maxLength={20}
                    value={charsheetData.dodge?.toString() || ""}
                    disabled={!improveMode}
                    onChange={(e) =>
                      updateData((prev) => ({ ...prev, dodge: parseInt(e.target.value) }))
                    }
                  />
                </div>
                <div className='w-4 flex justify-content-between border-1 border-50 border-round p-3 align-items-center'>
                  <label>HÁRÍTÁS</label>
                  <InputText
                    type='number'
                    className='w-2rem  text-yellow-400 text-center'
                    maxLength={20}
                    value={charsheetData.parry?.toString() || ""}
                    disabled={!improveMode}
                    onChange={(e) =>
                      updateData((prev) => ({ ...prev, parry: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className='flex-1 flex flex-column light-inputs border-1 border-50 border-round p-3'>
              <div className='flex gap-1 mb-2 text-300 text-sm select-none'>
                <div className='w-4'>Fegyver</div>
                <div className='w-3 text-center'>Táv/Nehézség</div>
                <div className='w-1 text-center'>Sebzés</div>
                <div className='w-4 text-center'>Megjegzés</div>
              </div>
              {charsheetData.weapons.map((w, idx) => (
                <div className='w-100 flex gap-2 relative mb-1' key={idx}>
                  <InputText
                    className='w-4 text-yellow-400'
                    maxLength={20}
                    value={w.name}
                    disabled={!improveMode}
                    onChange={(e) => updateWeapon(idx, "name", e.target.value)}
                  />
                  <InputText
                    className='w-3 text-yellow-400 text-center'
                    maxLength={20}
                    value={w.range}
                    disabled={!improveMode}
                    onChange={(e) => updateWeapon(idx, "range", e.target.value)}
                  />
                  {improveMode ? (
                    <InputText
                      className='w-1 text-yellow-400 text-center'
                      maxLength={20}
                      value={w.damage}
                      disabled={!improveMode}
                      onChange={(e) => updateWeapon(idx, "damage", e.target.value)}
                    />
                  ) : (
                    <div
                      className='w-1 text-yellow-400 text-center cursor-pointer select-none fake-input'
                      onClick={() => {
                        if (parseDice(w.damage) !== 0)
                          rollToast(w.name, parseDice(w.damage), "warn");
                      }}>
                      {w.damage}
                    </div>
                  )}
                  <InputText
                    className='w-4 text-yellow-400'
                    maxLength={20}
                    value={w.notes}
                    onChange={(e) => updateWeapon(idx, "notes", e.target.value)}
                  />
                  {improveMode && (
                    <Button
                      severity='danger'
                      className='px-1 py-1 mx-0 absolute top-0 right-0'
                      text
                      size='small'
                      title='Fegyver törlése'
                      onClick={() => {
                        deleteWeapon(idx);
                      }}>
                      <i className='pi pi-times text-xs'></i>
                    </Button>
                  )}
                </div>
              ))}
              {improveMode && (
                <Button
                  severity='secondary'
                  className='px-1 py-1 mt-2'
                  text
                  size='small'
                  onClick={() => {
                    addNewWeapon();
                  }}>
                  Új fegyver hozzáadása
                </Button>
              )}
            </div>
          </div>
          <div className='flex-1 flex flex-column gap-3'>
            <div className='flex-1 flex flex-column border-1 border-50 border-round p-3'>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Mozgás</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  {improveMode ? (
                    <InputText
                      type='number'
                      className='w-3rem text-right text-yellow-400'
                      value={charsheetData.move?.toString() || ""}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          move: e.target.value
                            ? Math.min(20, Math.max(1, parseInt(e.target.value)))
                            : 10,
                        }))
                      }
                    />
                  ) : (
                    <span className='w-3rem text-yellow-400 mr-1'>{charsheetData.move}</span>
                  )}
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Erő pontok</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  {improveMode ? (
                    <InputText
                      type='number'
                      className='w-3rem text-right text-yellow-400'
                      value={charsheetData.forcePoints?.toString() || ""}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          forcePoints: e.target.value
                            ? Math.min(50, Math.max(0, parseInt(e.target.value)))
                            : 1,
                        }))
                      }
                    />
                  ) : (
                    <span className='w-3rem text-yellow-400 mr-1'>{charsheetData.forcePoints}</span>
                  )}
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Erő érzékeny</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  {improveMode ? (
                    <Checkbox
                      className='text-yellow-400'
                      checked={charsheetData.forceSensitive}
                      disabled={!improveMode}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          forceSensitive: e.checked,
                        }))
                      }
                    />
                  ) : charsheetData.forceSensitive ? (
                    "Igen"
                  ) : (
                    "Nem"
                  )}
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Sötét oldal pontok</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  {improveMode ? (
                    <InputText
                      type='number'
                      className='w-3rem text-right text-yellow-400'
                      value={charsheetData.darkSidePoints?.toString() || ""}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          darkSidePoints: e.target.value
                            ? Math.min(6, Math.max(1, parseInt(e.target.value)))
                            : 0,
                        }))
                      }
                    />
                  ) : (
                    <span className='w-3rem text-yellow-400 mr-1'>
                      {charsheetData.darkSidePoints}
                    </span>
                  )}
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Karakter pontok</span>
                <span
                  className={`font-medium text-yellow-400 ml-auto select-none light-inputs flex`}>
                  <InputText
                    type='number'
                    className='w-3rem text-right text-yellow-400'
                    value={charsheetData.characterPoints?.toString() || ""}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        characterPoints: e.target.value ? Math.max(0, parseInt(e.target.value)) : 0,
                      }))
                    }
                    onFocus={(e) => e.target.select()}
                  />
                  <div className='flex flex-column justify-items-start'>
                    <i
                      className='pi pi-chevron-up arrowButton'
                      onClick={() =>
                        updateData((prev) => ({
                          ...prev,
                          characterPoints: charsheetData.characterPoints + 1,
                        }))
                      }
                    />
                    <i
                      className='pi pi-chevron-down arrowButton'
                      onClick={() =>
                        updateData((prev) => ({
                          ...prev,
                          characterPoints: charsheetData.characterPoints - 1,
                        }))
                      }
                    />
                  </div>
                </span>
              </div>
            </div>
            <div className='flex-1 flex flex-column border-1 border-50 border-round p-3'>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Erő energia ellen</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  {improveMode ? (
                    <InputText
                      className='w-3rem text-right text-yellow-400'
                      value={charsheetData.saveAgainstEnergy || ""}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          saveAgainstEnergy: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span
                      className='w-3rem text-yellow-400 mr-1 cursor-pointer'
                      onClick={() => {
                        if (!charsheetData.saveAgainstEnergy?.toLowerCase().includes("k")) return;
                        rollToast(
                          "Erő dobás energia ellen",
                          parseDice(charsheetData.saveAgainstEnergy),
                          "warn"
                        );
                      }}>
                      {charsheetData.saveAgainstEnergy}
                    </span>
                  )}
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Erő fizikai ellen</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  {improveMode ? (
                    <InputText
                      className='w-3rem text-right text-yellow-400'
                      value={charsheetData.saveAgainstPhysical || ""}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          saveAgainstPhysical: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span
                      className='w-3rem text-yellow-400 mr-1 cursor-pointer'
                      onClick={() => {
                        if (!charsheetData.saveAgainstPhysical?.toLowerCase().includes("k")) return;
                        rollToast(
                          "Erő dobás fizikai ellen",
                          parseDice(charsheetData.saveAgainstPhysical),
                          "warn"
                        );
                      }}>
                      {charsheetData.saveAgainstPhysical}
                    </span>
                  )}
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Kábult</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  <Checkbox
                    className='text-yellow-400'
                    checked={charsheetData.stunned}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        stunned: e.checked,
                      }))
                    }
                  />
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Sebesült</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  <Checkbox
                    className='text-yellow-400'
                    checked={charsheetData.wounded}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        wounded: e.checked,
                      }))
                    }
                  />
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Súlyosan sebesült</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  <Checkbox
                    className='text-yellow-400'
                    checked={charsheetData.wounded2}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        wounded2: e.checked,
                      }))
                    }
                  />
                </span>
              </div>
              <div className='flex align-content-start mb-2'>
                <span className='font-medium select-none'>Magatehetetlen</span>
                <span className={`font-medium text-yellow-400 ml-auto select-none light-inputs`}>
                  <Checkbox
                    className='text-yellow-400'
                    checked={charsheetData.incapacitated}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        incapacitated: e.checked,
                      }))
                    }
                  />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className='flex w-full gap-3'>
          <div className='flex-1 flex flex-column gap-4 justify-content-start'>
            <FloatLabel className='w-full'>
              <InputTextarea
                rows={5}
                autoResize
                spellCheck={false}
                className='w-full text-yellow-400 thin-scrollbar text-sm'
                maxLength={1000}
                value={charsheetData.notes}
                onChange={(e) => updateData((prev) => ({ ...prev, notes: e.target.value }))}
              />
              <label>Jegyzetek</label>
            </FloatLabel>
            <FloatLabel className='w-full'>
              <InputTextarea
                rows={2}
                autoResize
                spellCheck={false}
                className='w-full text-yellow-400 thin-scrollbar text-sm'
                maxLength={1000}
                value={charsheetData.specialAbilities}
                onChange={(e) =>
                  updateData((prev) => ({ ...prev, specialAbilities: e.target.value }))
                }
              />
              <label>Különleges képességek</label>
            </FloatLabel>
          </div>
          <div className='flex-1 flex flex-column'>
            <FloatLabel className='flex-1 flex'>
              <InputTextarea
                rows={5}
                autoResize
                spellCheck={false}
                className='flex-1 text-yellow-400 thin-scrollbar text-sm'
                maxLength={2000}
                value={charsheetData.equipment}
                onChange={(e) => updateData((prev) => ({ ...prev, equipment: e.target.value }))}
              />
              <label>Felszerelés</label>
            </FloatLabel>
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

      <InputDialog
        visible={!!addSpecFunction}
        onHide={() => setAddSpecFunction(undefined)}
        onSave={addSpecFunction}
        title='Specializáció hozzáadása'
        content='Új specializáció neve'
        defaultValue={""}
      />
    </>
  );
}
