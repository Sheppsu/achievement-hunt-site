import { PageError } from "./PageError.tsx";

export class ForbiddenError extends PageError {
  public constructor() {
    super("Page forbidden");
  }
}
