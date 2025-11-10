import arrowCreate, { DIRECTION } from "arrows-svg";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Editor } from "primereact/editor";
import { InputText } from "primereact/inputtext";
import { useEffect, useRef, useState } from "react";
import CharacterSheetBottom from "../components/CharacterSheetBottom";
import {
  Charsheet,
  mothershipClasses,
  mothershipClassSkills,
  mothershipClassTexts,
  MothershipData,
  mothershipSkillConnections,
  mothershipSkills,
  mothershipTraumaReactions,
} from "../constants";
import { saveCharsheet } from "../supabase";
import { asNumber } from "../utils";

export default function MoShCharacterSheetPage({
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
  const editorNotesRef = useRef(null);
  const editorGearRef = useRef(null);
  const [improveMode, setImproveMode] = useState(false);

  const charsheetData = charsheet.data as MothershipData;

  const modules = {
    toolbar: [
      [{ header: 1 }, { header: 2 }, { header: 3 }, "bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }, { list: "check" }, { align: [] }],
    ],
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImproveMode(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    setImproveMode(editable && (loadedCharsheet.data as MothershipData).strength === 0);
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
    if (improveMode) makeArrows();
    return () => {
      document.querySelectorAll("svg.arrow").forEach((el) => el.remove());
    };
  }, [improveMode]);

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

  const toggleSkill = (skill: string) => {
    toggleStringListItem("skills", skill);
  };

  const toggleStringListItem = (property: string, item: string) => {
    updateData((prev) => ({
      ...prev,
      [property]: prev[property].includes(item) ? prev[property].filter((s) => s !== item) : [...prev[property], item],
    }));
  };

  function editorSelectionChange(e, editorRef) {
    if (e.range && e.range.length > 0) {
      editorRef.current.getElement().classList.add("has-selection");
    } else {
      editorRef.current.getElement().classList.remove("has-selection");
    }
  }

  function makeArrows() {
    try {
      [0, 1].forEach((col) =>
        mothershipSkillConnections[col].forEach((skill) => {
          const [fromId, toId] = skill;
          const from = document.getElementById(`skillnode_${col}_${fromId}`).querySelector("label");
          const to = document.getElementById(`skillnode_${col + 1}_${toId}`);

          const arrow = arrowCreate({
            from: {
              node: from,
              direction: DIRECTION.RIGHT,
              translation: [0.7, 0],
            },
            to: {
              node: to,
              direction: DIRECTION.LEFT,
              translation: [-0.7, 0],
            },
            head: { func: "normal", size: 4 },
          });
          document.body.appendChild(arrow.node);
        })
      );
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <div
        className='charactersheet mosh flex gap-3 p-4 mt-3 mx-2 border-round-md align-items-stretch flex-row'
        style={{ backgroundColor: "#1f2937", border: improveMode ? "1px solid #fbbf24" : "transparent" }}>
        <div className='w-6'>
          {/* Top Fields */}
          <div className='flex gap-2'>
            <InputText
              placeholder='Név'
              className='flex-1 text-yellow-400'
              maxLength={50}
              disabled={!improveMode}
              value={charsheetData.name}
              onChange={(e) => updateData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <InputText
              placeholder='Játékos'
              className='w-10rem text-yellow-400'
              value={charsheetData.playerName}
              maxLength={50}
              disabled={!improveMode}
              onChange={(e) => updateData((prev) => ({ ...prev, playerName: e.target.value }))}
            />
            <div className='flex align-items-center gap-2'>
              <span>Rekord</span>
              <InputText
                maxLength={2}
                className='w-3rem text-center text-yellow-400'
                disabled={!improveMode}
                value={charsheetData.highScore?.toString() || ""}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    highScore: e.target.value ? Math.min(50, Math.max(0, asNumber(e.target.value))) : 1,
                  }))
                }
              />
            </div>
          </div>
          <div className='flex gap-2 mt-3 flex-column'>
            {/* Attributes */}
            <div className='flex flex-column w-full'>
              <div className='w-full text-center font-bold mb-3'>
                Tulajdonságok{improveMode && <span className='text-sm text-300 ml-1'>(2D10+25)</span>}
              </div>
              <div className='flex'>
                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    disabled={!improveMode}
                    value={charsheetData.strength?.toString() || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateData((prev) => ({ ...prev, strength: asNumber(e.target.value) }))}
                  />
                  <span className='font-bold mt-2 text-xl'>ERŐ</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    disabled={!improveMode}
                    value={charsheetData.speed?.toString() || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateData((prev) => ({ ...prev, speed: asNumber(e.target.value) }))}
                  />
                  <span className='font-bold mt-2 text-xl'>SEBESSÉG</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    disabled={!improveMode}
                    value={charsheetData.intellect?.toString() || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateData((prev) => ({ ...prev, intellect: asNumber(e.target.value) }))}
                  />
                  <span className='font-bold mt-2 text-xl'>ELME</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    disabled={!improveMode}
                    value={charsheetData.combat?.toString() || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateData((prev) => ({ ...prev, combat: asNumber(e.target.value) }))}
                  />
                  <span className='font-bold mt-2 text-xl'>HARC</span>
                </div>
              </div>
            </div>

            {/* Saves */}
            <div className='flex flex-column w-full'>
              <div className='w-full text-center font-bold mb-3'>Mentők{improveMode && <span className='text-sm text-300 ml-1'>(2D10+10)</span>}</div>
              <div className='flex justify-content-center'>
                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    disabled={!improveMode}
                    value={charsheetData.sanity?.toString() || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateData((prev) => ({ ...prev, sanity: asNumber(e.target.value) }))}
                  />
                  <span className='font-bold mt-2 text-xl'>ÉPELME</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    disabled={!improveMode}
                    value={charsheetData.fear?.toString() || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateData((prev) => ({ ...prev, fear: asNumber(e.target.value) }))}
                  />
                  <span className='font-bold mt-2 text-xl'>FÉLELEM</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    disabled={!improveMode}
                    value={charsheetData.body?.toString() || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateData((prev) => ({ ...prev, body: asNumber(e.target.value) }))}
                  />
                  <span className='font-bold mt-2 text-xl'>TEST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Class */}
          <div className='flex gap-4 mt-3 w-full'>
            <div className='flex flex-1 gap-1 justify-content-between'>
              {improveMode &&
                mothershipClasses.map(
                  (cls, idx) =>
                    cls && (
                      <div key={cls}>
                        <div className='flex align-items-center w-3'>
                          <Checkbox checked={charsheetData.class === cls} onChange={() => updateData((prev) => ({ ...prev, class: cls }))} />
                          <span className='ml-2'>{cls}</span>
                        </div>
                        {mothershipClassTexts[idx - 1].map((text, idx) => (
                          <div key={idx} className='text-300 text-sm ml-4'>
                            {text}
                          </div>
                        ))}
                      </div>
                    )
                )}
              {!improveMode && charsheetData.class && (
                <div className='mt-3'>
                  <b className='text-yellow-400'>Karakter kaszt:</b> <b>{charsheetData.class || ""}</b>
                </div>
              )}
            </div>
          </div>
          {mothershipTraumaReactions[charsheetData.class] && (
            <div className='mt-1'>
              <b className='text-yellow-400'>Trauma reakció:</b> {mothershipTraumaReactions[charsheetData.class] || ""}
            </div>
          )}

          {/* Health */}
          <div className='flex flex-1 gap-4 mt-3 w-full'>
            <div className='flex flex-1 flex-column gap-1 justify-content-center align-items-center'>
              <span className='text-lg font-bold text-center'>
                Életerő
                {improveMode && (
                  <>
                    <br />
                    <span className='text-sm text-300'>(1D10+10)</span>
                  </>
                )}
              </span>
              <div className='flex w-full border-1 border-bluegray-700 border-round border-3 justify-content-around border-round-3xl w-8rem dark-background'>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  onFocus={(e) => e.target.select()}
                  maxLength={2}
                  value={charsheetData.currentHealth?.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, currentHealth: asNumber(e.target.value) }))}
                />
                <div className='text-300 align-self-center'>/</div>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  onFocus={(e) => e.target.select()}
                  maxLength={2}
                  disabled={!improveMode}
                  value={charsheetData.health?.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, health: asNumber(e.target.value) }))}
                />
              </div>
              <div className='w-full text-sm text-300 text-center'>
                <span>Jelenlegi / Maximum</span>
              </div>
            </div>

            <div className='flex flex-1 flex-column gap-1 justify-content-center align-items-center'>
              <span className='text-lg font-bold'>Sebek</span>
              <div className='flex w-full border-1 border-bluegray-700 border-round border-3 justify-content-around border-round-3xl w-8rem dark-background'>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  onFocus={(e) => e.target.select()}
                  maxLength={1}
                  value={charsheetData.currentWounds?.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, currentWounds: asNumber(e.target.value) }))}
                />
                <div className='text-300 align-self-center'>/</div>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  onFocus={(e) => e.target.select()}
                  maxLength={1}
                  disabled={!improveMode}
                  value={charsheetData.wounds?.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, wounds: asNumber(e.target.value) }))}
                />
              </div>
              <div className='w-full text-sm text-300 text-center'>
                <span>Jelenlegi / Maximum (2)</span>
              </div>
            </div>

            <div className='flex flex-1 flex-column gap-1 justify-content-center align-items-center'>
              <span className='text-lg font-bold'>Stressz</span>
              <div className='flex w-full border-1 border-bluegray-700 border-round border-3 justify-content-around border-round-3xl w-8rem dark-background'>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  onFocus={(e) => e.target.select()}
                  maxLength={2}
                  value={charsheetData.currentStress?.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, currentStress: asNumber(e.target.value) }))}
                />
                <div className='text-300 align-self-center'>/</div>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  onFocus={(e) => e.target.select()}
                  maxLength={2}
                  disabled={!improveMode}
                  value={charsheetData.minimumStress?.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, minimumStress: asNumber(e.target.value) }))}
                />
              </div>
              <div className='w-full text-sm text-300 text-center'>
                <span>Jelenlegi / Minimum (2)</span>
              </div>
            </div>
          </div>

          {/* Trinket */}
          <div className='flex gap-2 mt-5'>
            <InputText
              placeholder='Kabala'
              className='w-6 text-yellow-400'
              maxLength={100}
              disabled={!improveMode}
              value={charsheetData.trinket}
              onChange={(e) => updateData((prev) => ({ ...prev, trinket: e.target.value }))}
            />
            <InputText
              placeholder='Felvarró'
              className='w-6 text-yellow-400'
              value={charsheetData.patch}
              disabled={!improveMode}
              maxLength={100}
              onChange={(e) => updateData((prev) => ({ ...prev, patch: e.target.value }))}
            />
          </div>

          {/* Gear and notes */}
          <div className='flex gap-2 mt-5 w-full'>
            <div className='flex flex-1 gap-4 editor-container dark-background'>
              <div className='flex-1 flex relative'>
                <label className='custom-label'>Felszerelés</label>
                {editable ? (
                  <Editor
                    ref={editorGearRef}
                    showHeader={false}
                    spellCheck={false}
                    className='w-full text-yellow-400 relative'
                    pt={{
                      content: { className: "ql-editor-hover text-md border-1 border-bluegray-700 border-round flex-1" },
                      toolbar: { style: { position: "absolute" } },
                    }}
                    maxLength={1000}
                    value={charsheetData.gear}
                    onTextChange={(e) => updateData((prev) => ({ ...prev, gear: e.htmlValue }))}
                    modules={modules}
                    onSelectionChange={(e) => editorSelectionChange(e, editorGearRef)}
                  />
                ) : (
                  <div
                    className='editor-static text-yellow-400 text-md flex-1 px-3 py-2 border-1 border-bluegray-700 border-round dark-background'
                    dangerouslySetInnerHTML={{ __html: charsheetData.gear || "&nbsp;" }}></div>
                )}
              </div>
            </div>
            <div className='flex flex-1 gap-4 editor-container dark-background'>
              <div className='flex-1 flex relative'>
                <label className='custom-label'>Jegyzetek</label>
                {editable ? (
                  <Editor
                    ref={editorNotesRef}
                    showHeader={false}
                    spellCheck={false}
                    className='w-full text-yellow-400 relative'
                    pt={{
                      content: { className: "ql-editor-hover text-md border-1 border-bluegray-700 border-round flex-1" },
                      toolbar: { style: { position: "absolute" } },
                    }}
                    maxLength={1000}
                    value={charsheetData.notes}
                    onTextChange={(e) => updateData((prev) => ({ ...prev, notes: e.htmlValue }))}
                    modules={modules}
                    onSelectionChange={(e) => editorSelectionChange(e, editorNotesRef)}
                  />
                ) : (
                  <div
                    className='editor-static text-yellow-400 text-md flex-1 px-3 py-2 border-1 border-bluegray-700 border-round dark-background'
                    dangerouslySetInnerHTML={{ __html: charsheetData.notes || "&nbsp;" }}></div>
                )}
              </div>
            </div>
          </div>

          <div className='mt-3 flex flex-1 justify-content-around align-items-end'>
            <div className='flex justify-content-center flex-column gap-1 align-items-center'>
              <span className='text-lg font-bold'>Páncél pontok</span>
              <div className='flex w-full justify-content-center'>
                <InputText
                  maxLength={2}
                  className='w-4rem text-center p-2 text-xl text-yellow-400 border-round-3xl border-3'
                  value={charsheetData.armorPoints?.toString() || ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateData((prev) => ({ ...prev, armorPoints: asNumber(e.target.value) }))}
                />
              </div>
            </div>

            <div className='flex justify-content-center flex-column gap-1 align-items-center'>
              <div>
                <span className='text-lg font-bold'>Kredit</span>
                {improveMode && <span className='text-sm text-300 ml-1'>(2D10x10)</span>}
              </div>
              <div className='flex w-full justify-content-center'>
                <InputText
                  maxLength={10}
                  className='w-10rem text-center p-2 text-xl text-yellow-400 border-round-3xl border-3'
                  value={charsheetData.credits?.toString() || ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateData((prev) => ({ ...prev, credits: asNumber(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className='flex gap-3 flex-1 flex-column'>
          {/* Skills and Abilities */}
          <div className='flex-1 border-1 border-round border-bluegray-700 p-2 pt-3 flex flex-wrap align-content-start row-gap-2'>
            {improveMode && charsheetData.class && (
              <div className='text-center w-full text-left text-300 mb-2'>
                <span className='font-bold text-yellow-400'>Induló képzettségek: </span>
                {mothershipClassSkills[charsheetData.class]}
              </div>
            )}
            <div className='flex flex-column w-4 h-3rem align-items-center my-1'>
              <b className='text-xl'>Képzett</b>
              <span className='text-sm text-300'>(+10 Bónusz)</span>
            </div>
            <div className='flex flex-column w-4 h-3rem align-items-center my-1'>
              <b className='text-xl'>Szakértő</b>
              <span className='text-sm text-300'>(+15 Bónusz)</span>
            </div>
            <div className='flex flex-column w-4 h-3rem align-items-center my-1'>
              <b className='text-xl'>Mester</b>
              <span className='text-sm text-300'>(+20 Bónusz)</span>
            </div>
            {[0, 1, 2].map((colIdx) => (
              <div key={colIdx} className='flex flex-column flex-1 gap-3 w-4 skill-container'>
                {mothershipSkills[colIdx]
                  .filter((s) => improveMode || charsheetData.skills.includes(s))
                  .map((skill, idx) => (
                    <div
                      key={idx}
                      id={`skillnode_${colIdx}_${idx}`}
                      className={`flex align-items-center gap-2 ${charsheetData.skills.includes(skill) ? "text-900" : "text-300"}`}>
                      {skill !== "" ? (
                        <Checkbox
                          inputId={`skill_${skill.replaceAll(" ", "_")}`}
                          value={skill}
                          disabled={!improveMode}
                          className={improveMode ? "" : "hidden"}
                          checked={charsheetData.skills.includes(skill)}
                          onChange={() => toggleSkill(skill)}
                        />
                      ) : (
                        <span style={{ height: 22 }}></span>
                      )}
                      <label
                        htmlFor={`skill_${skill.replaceAll(" ", "_")}`}
                        className={improveMode ? "cursor-pointer" : "ml-1 text-yellow-400"}
                        title={skill}>
                        {skill}
                      </label>
                    </div>
                  ))}
              </div>
            ))}
          </div>
          <div className='flex flex-column gap-2'>
            <div className='text-300 text-sm'>Képzés</div>
            <div className='flex gap-2'>
              <InputText
                placeholder='Folyamatban'
                className='flex-1 text-yellow-400'
                maxLength={50}
                disabled={!improveMode}
                value={charsheetData.skillTraining}
                onChange={(e) => updateData((prev) => ({ ...prev, skillTraining: e.target.value }))}
              />
              <InputText
                placeholder='Hátralévő idő'
                className='flex-1 text-yellow-400'
                value={charsheetData.skillTimeRemaining}
                disabled={!improveMode}
                maxLength={50}
                onChange={(e) => updateData((prev) => ({ ...prev, skillTimeRemaining: e.target.value }))}
              />
            </div>
            <div className='text-300 text-sm'>Állapotok</div>
            <div className='flex gap-2'>
              <InputText
                className='flex-1 text-yellow-400'
                maxLength={150}
                value={charsheetData.conditions}
                onChange={(e) => updateData((prev) => ({ ...prev, conditions: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>
      {editable && (
        <CharacterSheetBottom
          charsheet={charsheet}
          setCharsheet={(c) => {
            setIsDirty(true);
            setCharsheet(c);
          }}>
          <Button size='small' text onClick={() => setImproveMode(!improveMode)}>
            {improveMode ? "Váltás játék módba" : "Karakter fejlesztése"}
          </Button>
        </CharacterSheetBottom>
      )}
    </>
  );
}
