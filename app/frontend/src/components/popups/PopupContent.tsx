import Button from "components/inputs/Button.tsx";
import { FormEvent } from "react";
import TextInput from "components/inputs/TextInput.tsx";

export function SimplePromptPopup({
  prompt,
  onSubmit,
}: {
  prompt: string;
  onSubmit: (evt: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-container">
        <div className="form-container__input">
          <p>{prompt}: </p>
          <TextInput name="prompt-value" />
        </div>
        <div className="form-container__input center">
          <Button type="submit" children="Submit" width="200px" />
        </div>
      </div>
    </form>
  );
}
