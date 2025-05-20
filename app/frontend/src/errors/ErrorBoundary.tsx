import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { PageError } from "./PageError.tsx";
import PageLayout from "components/PageLayout.tsx";

export default function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof PageError) {
    return error.render();
  }

  if (error instanceof Error) {
    return <div>Unhandled page error occurred: {error.message}</div>;
  }

  if (isRouteErrorResponse(error)) {
    return (
      <>
        <PageLayout />
        <div>
          {error.status} Error: {error.statusText}
        </div>
      </>
    );
  }

  return <div>Unknown page error occurred</div>;
}
