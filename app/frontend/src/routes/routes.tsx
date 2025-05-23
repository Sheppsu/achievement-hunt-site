import { type RouteObject } from "react-router-dom";
import PageLayout from "components/PageLayout";
import Index from "./index";
import Logout from "./logout";
import AchievementCompletionPage from "./achievements";
import TeamPage from "./team";
import Credit from "routes/credit.tsx";
import Staff from "routes/staff";
import StaffAchievement from "routes/staff/achievement.tsx";
import ErrorBoundary from "../errors/ErrorBoundary.tsx";

export const routes: RouteObject[] = [
  {
    element: <PageLayout />,
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
            element: <TeamPage />,
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
          {
            path: "staff/achievements/:achievementId",
            element: <StaffAchievement />,
          },
          {
            path: "iterations/:iterationId",
            children: [
              {
                index: true,
                element: <Index />,
              },
              {
                path: "teams",
                element: <TeamPage />,
              },
              {
                path: "achievements",
                element: <AchievementCompletionPage />,
              },
            ],
          },
        ],
      },
    ],
  },
];
