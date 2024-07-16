import { type RouteObject } from "react-router-dom";
import Header from "components/Header";
import Index from "./index";
import Logout from "./logout";
import AchievementHeader from "components/achievements/AchievementHeader";
import AchievementCompletionPage from "./achievements/completion";
import AchievementsIndex from "./achievements";

export const routes: RouteObject[] = [
  {
    element: <Header />,
    shouldRevalidate: () => false,
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
    ],
  },
];
