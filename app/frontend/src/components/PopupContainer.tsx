import "assets/css/popup.css";
import { PopupContext, PopupContextType } from "contexts/PopupContext";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useRef } from "react";

export default function PopupContainer() {
  const { popup, setPopup } = useContext(PopupContext) as PopupContextType;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPopup(null);
      }
    }

    function handleOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setPopup(null);
      }
    }

    window.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);
  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="popup"
            initial={{ opacity: 0, y: 10, scale: 0.4 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.4 }}
          >
            <div className="popup-content" ref={ref}>
              <div className="popup-heading">
                <h1>{popup.title}</h1>
                <div onClick={() => setPopup(null)}>X</div>
              </div>
              {popup.content}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}