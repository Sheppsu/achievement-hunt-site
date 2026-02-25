import "assets/css/inputs/button.css";
import React, { useRef, useState } from "react";
import { splitProps } from "util/helperFunctions.ts";
import classNames from "classnames";

type ButtonProps = {
  children: React.ReactNode | string;
  className?: string;
  hidden?: boolean;
  unavailable?: boolean;
  onClick?:
    | ((e: React.FormEvent<HTMLButtonElement>) => void)
    | ((e: React.FormEvent<HTMLButtonElement>) => void)[];
  width?: string;
  height?: string;
  type?: "button" | "submit" | "reset";
  holdToUse?: boolean;
  caution?: boolean;
  includeButtonCls?: boolean;
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
  caution: false,
  includeButtonCls: true,
};

// none | click | hold
type DebounceType = 0 | 1 | 2;

const HOLD_TIME = 2000;
const UPDATE_INTERVAL = 50;

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
  if (otherProps.caution) {
    elementProps.className += " caution";
  }
  if (otherProps.includeButtonCls) {
    elementProps.className += " button";
  }

  elementProps.className += " prevent-select";

  const onClick =
    otherProps.onClick === undefined
      ? undefined
      : (e: React.FormEvent<HTMLButtonElement>) => {
          if (Array.isArray(otherProps.onClick)) {
            for (const func of otherProps.onClick) {
              func(e);
            }
          } else {
            otherProps.onClick(e);
          }
        };

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

        const newP = Math.min(
          100,
          (p ?? 0) + (100 * UPDATE_INTERVAL) / HOLD_TIME,
        );

        // trigger button
        if (newP === 100 && onClick) {
          onClick(e);
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
      if (e.type == "mouseup" && onClick && !otherProps.unavailable) onClick(e);
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

  const circleBgColor = otherProps.caution
    ? "--caution-button-color"
    : "--generic-button-color";
  return (
    <div
      style={{
        width: otherProps.width,
        height: otherProps.height,
        position: "relative",
      }}
      className={classNames({ hide: otherProps.hidden })}
    >
      <div
        className={classNames("button-circle", {
          hide: progress === null,
          caution: otherProps.caution,
        })}
        style={{
          backgroundImage: `conic-gradient(#fff ${progress}%, var(${circleBgColor}) ${progress}%, var(${circleBgColor}) 100%)`,
        }}
      ></div>
      <button
        style={{
          width: otherProps.width === "auto" ? "auto" : "100%",
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
