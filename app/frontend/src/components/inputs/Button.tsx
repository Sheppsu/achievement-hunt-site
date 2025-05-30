import "assets/css/inputs/button.css";
import React, { useRef, useState } from "react";
import { splitProps } from "components/inputs/util.ts";

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

function holdProgressCurve(value: number): number {
  return 10 * Math.sqrt(value);
}

export default function Button(props: ButtonProps) {
  const timeoutId = useRef<null | number>(null);
  const intervalId = useRef<null | number>(null);
  const [progress, setProgress] = useState<null | number>(null);

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
    timeoutId.current = setTimeout(() => {
      if (timeoutId.current === null) return;
      timeoutId.current = null;
      if (otherProps.onClick) otherProps.onClick(e);
    }, 3000);
    intervalId.current = setInterval(() => {
      setProgress((p) => Math.min(100, (p ?? 0) + 5.0 / 3.0));
    }, 50);
  };
  const onMouseUp = () => {
    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
      setProgress(null);
    }
  };

  const bgWidth =
    progress === null ? undefined : `${holdProgressCurve(progress)}%`;

  return (
    <button
      style={{
        width: otherProps.width,
        height: otherProps.height,
        background:
          bgWidth === undefined
            ? undefined
            : `linear-gradient(to right, var(--generic-button-color), var(--generic-button-color) ${bgWidth}, var(--generic-button-hover-color) ${bgWidth}, var(--generic-button-hover-color) 100%)`,
      }}
      onClick={
        otherProps.unavailable || otherProps.holdToUse
          ? undefined
          : otherProps.onClick
      }
      onMouseDown={otherProps.holdToUse ? onMouseDown : undefined}
      onMouseUp={otherProps.holdToUse ? onMouseUp : undefined}
      onMouseLeave={otherProps.holdToUse ? onMouseUp : undefined}
      onTouchStart={otherProps.holdToUse ? onMouseDown : undefined}
      onTouchEnd={otherProps.holdToUse ? onMouseUp : undefined}
      {...elementProps}
    >
      {otherProps.children}
    </button>
  );
}
