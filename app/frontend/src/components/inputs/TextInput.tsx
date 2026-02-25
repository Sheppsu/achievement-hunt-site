import { splitProps } from "util/helperFunctions.ts";
import { HTMLInputAutoCompleteAttribute } from "react";
import "assets/css/inputs/text-input.css";

type TextInputProps = {
  className?: string;
  placeholder?: string;
  hidden?: boolean;
  type?: string;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  [_k: string]: any;
};

const elementDefaults = {
  className: "",
  autoComplete: "off",
  type: "text",
};

const otherDefaults = {
  hidden: false,
};

export default function TextInput(props: TextInputProps) {
  const [elementProps, otherProps] = splitProps(
    props,
    elementDefaults,
    otherDefaults,
  );

  if (otherProps.hidden === true) {
    elementProps.className += " hide";
  }

  elementProps.className += " text-input";

  return <input {...elementProps} />;
}
