import { splitProps } from "components/inputs/util.ts";

type TextInputProps = {
  className?: string;
  placeholder?: string;
  hidden?: boolean;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  autoComplete?: boolean;
  [_k: string]: any;
};

const elementDefaults = {
  className: "",
  autoComplete: false,
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
