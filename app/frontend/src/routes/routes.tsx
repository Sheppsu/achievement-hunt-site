import { type RouteObject } from "react-router-dom";
import Header from "components/Header";
import Index from "./index";
import Logout from "./logout";
import AchievementCompletionPage from "./achievements";
import AchievementsIndex from "./team";
import StaffPage from "routes/staff.tsx";

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
      {
        path: "staff",
        element: <StaffPage />
      }
    ],
  },
];
