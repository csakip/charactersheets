export default function Dice({ roll }) {
  if (!roll.rolls) return <></>;

  function getClass(r, idx) {
    let ret = "die";
    if (idx === 0) {
      if (r === 6) ret += " wild";
      if (r === 1) ret += " fail";
    } else {
      if (roll.extraRolls && idx >= roll.rolls.length - roll.extraRolls && r === 6) ret += " wild";
    }

    return ret;
  }

  return (
    <>
      <div className='dice flex gap-1 justify-content-center pt-1'>
        {roll.rolls.map((r, idx) => (
          <span className={getClass(r, idx)} key={idx}>
            <div className='face'>{r}</div>
          </span>
        ))}
        {roll.pip > 0 && " +" + roll.pip}
      </div>
      <div className={"result" + (roll.reduced != roll.sum ? " red" : "")}>
        <strong>{roll.sum}</strong>
        {roll?.reduced != roll.sum && <div className='reduced'>levonással {roll.reduced}</div>}
      </div>
    </>
  );
}
