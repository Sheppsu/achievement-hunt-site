export class PageError extends Error {
  public render(): React.ReactNode {
    return <div>{this.message}</div>;
  }
}
