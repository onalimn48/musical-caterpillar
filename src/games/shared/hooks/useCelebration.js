import { useEffect, useState } from "react";

export default function useCelebration(trigger, duration = 1600) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return undefined;
    setActive(true);
    const timeoutId = window.setTimeout(() => setActive(false), duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, trigger]);

  return active;
}
