import { motion } from "framer-motion";
import { useContext } from "react";
import {
  AnimationContext,
  AnimationContextType,
} from "../contexts/AnimationContext";

export default function AnimatedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setAnimating } = useContext(AnimationContext) as AnimationContextType;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      onAnimationStart={() => setAnimating(true)}
      onAnimationComplete={() => setAnimating(false)}
      // transition={{ type: "spring", duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
