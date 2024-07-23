import { Dispatch, SetStateAction, createContext, useState } from "react";

export type PageTransitionContextType = {
  transitioning: boolean;
  setTransitioning: Dispatch<SetStateAction<boolean>>;
};

export function PageTransitionContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [transitioning, setTransitioning] = useState<boolean>(false);

  return (
    <PageTransitionContext.Provider value={{ transitioning, setTransitioning }}>
      {children}
    </PageTransitionContext.Provider>
  );
}

export const PageTransitionContext = createContext<
  PageTransitionContextType | undefined
>(undefined);
