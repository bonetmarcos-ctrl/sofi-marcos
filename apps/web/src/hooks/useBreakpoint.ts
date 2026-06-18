import { useEffect, useState } from "react";

const getViewport = () => {
  if (typeof window === "undefined") return { width: 1200, isMobile: false, isTablet: false };
  const width = window.innerWidth;
  return { width, isMobile: width < 720, isTablet: width >= 720 && width < 1024 };
};

export const useBreakpoint = () => {
  const [viewport, setViewport] = useState(getViewport);

  useEffect(() => {
    let frameId = null;

    const onResize = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => setViewport(getViewport()));
    };

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return viewport;
};