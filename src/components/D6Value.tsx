import { format } from "../dice";

export default function D6Value({
  showArrows = false,
  value,
  minValue = 0,
  parentValue = 0,
  label,
  className,
  onChange,
  onClick,
}: {
  showArrows?: boolean;
  value: number;
  minValue?: number;
  parentValue?: number;
  label: string;
  className?: string;
  onChange: (value: number) => void;
  onClick?: (label: string, value: number) => void;
}) {
  function changeValue(newValue: number) {
    onChange(Math.max(minValue, newValue));
  }

  function rollValue() {
    if (onClick) onClick(label, parentValue + value);
  }

  return (
    <div className={`flex align-content-start mb-2 ${className}`}>
      <span className='font-medium cursor-pointer select-none' onClick={() => rollValue()}>
        {label}
      </span>
      <span
        className='font-medium text-yellow-400 ml-auto cursor-pointer select-none'
        onClick={() => rollValue()}>
        {format(parentValue + value)}
      </span>
      {showArrows && (
        <div className='flex flex-column justify-items-start'>
          <i className='pi pi-chevron-up arrowButton' onClick={() => changeValue(value + 1)} />
          <i className='pi pi-chevron-down arrowButton' onClick={() => changeValue(value - 1)} />
        </div>
      )}
    </div>
  );
}
