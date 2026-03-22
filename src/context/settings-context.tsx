"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type { RecommendationSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/lib/constants";

const STORAGE_KEY = "recommendSettings";

type Action =
  | { type: "SET_COUNT"; payload: number }
  | {
      type: "SET_WEIGHT";
      payload: { key: keyof RecommendationSettings["weights"]; value: number };
    }
  | {
      type: "SET_FILTER";
      payload: {
        key: keyof RecommendationSettings["filters"];
        value: string | number;
      };
    }
  | { type: "RESET_DEFAULTS" };

function reducer(
  state: RecommendationSettings,
  action: Action
): RecommendationSettings {
  switch (action.type) {
    case "SET_COUNT":
      return { ...state, count: action.payload };
    case "SET_WEIGHT":
      return {
        ...state,
        weights: { ...state.weights, [action.payload.key]: action.payload.value },
      };
    case "SET_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      };
    case "RESET_DEFAULTS":
      return DEFAULT_SETTINGS;
    default:
      return state;
  }
}

interface SettingsContextValue {
  settings: RecommendationSettings;
  dispatch: React.Dispatch<Action>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(reducer, DEFAULT_SETTINGS);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecommendationSettings;
        // Apply each field individually to avoid full state replacement issues
        dispatch({ type: "SET_COUNT", payload: parsed.count });
        (
          Object.keys(parsed.weights) as Array<
            keyof RecommendationSettings["weights"]
          >
        ).forEach((key) => {
          dispatch({
            type: "SET_WEIGHT",
            payload: { key, value: parsed.weights[key] },
          });
        });
        (
          Object.keys(parsed.filters) as Array<
            keyof RecommendationSettings["filters"]
          >
        ).forEach((key) => {
          dispatch({
            type: "SET_FILTER",
            payload: { key, value: parsed.filters[key] },
          });
        });
      }
    } catch {
      // Ignore invalid localStorage data
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, dispatch }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
