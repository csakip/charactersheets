import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { deleteCharsheet, saveCharsheet } from "./supabase";
import { BladesData, Charsheet } from "./utils";

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

  const handleAttributeChange = (attr: string, value: string) => {
    const numValue = value === "" ? 0 : Math.max(0, Math.min(3, parseInt(value)));
    updateData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr.toLowerCase()]: numValue,
      },
    }));
  };

  const toggleSkill = (skill: string) => {
    updateData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleAbility = (ability: string) => {
    let currentArmor = charsheetData.sumArmor;
    if (ability === "Kemény") {
      const changingTo = !charsheetData.abilities.includes(ability);
      currentArmor += changingTo ? 1 : -1;
    }

    updateData((prev) => ({
      ...prev,
      sumArmor: currentArmor,
      abilities: prev.abilities.includes(ability)
        ? prev.abilities.filter((a) => a !== ability)
        : [...prev.abilities, ability],
    }));
  };

  const handleArmorTypeChange = (type: string, checked: boolean) => {
    if (!editable) return;
    const prevShield = charsheetData.shield ? 1 : 0;
    const shield = type === "Pajzs" && checked ? 1 : type !== "Pajzs" ? prevShield : 0;
    const abilityArmor = charsheetData.abilities.includes("Kemény") ? 1 : 0;

    const armor =
      type !== "Pajzs" && checked
        ? ["Nincs", "Könnyű", "Teljes"].indexOf(type)
        : ["Nincs", "Könnyű", "Teljes"].indexOf(charsheetData.armor);

    if (type === "Pajzs") {
      updateData((prev) => ({
        ...prev,
        shield: checked,
        sumArmor: shield + armor + abilityArmor,
      }));
    } else {
      updateData((prev) => ({
        ...prev,
        armor: checked ? type : prev.armor,
        sumArmor: shield + armor + abilityArmor,
      }));
    }
  };

  function handleClassChange(value: string) {
    if (!editable) return;
    const classSkills = {
      Harcos: ["Atlétika"],
      Tolvaj: ["Lopakodás"],
      Pap: ["Rejtélyfejtés", "Gyógyítás"],
      Varázsló: ["Mágiaismeret"],
      Kósza: ["Túlélés"],
    };
    (classSkills[value] ?? []).forEach((skill) => {
      if (!charsheetData.skills.includes(skill)) charsheetData.skills.push(skill);
    });
    updateData((prev) => ({
      ...prev,
      class: value,
      skills: [...charsheetData.skills],
    }));
  }

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

  return (
    <>
      <Toast ref={toast} />
      <div
        className='charactersheet flex flex-column gap-4 p-4 mt-3 border-round-md'
        style={{ maxWidth: "1000px", margin: "auto", backgroundColor: "#1f2937" }}>
        {/* Top Fields */}
        <div className='flex gap-4'>
          <InputText
            placeholder='Név'
            className='flex-1 text-yellow-400'
            maxLength={50}
            value={charsheetData.name}
            onChange={(e) => updateData((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Dropdown
            placeholder='Kaszt'
            className='w-10rem text-yellow-400'
            value={charsheetData.class}
            options={["Harcos", "Tolvaj", "Pap", "Varázsló", "Kósza", "Egyedi"].map((value) => ({
              label: value,
              value,
            }))}
            onChange={(e) => handleClassChange(e.value)}
          />
          <InputText
            placeholder='Játékos'
            className='w-10rem text-yellow-400'
            value={charsheetData.playerName}
            maxLength={50}
            onChange={(e) => updateData((prev) => ({ ...prev, playerName: e.target.value }))}
          />
        </div>
      </div>
      {editable && (
        <div
          className='flex mb-3 mt-1 justify-content-end'
          style={{ maxWidth: "1000px", margin: "auto" }}>
          <Button severity='danger' size='small' text onClick={() => setShowDeleteConfirm(true)}>
            Karakter törlése
          </Button>
        </div>
      )}
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
