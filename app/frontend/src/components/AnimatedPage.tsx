import { AnimatePresence, motion } from "framer-motion";
export default function AnimatedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
