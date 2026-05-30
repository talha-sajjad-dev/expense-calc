"use client";

import { useMemo, useState } from "react";

export function useMonth() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const label = useMemo(
    () =>
      new Date(year, month, 1).toLocaleDateString("en-PK", {
        month: "long",
        year: "numeric",
      }),
    [year, month]
  );

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return { year, month, label, goPrev, goNext, goToday };
}
