import { splitProps } from "components/inputs/util.ts";

type TextAreaProps = {
  className?: string;
  placeholder?: string;
  hidden?: boolean;
  onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  name?: string;
  [_k: string]: any;
};

const elementDefaults = {
  className: "",
};

const otherDefaults = {
  hidden: false,
  onInput: null,
};

export default function TextArea(props: TextAreaProps) {
  const [elementProps, otherProps] = splitProps(
    props,
    elementDefaults,
    otherDefaults,
  );

  if (otherProps.hidden) {
    elementProps.className += " hide";
  }

  // resize text area
  elementProps.onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = "auto";
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";

    if (otherProps.onInput !== null) {
      otherProps.onInput(e);
    }
  };

  return <textarea {...elementProps} />;
}
