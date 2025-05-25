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
import AdminPage from "routes/admin.tsx";

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
            path: "admin",
            element: <AdminPage />,
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
              {
                path: "admin",
                element: <AdminPage />,
              },
            ],
          },
        ],
      },
    ],
  },
];
