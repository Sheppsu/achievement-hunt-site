import { createContext, Dispatch, SetStateAction } from "react";

export type PopupState = {
  title: string;
  content: React.ReactNode;
} | null;

export type PopupContextType = {
  popup: PopupState;
  setPopup: Dispatch<SetStateAction<PopupState>>;
};

export const PopupContext = createContext<PopupContextType | undefined>(
  undefined,
);
