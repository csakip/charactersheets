import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Fragment, useEffect, useRef, useState } from "react";
import CharacterSheetBottom from "./components/CharacterSheetBottom";
import { deleteCharsheet, saveCharsheet } from "./supabase";
import { BitDClasses, BladesData, Charsheet } from "./constants";
import Dots from "./components/Dots";
import { InputTextarea } from "primereact/inputtextarea";
import { FloatLabel } from "primereact/floatlabel";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";

export default function BladesCharacterSheetPage({
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const charsheetData = charsheet.data as BladesData;

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

  const handleAttributeXpChange = (attr: string, value: number) => {
    const newAttr = structuredClone(charsheetData.attributes);
    newAttr.find((a) => a.name === attr).xp = value;
    updateData((prev) => ({
      ...prev,
      attributes: newAttr,
    }));
  };

  const handleActionChange = (attr: string, action: string, value: number) => {
    const newAttr = structuredClone(charsheetData.attributes);
    newAttr.find((a) => a.name === attr).values.find((a) => a.name === action).value = value;
    updateData((prev) => ({
      ...prev,
      attributes: newAttr,
    }));
  };

  const handleDeleteCharacter = async () => {
    if (!editable) return;
    const success = await deleteCharsheet(charsheet.id);
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

  function calculateAttribute(attr) {
    // Add one for each action in the attr.value if it's > 0
    return attr.values.reduce((count, action) => count + (action.value > 0 ? 1 : 0), 0);
  }

  return (
    <>
      <Toast ref={toast} />
      <div
        className='charactersheet blades flex gap-3 p-4 mt-3 mx-2 border-round-md align-items-stretch flex-column md:flex-row'
        style={{ margin: "auto", backgroundColor: "#1f2937" }}>
        <div className='flex gap-4 flex-column w-full flex-1' style={{ maxWidth: "40rem" }}>
          {/* Top Fields */}
          <div className='flex w-full gap-2'>
            <FloatLabel className='flex-1 flex'>
              <InputText
                className='flex-1 text-yellow-400'
                maxLength={50}
                value={charsheetData.alias}
                onChange={(e) => updateData((prev) => ({ ...prev, alias: e.target.value }))}
              />
              <label>Név</label>
            </FloatLabel>
            <FloatLabel className='flex-1 flex'>
              <InputText
                className='flex-1 text-yellow-400'
                maxLength={50}
                value={charsheetData.name}
                onChange={(e) => updateData((prev) => ({ ...prev, name: e.target.value }))}
              />
              <label>Álnév</label>
            </FloatLabel>
          </div>
          <div className='flex w-full gap-2'>
            <FloatLabel className='w-5 flex'>
              <InputText
                className='w-full text-yellow-400'
                maxLength={50}
                value={charsheetData.crew}
                onChange={(e) => updateData((prev) => ({ ...prev, crew: e.target.value }))}
              />
              <label>Banda</label>
            </FloatLabel>
            <FloatLabel className='w-3 flex'>
              <Dropdown
                id='classs'
                className='w-full text-yellow-400'
                value={charsheetData.class}
                options={BitDClasses.map((c) => ({
                  label: c.label,
                  value: c.label,
                }))}
                onChange={(e) => updateData((prev) => ({ ...prev, class: e.value }))}
              />
              <label htmlFor='classs'>Játékkönyv</label>
            </FloatLabel>
            <FloatLabel className='w-4 flex'>
              <InputText
                className='w-full text-yellow-400'
                value={charsheetData.playerName}
                maxLength={50}
                onChange={(e) => updateData((prev) => ({ ...prev, playerName: e.target.value }))}
              />
              <label>Játékos</label>
            </FloatLabel>
          </div>
          <FloatLabel className='w-full flex'>
            <InputText
              className='flex-1 text-yellow-400'
              maxLength={150}
              value={charsheetData.look}
              onChange={(e) => updateData((prev) => ({ ...prev, look: e.target.value }))}
            />
            <label>Kinézet</label>
          </FloatLabel>
          <div className='flex w-full gap-2'>
            <FloatLabel className='w-4 flex'>
              <Dropdown
                className='flex-1 text-yellow-400'
                value={charsheetData.heritage}
                options={[
                  "Akoros",
                  "Tőr-szigetek",
                  "Iruvia",
                  "Severos",
                  "Skovföld",
                  "Tycheros",
                ].map((value) => ({
                  label: value,
                  value,
                }))}
                onChange={(e) => updateData((prev) => ({ ...prev, heritage: e.value }))}
              />
              <label htmlFor='heritage'>Örökség</label>
            </FloatLabel>
            <FloatLabel className='w-4 flex'>
              <Dropdown
                className='flex-1 text-yellow-400'
                value={charsheetData.background}
                options={[
                  "Alvilág",
                  "Hadsereg",
                  "Kereskedelem",
                  "Munkás",
                  "Nemes",
                  "Törvény",
                  "Tudományos",
                ].map((value) => ({
                  label: value,
                  value,
                }))}
                onChange={(e) => updateData((prev) => ({ ...prev, background: e.value }))}
              />
              <label>Háttér</label>
            </FloatLabel>
            <FloatLabel className='w-4 flex'>
              <Dropdown
                className='flex-1 text-yellow-400'
                value={charsheetData.vice}
                options={[
                  "Elkötelezettség",
                  "Élvezet",
                  "Hit",
                  "Kábulat",
                  "Luxus",
                  "Szerencsejáték",
                  "Természetfeletti",
                ].map((value) => ({
                  label: value,
                  value,
                }))}
                onChange={(e) => updateData((prev) => ({ ...prev, vice: e.value }))}
              />
              <label>Szenvedély</label>
            </FloatLabel>
          </div>
          <div className='flex w-full gap-2'>
            <div className='flex flex-1 p-2' style={{ backgroundColor: "#010817" }}>
              <Dots
                value={charsheetData.stress}
                labelLeft='Stressz'
                maxValue={9}
                labelWidth='w-6rem'
                onChange={(value) => updateData((prev) => ({ ...prev, stress: value }))}
              />
            </div>
            <div className='flex flex-1 p-2' style={{ backgroundColor: "#010817" }}>
              <Dots
                value={charsheetData.trauma}
                labelLeft='Trauma'
                maxValue={4}
                labelWidth='w-6rem'
                onChange={(value) => updateData((prev) => ({ ...prev, trauma: value }))}
              />
            </div>
          </div>
          <FloatLabel className='flex w-full'>
            <MultiSelect
              className='flex-1 text-yellow-400'
              value={charsheetData.traumaWords}
              panelHeaderTemplate={<></>}
              options={[
                "Kőszívű",
                "Kísértett",
                "Megszállott",
                "Paranoid",
                "Vakmerő",
                "Lágyszívű",
                "Instabil",
                "Kegyetlen",
              ].map((value) => ({
                label: value,
                value,
              }))}
              onChange={(e) => updateData((prev) => ({ ...prev, traumaWords: e.value }))}
            />
            <label>Trauma</label>
          </FloatLabel>
          <div className='flex w-full gap-2'>
            <div className='flex flex-1 flex-column align-self-start'>
              <div className='p-1' style={{ backgroundColor: "#010817" }}>
                Seb
              </div>
              <div className='p-inputgroup flex-1'>
                <span className='p-inputgroup-addon border-noround'>3</span>
                <InputText
                  className='wound-box'
                  value={charsheetData.harm3}
                  onChange={(e) => updateData((prev) => ({ ...prev, harm3: e.target.value }))}
                />
                <span className='p-inputgroup-addon w-5rem text-xs text-center py-0 border-noround'>
                  Segítségre szorul
                </span>
              </div>
              <div className='p-inputgroup flex-1'>
                <span className='p-inputgroup-addon border-noround border-top-transparent'>2</span>
                <InputText
                  className='border-top-transparent wound-box'
                  value={charsheetData.harm2}
                  onChange={(e) => updateData((prev) => ({ ...prev, harm2: e.target.value }))}
                />
                <span className='p-inputgroup-addon w-5rem border-noround border-top-transparent'>
                  -1K
                </span>
              </div>
              <div className='p-inputgroup flex-1'>
                <span className='p-inputgroup-addon border-noround-top border-top-transparent'>
                  1
                </span>
                <InputText
                  className='w-6rem border-top-transparent wound-box'
                  value={charsheetData.harm1l}
                  onChange={(e) => updateData((prev) => ({ ...prev, harm1l: e.target.value }))}
                />
                <InputText
                  className='w-6rem border-top-transparent wound-box'
                  value={charsheetData.harm1r}
                  onChange={(e) => updateData((prev) => ({ ...prev, harm1r: e.target.value }))}
                />
                <span className='p-inputgroup-addon w-5rem text-xs text-center py-0 border-noround-top border-top-transparent'>
                  Csökkent hatás
                </span>
              </div>
            </div>
            <div className='flex gap-2 flex-column w-6rem'>
              <div className='p-1' style={{ backgroundColor: "#010817" }}>
                Gyógyulás
              </div>
              <Dots
                maxValue={4}
                dotsClassName='justify-content-center flex-1'
                value={charsheetData.healing}
                onChange={(value) => updateData((prev) => ({ ...prev, healing: value }))}
              />
              <div className='p-1' style={{ backgroundColor: "#010817" }}>
                Páncélok
              </div>
              <div className='flex flex-1 justify-content-between'>
                <label htmlFor='armor'>Páncél</label>
                <Checkbox
                  inputId='armor'
                  checked={charsheetData.armor}
                  onChange={(e) =>
                    updateData((prev) => ({ ...prev, armor: e.checked }))
                  }></Checkbox>
              </div>
              <div className='flex flex-1 justify-content-between'>
                <label htmlFor='heavyarmor'>Nehéz</label>
                <Checkbox
                  inputId='heavyarmor'
                  checked={charsheetData.heavy}
                  onChange={(e) =>
                    updateData((prev) => ({ ...prev, heavy: e.checked }))
                  }></Checkbox>
              </div>
              <div className='flex flex-1 justify-content-between'>
                <label htmlFor='specialarmor'>Speciális</label>
                <Checkbox
                  inputId='specialarmor'
                  checked={charsheetData.special}
                  onChange={(e) =>
                    updateData((prev) => ({ ...prev, special: e.checked }))
                  }></Checkbox>
              </div>
            </div>
          </div>
          <FloatLabel className='flex-1 flex'>
            <InputTextarea
              rows={5}
              spellCheck={false}
              className='flex-1 text-yellow-400 thin-scrollbar'
              maxLength={1000}
              value={charsheetData.notes}
              onChange={(e) => updateData((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <label>Jegyzetek</label>
          </FloatLabel>
        </div>

        <div className='flex flex-row flex-1 gap-3'>
          <div className='flex gap-4 flex-column flex-1 md:w-6 w-full'>
            <div className='flex gap-2'>
              <span className='text-7xl font-bold text-yellow-400 flex-1 class-title'>
                {charsheetData.class?.toUpperCase() || " "}
              </span>
              <span className='text-yellow-400 class-title w-8rem mt-2'>
                {BitDClasses.find(
                  (c) => c.label === charsheetData.class
                )?.description.toUpperCase() || " "}
              </span>
            </div>
            <div className='flex w-full'>
              <FloatLabel className='flex-1 flex'>
                <InputTextarea
                  rows={5}
                  spellCheck={false}
                  className='flex-1 text-yellow-400 thin-scrollbar'
                  maxLength={1000}
                  value={charsheetData.specialAbilities}
                  onChange={(e) =>
                    updateData((prev) => ({ ...prev, specialAbilities: e.target.value }))
                  }
                />
                <label>Speciális képességek</label>
              </FloatLabel>
            </div>
            <div className='flex w-full'>
              <FloatLabel className='flex-1 flex'>
                <InputTextarea
                  rows={5}
                  spellCheck={false}
                  className='flex-1 text-yellow-400 thin-scrollbar'
                  maxLength={1000}
                  value={charsheetData.friends}
                  onChange={(e) => updateData((prev) => ({ ...prev, friends: e.target.value }))}
                />
                <label>Barátok és ellenségek</label>
              </FloatLabel>
            </div>
            <div className='flex md:flex-1 h-8rem'>
              <FloatLabel className='flex-1 flex'>
                <InputTextarea
                  spellCheck={false}
                  className='flex-1 text-yellow-400 thin-scrollbar'
                  maxLength={1000}
                  value={charsheetData.items}
                  onChange={(e) => updateData((prev) => ({ ...prev, items: e.target.value }))}
                />
                <label>Tárgyak</label>
              </FloatLabel>
            </div>
          </div>

          <div className='flex gap-2 align-self-start align-self-center md:align-self-start w-full md:w-20rem'>
            <div className='flex flex-1 flex-column gap-2'>
              <Dots
                value={charsheetData.stash}
                labelLeft='Szajré'
                maxValue={40}
                className='align-items-start h-5rem'
                labelWidth='w-7rem'
                onChange={(value) => updateData((prev) => ({ ...prev, stash: value }))}
              />
              <Dots
                value={charsheetData.coin}
                labelWidth='w-6rem'
                labelLeft='Érme'
                onChange={(value) => updateData((prev) => ({ ...prev, coin: value }))}
              />
              <div className='flex p-2' style={{ backgroundColor: "#010817" }}>
                <Dots
                  value={charsheetData.playbook}
                  maxValue={8}
                  labelWidth='w-7rem'
                  labelLeft='Játékkönyv'
                  onChange={(value) => updateData((prev) => ({ ...prev, playbook: value }))}
                />
              </div>
              {charsheetData.attributes?.map((attr) => (
                <Fragment key={attr.name}>
                  <div className='flex p-2' style={{ backgroundColor: "#010817" }}>
                    <Dots
                      key={attr.name}
                      value={attr.xp}
                      labelWidth='w-8rem'
                      maxValue={6}
                      labelLeft={`${attr.name} [${calculateAttribute(attr)}]`}
                      onChange={(value) => handleAttributeXpChange(attr.name, value)}
                    />
                  </div>
                  {attr.values.map((action) => (
                    <Dots
                      key={action.name}
                      value={action.value}
                      labelWidth='w-8rem'
                      dotsClassName='w-6rem'
                      labelRight={action.name}
                      rounded
                      onChange={(value) => handleActionChange(attr.name, action.name, value)}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editable && <CharacterSheetBottom charsheet={charsheet} setCharsheet={setCharsheet} />}
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
