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
import AchievementPage from "routes/achievement.tsx";

const defaultRoutes: RouteObject[] = [
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
    children: [
      {
        index: true,
        element: <AchievementCompletionPage />,
      },
      {
        path: ":achievementId",
        element: <AchievementPage />,
      },
    ],
  },
  {
    path: "credits",
    element: <Credit />,
  },
  {
    path: "staff",
    children: [
      {
        index: true,
        element: <Staff />,
      },
      {
        path: "achievements/:achievementId",
        element: <StaffAchievement />,
      },
    ],
  },
  {
    path: "admin",
    element: <AdminPage />,
  },
];

const iterationRoutes: RouteObject[] = [
  {
    path: "iterations/:iterationId",
    children: defaultRoutes,
  },
];

export const routes: RouteObject[] = [
  {
    element: <PageLayout />,
    shouldRevalidate: () => false,
    ErrorBoundary,
    children: [
      {
        ErrorBoundary,
        children: defaultRoutes.concat(iterationRoutes),
      },
    ],
  },
];
