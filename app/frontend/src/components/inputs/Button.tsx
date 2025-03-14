import "assets/css/button.css";
import React from "react";

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

export default function Button(props: ButtonProps) {
  const unavailable = props.unavailable === true;

  if (props.className === undefined) {
    props.className = "";
  }

  if (props.hidden === true) {
    props.className += " hide";
  }

  if (unavailable) {
    props.className += " unavailable";
  }

  props.className += " prevent-select button";

  return (
    <button
      style={{
        width: props.width,
        height: props.height,
      }}
      className={props.className}
      onClick={unavailable ? undefined : props.onClick}
      type={props.type ?? "button"}
    >
      {props.children}
    </button>
  );
}
