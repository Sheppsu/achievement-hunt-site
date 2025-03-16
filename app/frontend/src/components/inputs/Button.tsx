import "assets/css/button.css";
import React from "react";
import { splitProps } from "components/inputs/util.ts";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  hidden?: boolean;
  unavailable?: boolean;
  onClick?: (e: React.FormEvent<HTMLButtonElement>) => void;
  width?: string;
  height?: string;
  type?: "button" | "submit" | "reset";
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
};

export default function Button(props: ButtonProps) {
  const [elementProps, otherProps] = splitProps(
    props,
    elementDefaults,
    otherDefaults,
  );

  if (otherProps.hidden === true) {
    elementProps.className += " hide";
  }

  if (otherProps.unavailable) {
    elementProps.className += " unavailable";
  }

  elementProps.className += " prevent-select button";

  return (
    <button
      style={{
        width: otherProps.width,
        height: otherProps.height,
      }}
      onClick={otherProps.unavailable ? undefined : elementProps.onClick}
      {...elementProps}
    >
      {otherProps.children}
    </button>
  );
}
