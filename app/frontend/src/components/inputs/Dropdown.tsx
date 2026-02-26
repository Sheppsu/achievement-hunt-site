import { splitProps } from "util/helperFunctions.ts";
import "assets/css/inputs/dropdown.css";

type DropdownProps = {
  className?: string;
  options: { [_k: string]: string };
  onChange?: (e: React.FormEvent<HTMLSelectElement>) => void;
  value?: string;
};

const elementDefaults = {
  className: "",
};
const otherDefaults = {
  options: {},
  value: null,
};

export default function Dropdown(props: DropdownProps) {
  const [elementProps, otherProps] = splitProps(
    props,
    elementDefaults,
    otherDefaults,
  );

  elementProps.className += " dropdown";

  return (
    <select {...elementProps}>
      {Object.entries(otherProps.options).map(([k, v]) => (
        <option
          key={v}
          value={v}
          selected={otherProps.value !== null && otherProps.value === v}
        >
          {k}
        </option>
      ))}
    </select>
  );
}
