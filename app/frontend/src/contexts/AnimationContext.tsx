import { Dispatch, SetStateAction, createContext } from "react";

export type AnimationContextType = {
  animating: boolean;
  setAnimating: Dispatch<SetStateAction<boolean>>;
};
export const AnimationContext = createContext<AnimationContextType | undefined>(
  undefined
);
