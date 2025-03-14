import { type RouteObject } from "react-router-dom";
import Header from "components/Header";
import Index from "./index";
import Logout from "./logout";
import AchievementCompletionPage from "./achievements";
import AchievementsIndex from "./team";
import Credit from "routes/credit.tsx";
import Staff from "routes/staff.tsx";
import ErrorBoundary from "../errors/ErrorBoundary.tsx";

export const routes: RouteObject[] = [
  {
    element: <Header />,
    shouldRevalidate: () => false,
    ErrorBoundary,
    children: [
      {
        ErrorBoundary,
        children: [
          {
            index: true,
            element: <Index />,
          },
          {
            path: "logout",
            element: <Logout />,
          },
          {
            path: "teams",
            element: <AchievementsIndex />,
          },
          {
            path: "achievements",
            element: <AchievementCompletionPage />,
          },
          {
            path: "credits",
            element: <Credit />,
          },
          {
            path: "staff",
            element: <Staff />,
          },
        ],
      },
    ],
  },
];
