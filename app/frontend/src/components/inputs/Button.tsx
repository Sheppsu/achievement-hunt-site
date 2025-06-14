import "assets/css/inputs/button.css";
import React, { useRef, useState } from "react";
import { splitProps } from "components/inputs/util.ts";
import classNames from "classnames";

type ButtonProps = {
  children: React.ReactNode | string;
  className?: string;
  hidden?: boolean;
  unavailable?: boolean;
  onClick?: (e: React.FormEvent<HTMLButtonElement>) => void;
  width?: string;
  height?: string;
  type?: "button" | "submit" | "reset";
  holdToUse?: boolean;
};

const elementDefaults = {
  className: "",
  type: "button",
};

const otherDefaults = {
  hidden: false,
  unavailable: false,
  children: "",
  width: "auto",
  height: "auto",
  holdToUse: false,
  onClick: undefined,
};

// none | click | hold
type DebounceType = 0 | 1 | 2;

export default function Button(props: ButtonProps) {
  const intervalId = useRef<null | number>(null);
  const holdOverId = useRef<null | number>(null);
  const [progress, setProgress] = useState<null | number>(null);
  const [debounce, setDebounce] = useState<DebounceType>(0);

  const [elementProps, otherProps] = splitProps(
    props,
    elementDefaults,
    otherDefaults,
  );

  if (otherProps.hidden) {
    elementProps.className += " hide";
  }

  if (otherProps.unavailable) {
    elementProps.className += " unavailable";
  }

  elementProps.className += " prevent-select button";

  // for hold-to-use buttons
  const onMouseDown = (e: React.FormEvent<HTMLButtonElement>) => {
    if (debounce !== 0) return;

    setDebounce(otherProps.holdToUse ? 2 : 1);

    if (!otherProps.holdToUse) return;

    setProgress(0);

    if (holdOverId.current !== null) {
      clearTimeout(holdOverId.current);
    }

    intervalId.current = setInterval(() => {
      setProgress((p) => {
        if (p === 100) return 100;

        const newP = Math.min(100, (p ?? 0) + 5.0 / 3.0);

        // trigger button
        if (newP === 100 && otherProps.onClick) {
          otherProps.onClick(e);
          if (intervalId.current !== null) clearInterval(intervalId.current);
          return null;
        }

        return newP;
      });
    }, 50);
  };
  const onMouseUp = (e: React.FormEvent<HTMLButtonElement>) => {
    if (debounce === 0) return;

    setDebounce(0);

    if (debounce === 1) {
      if (e.type == "mouseup" && otherProps.onClick && !otherProps.unavailable)
        otherProps.onClick(e);
      return;
    }

    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
      if (progress === null) return;
      // delayed for intuitiveness
      if (Math.round(progress) === 100) {
        setProgress(null);
      } else {
        holdOverId.current = setTimeout(() => {
          holdOverId.current = null;
          setProgress(null);
        }, 500);
      }
    }
  };

  return (
    <div
      style={{
        width: otherProps.width,
        height: otherProps.height,
        position: "relative",
      }}
    >
      <div
        className={classNames("button-circle", {
          hide: progress === null,
        })}
        style={{
          backgroundImage: `conic-gradient(#fff ${progress}%, var(--generic-button-color) ${progress}%, var(--generic-button-color) 100%)`,
        }}
      ></div>
      <button
        style={{
          width: "100%",
          height: "100%",
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onMouseDown}
        onTouchEnd={onMouseUp}
        {...elementProps}
      >
        {otherProps.children}
      </button>
    </div>
  );
}
