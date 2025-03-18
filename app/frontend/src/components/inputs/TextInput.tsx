import { splitProps } from "components/inputs/util.ts";
import { HTMLInputAutoCompleteAttribute } from "react";

type TextInputProps = {
  className?: string;
  placeholder?: string;
  hidden?: boolean;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  onChange?: (e: React.FormEvent<HTMLInputElement>) => void;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  [_k: string]: any;
};

const elementDefaults = {
  className: "",
  autoComplete: "off",
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

  return <input type="text" {...elementProps} />;
}
