import React, { useEffect, useState } from "react";
import { getTimeRemaining, getDates } from "../utils/time";

const Countdown = ({ start, end, isPreview }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

  const type = isPreview ? "preview" : "contest";

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const t = getDates(start, end);

  let tLeft;

  if (t.state === "soon") {
    tLeft = getTimeRemaining(start);
  }
  if (t.state === "active") {
    tLeft = getTimeRemaining(end);
  }

  return (
    <div className="countdown">
      <h5>
        <span className="wrapper-time">
          <span className="days">{tLeft.days}</span> days +{" "}
        </span>
        <span className="wrapper-time">
          <span className="hours">{tLeft.hh}</span>{" "}
          <span className="minutes">{tLeft.mm}</span>{" "}
          <span className="seconds">{tLeft.ss}</span>
        </span>
        <span className="wrapper-time">
          {t.state === "soon"
            ? ` until ${type} starts`
            : ` until ${type} ends`}
        </span>
      </h5>
    </div>
  );
};

export default Countdown;
