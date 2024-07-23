import {
  PageTransitionContext,
  PageTransitionContextType,
} from "contexts/PageTransitionContext";
import { motion } from "framer-motion";
import { useContext } from "react";

export default function AnimatedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTransitioning } = useContext(
    PageTransitionContext
  ) as PageTransitionContextType;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      onAnimationStart={() => setTransitioning(true)}
      onAnimationComplete={() => setTransitioning(false)}
      // transition={{ type: "spring", duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
