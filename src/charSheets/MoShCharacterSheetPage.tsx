import { Checkbox } from "primereact/checkbox";
import { Editor } from "primereact/editor";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import CharacterSheetBottom from "../components/CharacterSheetBottom";
import { Charsheet, mothershipClasses, mothershipClassTexts, MothershipData, mothershipSkills, mothershipTraumaReactions } from "../constants";
import { saveCharsheet } from "../supabase";

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
  const toast = useRef<Toast>(null);
  const editorNotesRef = useRef(null);

  const charsheetData = charsheet.data as MothershipData;

  const modules = {
    toolbar: [
      [{ header: 1 }, { header: 2 }, { header: 3 }, "bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }, { list: "check" }, { align: [] }],
    ],
  };

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

  return (
    <>
      <Toast ref={toast} />
      <div className='charactersheet mosh flex gap-3 p-4 mt-3 mx-2 border-round-md align-items-stretch flex-row' style={{ backgroundColor: "#1f2937" }}>
        <div className='w-6'>
          {/* Top Fields */}
          <div className='flex gap-2'>
            <InputText
              placeholder='Név'
              className='flex-1 text-yellow-400'
              maxLength={50}
              value={charsheetData.name}
              onChange={(e) => updateData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <InputText
              placeholder='Játékos'
              className='w-10rem text-yellow-400'
              value={charsheetData.playerName}
              maxLength={50}
              onChange={(e) => updateData((prev) => ({ ...prev, playerName: e.target.value }))}
            />
            <div className='flex align-items-center gap-2'>
              <span>Rekord</span>
              <InputText
                maxLength={2}
                className='w-3rem text-center text-yellow-400'
                value={charsheetData.highScore?.toString() || ""}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    highScore: e.target.value ? Math.min(50, Math.max(0, parseInt(e.target.value))) : 1,
                  }))
                }
              />
            </div>
          </div>
          <div className='flex gap-2 mt-3 flex-column'>
            {/* Attributes */}
            <div className='flex flex-column w-full'>
              <div className='w-full text-center font-bold mb-3'>Tulajdonságok (2D10+25)</div>
              <div className='flex'>
                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    value={charsheetData.strength.toString() || ""}
                    onChange={(e) => updateData((prev) => ({ ...prev, strength: e.target.value }))}
                  />
                  <span className='font-bold mt-2 text-xl'>ERŐ</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    value={charsheetData.speed.toString() || ""}
                    onChange={(e) => updateData((prev) => ({ ...prev, speed: e.target.value }))}
                  />
                  <span className='font-bold mt-2 text-xl'>SEBESSÉG</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    value={charsheetData.intellect.toString() || ""}
                    onChange={(e) => updateData((prev) => ({ ...prev, intellect: e.target.value }))}
                  />
                  <span className='font-bold mt-2 text-xl'>ELME</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    value={charsheetData.combat.toString() || ""}
                    onChange={(e) => updateData((prev) => ({ ...prev, combat: e.target.value }))}
                  />
                  <span className='font-bold mt-2 text-xl'>HARC</span>
                </div>
              </div>
            </div>

            {/* Saves */}
            <div className='flex flex-column w-full'>
              <div className='w-full text-center font-bold mb-3'>Mentők (2D10+10)</div>
              <div className='flex justify-content-center'>
                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    value={charsheetData.sanity.toString() || ""}
                    onChange={(e) => updateData((prev) => ({ ...prev, sanity: e.target.value }))}
                  />
                  <span className='font-bold mt-2 text-xl'>ÉPELME</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    value={charsheetData.fear.toString() || ""}
                    onChange={(e) => updateData((prev) => ({ ...prev, fear: e.target.value }))}
                  />
                  <span className='font-bold mt-2 text-xl'>FÉLELEM</span>
                </div>

                <div className='flex flex-column align-items-center w-3 mb-3'>
                  <InputText
                    maxLength={2}
                    className='w-4rem text-center p-inputtext-lg p-2 text-4xl text-yellow-400 font-bold border-circle border-3'
                    value={charsheetData.body.toString() || ""}
                    onChange={(e) => updateData((prev) => ({ ...prev, body: e.target.value }))}
                  />
                  <span className='font-bold mt-2 text-xl'>TEST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Class */}
          <div className='flex gap-4 mt-3 w-full'>
            <div className='flex flex-1 gap-1 justify-content-between'>
              {mothershipClasses.map(
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
            </div>
          </div>
          {mothershipTraumaReactions[charsheetData.class] && (
            <div className='mt-3'>
              <b className='text-yellow-400'>Trauma reakció:</b> {mothershipTraumaReactions[charsheetData.class] || ""}
            </div>
          )}

          {/* Health */}
          <div className='flex flex-1 gap-4 mt-3 w-full'>
            <div className='flex flex-1 flex-column gap-1 justify-content-center align-items-center'>
              <span className='text-lg font-bold text-yellow-400'>Életerő</span>
              <div className='flex w-full border-1 border-bluegray-700 border-round border-3 justify-content-around border-round-3xl w-8rem'>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  maxLength={2}
                  value={charsheetData.currentHealth.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, currentHealth: e.target.value }))}
                />
                <div className='text-300 align-self-center'>/</div>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  maxLength={2}
                  value={charsheetData.health.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, health: e.target.value }))}
                />
              </div>
              <div className='w-full text-sm text-300 text-center'>
                <span>Jelenlegi / Maximum</span>
              </div>
            </div>

            <div className='flex flex-1 flex-column gap-1 justify-content-center align-items-center'>
              <span className='text-lg font-bold text-yellow-400'>Sebek</span>
              <div className='flex w-full border-1 border-bluegray-700 border-round border-3 justify-content-around border-round-3xl w-8rem'>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  maxLength={2}
                  value={charsheetData.currentWounds.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, currentWounds: e.target.value }))}
                />
                <div className='text-300 align-self-center'>/</div>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  maxLength={2}
                  value={charsheetData.wounds.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, wounds: e.target.value }))}
                />
              </div>
              <div className='w-full text-sm text-300 text-center'>
                <span>Jelenlegi / Maximum</span>
              </div>
            </div>

            <div className='flex flex-1 flex-column gap-1 justify-content-center align-items-center'>
              <span className='text-lg font-bold text-yellow-400'>Stressz</span>
              <div className='flex w-full border-1 border-bluegray-700 border-round border-3 justify-content-around border-round-3xl w-8rem'>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  maxLength={2}
                  value={charsheetData.currentStress.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, currentStress: e.target.value }))}
                />
                <div className='text-300 align-self-center'>/</div>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  maxLength={2}
                  value={charsheetData.minimumStress.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, minimumStress: e.target.value }))}
                />
              </div>
              <div className='w-full text-sm text-300 text-center'>
                <span>Jelenlegi / Minimum</span>
              </div>
            </div>
          </div>

          {/* Trinket */}
          <div className='flex gap-2 mt-5'>
            <InputText
              placeholder='Kabala'
              className='w-6 text-yellow-400 bg-transparent'
              maxLength={100}
              value={charsheetData.trinket}
              onChange={(e) => updateData((prev) => ({ ...prev, trinket: e.target.value }))}
            />
            <InputText
              placeholder='Felvarró'
              className='w-6 text-yellow-400 bg-transparent'
              value={charsheetData.patch}
              maxLength={100}
              onChange={(e) => updateData((prev) => ({ ...prev, patch: e.target.value }))}
            />
          </div>

          {/* Gear and notes */}
          <div className='flex gap-4 editor-container mt-5'>
            <div className='flex-1 flex relative'>
              <label className='custom-label'>Felszerelés / Jegyzetek</label>
              {editable ? (
                <Editor
                  ref={editorNotesRef}
                  showHeader={false}
                  spellCheck={false}
                  className='w-full text-yellow-400 relative'
                  pt={{
                    content: { className: "text-md border-1 border-50 border-round flex-1" },
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
                  className='editor-static text-yellow-400 text-md flex-1 px-3 py-2 border-1 border-50 border-round'
                  dangerouslySetInnerHTML={{ __html: charsheetData.notes }}></div>
              )}
            </div>
          </div>

          <div className='mt-3 flex flex-1 justify-content-between'>
            <div className='flex justify-content-center flex-column gap-1 align-items-center'>
              <span className='text-lg font-bold text-yellow-400'>Páncél pontok</span>
              <div className='flex w-full border-1 border-bluegray-700 border-round border-3 justify-content-around border-round-3xl w-6rem'>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  maxLength={2}
                  value={charsheetData.armorPoints.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, armorPoints: e.target.value }))}
                />
              </div>
            </div>

            <div className='mt-3 flex justify-content-center flex-column gap-1 align-items-center'>
              <div>
                <span className='text-lg font-bold text-yellow-400'>Kredit </span>
                <span className='text-sm text-300'>(2D10x10)</span>
              </div>
              <div className='flex w-full border-1 border-bluegray-700 border-round border-3 justify-content-around border-round-3xl w-6rem'>
                <InputText
                  className='transparent text-yellow-400 text-xl'
                  maxLength={2}
                  value={charsheetData.credits.toString() || ""}
                  onChange={(e) => updateData((prev) => ({ ...prev, credits: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className='flex gap-3 flex-1 flex-column'>
          {/* Skills and Abilities */}

          <div className='flex-1 border-1 border-round border-bluegray-700 p-2 pt-3 flex flex-wrap align-content-start row-gap-2'>
            <div className='text-center w-4 h-3rem'>
              Képzett
              <br />
              <span className='text-sm text-300'>(+10 Bónusz)</span>
            </div>
            <div className='text-center w-4 h-3rem'>
              Szakértő
              <br />
              <span className='text-sm text-300'>(+15 Bónusz)</span>
            </div>
            <div className='text-center w-4 h-1rem'>
              Mester
              <br />
              <span className='text-sm text-300'>(+20 Bónusz)</span>
            </div>
            {[0, 1, 2].map((colIdx) => (
              <div key={colIdx} className='flex flex-column flex-1 gap-3 w-4 skill-container'>
                {mothershipSkills[colIdx].map((skill, idx) => (
                  <div key={idx} className={`flex align-items-center gap-2 ${charsheetData.skills.includes(skill) ? "text-900" : "text-300"}`}>
                    {skill !== "" ? (
                      <Checkbox inputId={`skill_${skill.replaceAll(" ", "_")}`} value={skill} checked={charsheetData.skills.includes(skill)} onChange={() => toggleSkill(skill)} />
                    ) : (
                      <span style={{ height: 22 }}></span>
                    )}
                    <label htmlFor={`skill_${skill.replaceAll(" ", "_")}`} className='cursor-pointer' title={skill}>
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {editable && <CharacterSheetBottom charsheet={charsheet} setCharsheet={setCharsheet} />}
    </>
  );
}
