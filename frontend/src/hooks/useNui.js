// Lightweight NUI compatibility shim for browser preview & FiveM CEF.
// In the browser (preview), we expose mock behavior so the UI is visible.
import { useEffect } from "react";

export const isDebug =
  typeof window !== "undefined" && !window.invokeNative;

export const useNuiEvent = (action, handler) => {
  useEffect(() => {
    const listener = (event) => {
      const { action: act, data } = event.data || {};
      if (act === action) handler(data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [action, handler]);
};

export const fetchNui = async (eventName, data = {}) => {
  if (isDebug) return null;
  try {
    const resourceName =
      (window).GetParentResourceName ? window.GetParentResourceName() : "lunar";
    const res = await fetch(`https://${resourceName}/${eventName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (e) {
    return null;
  }
};
