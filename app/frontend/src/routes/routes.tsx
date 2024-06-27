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
        path: "achievements",
        element: <AchievementHeader />,
        children: [
          {
            index: true,
            element: <AchievementsIndex />,
          },
          {
            path: "completion",
            element: <AchievementCompletionPage />,
          },
        ],
      },
    ],
  },
];
