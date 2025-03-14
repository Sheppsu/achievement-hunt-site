type TextAreaProps = {
  className?: string;
  placeholder?: string;
  hidden?: boolean;
  onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  name?: string;
  [_k: string]: any;
};

export default function TextArea(props: TextAreaProps) {
  if (props.className === undefined) {
    props.className = "";
  }

  if (props.hidden === true) {
    props.className += " hide";
  }

  props.className += " staff__achievement__comment__textarea";

  const otherOnInput = props.onInput !== undefined ? props.onInput : null;

  // resize text area
  props.onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = "auto";
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";

    if (otherOnInput !== null) {
      otherOnInput(e);
    }
  };

  return <textarea {...props} />;
}
