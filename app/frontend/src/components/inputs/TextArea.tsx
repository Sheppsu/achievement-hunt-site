import { splitProps } from "components/inputs/util.ts";
import { useEffect, useRef } from "react";

type TextAreaProps = {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
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
  setValue: undefined,
};

export default function TextArea(props: TextAreaProps) {
  const [elementProps, otherProps] = splitProps(
    props,
    elementDefaults,
    otherDefaults,
  );

  const elmRef = useRef<HTMLTextAreaElement | null>(null);

  if (otherProps.hidden) {
    elementProps.className += " hide";
  }

  function adjustHeight() {
    if (elmRef.current === null) {
      return;
    }

    elmRef.current.style.height = "auto";
    elmRef.current.style.height =
      Math.max(40, elmRef.current.scrollHeight) + "px";
  }

  elementProps.onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    otherProps.setValue(e.target.value);

    if (props.onChange !== undefined) {
      props.onChange(e);
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [elementProps.value]);

  return <textarea ref={elmRef} {...elementProps} />;
}
