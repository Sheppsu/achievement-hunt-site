import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { routes } from "./routes/routes.tsx";
import { PageTransitionContextProvider } from "contexts/PageTransitionContext.tsx";

const router = createBrowserRouter(routes);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PageTransitionContextProvider>
        <RouterProvider router={router} />
      </PageTransitionContextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
