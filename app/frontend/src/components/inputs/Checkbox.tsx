import { splitProps } from "components/inputs/util.ts";

type CheckboxPropsType = {
  className?: string;
  hidden?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [_k: string]: any;
};

const elementDefaults = {
  className: "",
};

const otherDefaults = {
  hidden: false,
};

export default function Checkbox(props: CheckboxPropsType) {
  const [elementProps, otherProps] = splitProps(
    props,
    elementDefaults,
    otherDefaults,
  );

  if (otherProps.hidden === true) {
    elementProps.className += " hide";
  }

  elementProps.className += " checkbox-input";

  return <input type="checkbox" {...elementProps} />;
}
