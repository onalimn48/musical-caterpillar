import { useEffect, useRef, useState } from "react";

export default function useStreakAnimation(value, duration = 1200) {
  const previousValueRef = useRef(value);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (value <= previousValueRef.current) {
      previousValueRef.current = value;
      return undefined;
    }

    previousValueRef.current = value;
    setActive(true);
    const timeoutId = window.setTimeout(() => setActive(false), duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, value]);

  return active;
}
