import { ListBox } from "primereact/listbox";
import { systems } from "../constants";

export default function CharacterSheetList({
  charsheets,
  selectedCharsheetId,
  setSelectedCharsheetId,
  sidebarOpen = true,
  showSystem = false,
  showPlayerName = true,
}) {
  function formatLabel(p) {
    const parts = [];
    if (showSystem) {
      parts.push(systems.find((s) => s.value === p.system)?.shortLabel);
    }
    if (showPlayerName && p.data?.playerName) {
      parts.push(p.data?.playerName);
    }
    if (p.data?.name && sidebarOpen) {
      parts.push(p.data?.name);
    }
    if (!sidebarOpen && p.data?.name && !p.data?.playerName) {
      parts.push(p.data?.name);
    }

    const icon = p.rooms_charsheets?.length ? (
      <i className='pi pi-check-circle text-300' style={{ float: "right" }} title='Játékban van' />
    ) : (
      ""
    );
    return (
      <span>
        {parts.join(" - ")}
        {icon}
      </span>
    );
  }

  return (
    <div className='flex flex-column gap-2'>
      {!!charsheets.length && (
        <ListBox
          value={selectedCharsheetId}
          options={charsheets
            .toSorted((a, b) =>
              (showPlayerName ? a.data.playerName > b.data.playerName : a.created_at < b.created_at)
                ? 1
                : -1
            )
            .map((p) => ({
              label: formatLabel(p),
              value: p.id,
            }))}
          onChange={(e) => setSelectedCharsheetId(e.value)}
          className='w-full'
        />
      )}
    </div>
  );
}
