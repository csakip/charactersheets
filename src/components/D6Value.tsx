import { format } from "../dice";

export default function D6Value({
  showArrows = false,
  value,
  minValue = 0,
  parentValue = 0,
  prefix = "",
  label,
  className,
  onChange,
  onClick,
  children,
}: {
  showArrows?: boolean;
  value: number;
  minValue?: number;
  parentValue?: number;
  prefix?: string;
  label: string;
  className?: string;
  onChange: (value: number) => void;
  onClick?: (label: string, value: number) => void;
  children?: React.ReactNode;
}) {
  function changeValue(newValue: number) {
    onChange(Math.max(minValue, newValue));
  }

  function rollValue() {
    if (onClick && !showArrows) onClick(label, parentValue + value);
  }

  return (
    <div
      className={`flex align-content-start mb-2 ${showArrows ? "" : "cursor-pointer"} ${className}`}
      onClick={() => rollValue()}>
      <span className='font-medium select-none'>
        <span className='text-300'>{prefix}</span>
        {label}
      </span>
      {children}
      <span className='font-medium text-yellow-400 ml-auto select-none'>
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
