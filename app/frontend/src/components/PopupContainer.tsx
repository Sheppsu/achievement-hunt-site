import "assets/css/popup.css";
import { PopupContext, PopupContextType } from "contexts/PopupContext";
import { useContext } from "react";

export default function PopupContainer() {
  const { popup, setPopup } = useContext(PopupContext) as PopupContextType;

  return popup ? (
    <div className="popup">
      <div className="overlay">
        <div className="popup-content">
          <div className="popup-heading">
            <h1>{popup.title}</h1>
            <div onClick={() => setPopup(null)}>X</div>
          </div>
          {popup.content}
        </div>
      </div>
    </div>
  ) : null;
}
