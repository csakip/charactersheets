export default function Dots({
  value,
  maxValue = 4,
  labelLeft,
  labelRight,
  rounded = false,
  dotsClassName = "flex-1",
  className = "align-items-center h-1rem",
  labelWidth = "w-4rem",
  onChange,
}: {
  value: number;
  labelRight?: string;
  labelLeft?: string;
  maxValue?: number;
  rounded?: boolean;
  dotsClassName?: string;
  className?: string;
  labelWidth?: string;
  onChange: (value: number) => void;
}) {
  function changeValue(newValue: number) {
    if (value === newValue) onChange(0);
    else onChange(newValue);
  }

  const dots = Array.from({ length: maxValue }, (_, i) => i + 1);

  return (
    <div className={`flex ${className} flex-1 align-content-start`}>
      {labelLeft && (
        <span className={`text-yellow-400 font-medium text-lg ${labelWidth}`}>{labelLeft}</span>
      )}
      <div
        className={`flex gap-1 flex-wrap ${
          labelLeft ? "justify-content-end" : "justify-content-start"
        } ${dotsClassName}`}>
        {dots.map((dot) => (
          <div
            key={dot}
            className={`w-1rem h-1rem ${rounded && "border-circle"} cursor-pointer ${
              value >= dot ? "bg-yellow-400" : "bg-gray-500"
            }`}
            onClick={() => changeValue(dot)}
          />
        ))}
      </div>
      {labelRight && (
        <span className={`text-yellow-400 font-medium text-lg ${labelWidth}`}>{labelRight}</span>
      )}
    </div>
  );
}
