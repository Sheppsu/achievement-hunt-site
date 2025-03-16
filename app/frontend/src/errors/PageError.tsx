export class PageError extends Error {
  public render(): JSX.Element {
    return <div>{this.message}</div>;
  }
}
