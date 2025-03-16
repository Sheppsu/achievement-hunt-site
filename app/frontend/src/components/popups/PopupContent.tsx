import Button from "components/inputs/Button.tsx";
import { FormEvent } from "react";

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
        <div className="input-container">
          <p>{prompt}: </p>
          <input type="text" name="prompt-value" autoComplete="off" />
        </div>
        <div className="input-container center">
          <Button type="submit" children="Submit" width="200px" />
        </div>
      </div>
    </form>
  );
}
