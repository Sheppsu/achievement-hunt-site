import { PageError } from "./PageError.tsx";

export class NotFoundError extends PageError {
  public constructor() {
    super("Page not found");
  }
}
