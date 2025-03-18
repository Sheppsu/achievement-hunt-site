import { splitProps } from "components/inputs/util.ts";
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
          value={v as string}
          selected={otherProps.value !== null && otherProps.value === v}
        >
          {k}
        </option>
      ))}
    </select>
  );
}
