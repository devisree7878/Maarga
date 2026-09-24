
import React, { useEffect } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';

import MaterialPlannerPage from './pages/MaterialPlannerPage';

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext';

import { AppProvider } from './context/AppContext';
import { UIProvider } from './context/UIContext';

import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import GlobalSearch from './components/layout/GlobalSearch';
import DayPanel from './components/day/DayPanel';

import HomePage from './pages/HomePage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import OnboardingPage from './pages/OnboardingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import Dashboard from './pages/Dashboard';
import DaysPage from './pages/DaysPage';
import ProblemsPage from './pages/ProblemsPage';
import MistakesPage from './pages/MistakesPage';
import GoalsPage from './pages/GoalsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import GamesPage from './pages/GamesPage';
import FriendsPage from './pages/FriendsPage';
import ChatPage from './pages/ChatPage';

import {
  startStudyReminder,
  stopStudyReminder,
} from './services/studyReminder';


/* =========================================================
   FULL SCREEN LOADER
========================================================= */

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <Loader2
        size={22}
        className="animate-spin text-[rgb(var(--text-dim))]"
      />
    </div>
  );
}


/* =========================================================
   PROFILE ERROR SCREEN
========================================================= */

function ProfileErrorScreen() {
  const {
    refreshProfile,
    authError,
    signOut,
  } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4">
      <div className="max-w-sm text-center">

        <p className="text-sm font-semibold text-[rgb(var(--text))] mb-1">
          Couldn't load your profile
        </p>

        <p className="text-xs text-[rgb(var(--text-muted))] mb-5">
          {authError ||
            'Something went wrong loading your account.'}
        </p>

        <div className="flex items-center justify-center gap-2">

          <button
            type="button"
            onClick={refreshProfile}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl accent-bg text-white text-sm font-semibold"
          >
            <RotateCcw size={14} />
            Retry
          </button>

          <button
            type="button"
            onClick={signOut}
            className="px-3.5 py-2 rounded-xl bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] text-sm font-medium"
          >
            Sign Out
          </button>

        </div>
      </div>
    </div>
  );
}


/* =========================================================
   AUTHENTICATED APPLICATION SHELL
========================================================= */

function AuthenticatedShell() {
  const { user, profile } = useAuth();

  /* -------------------------------------------------------
     DAILY STUDY REMINDER
  ------------------------------------------------------- */

  useEffect(() => {
    if (!profile) return;

    startStudyReminder({
      startTime: profile.daily_start_time,
      goal: profile.goal,
      enabled: profile.reminders_enabled !== false,
    });

    return () => {
      stopStudyReminder();
    };
  }, [
    profile?.daily_start_time,
    profile?.goal,
    profile?.reminders_enabled,
  ]);

  return (
    <AppProvider
      userId={user.id}
      initialDuration={profile.schedule_days}
    >
      <UIProvider>

        <div className="flex min-h-screen bg-[rgb(var(--bg))]">

          {/* LEFT SIDEBAR */}
          <Sidebar />

          {/* MAIN CONTENT */}
          <main className="flex-1 min-w-0">
            <Routes>

              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/days"
                element={<DaysPage />}
              />

              <Route
                path="/material-planner"
                element={<MaterialPlannerPage />}
              />

              <Route
                path="/problems"
                element={<ProblemsPage />}
              />

              <Route
                path="/mistakes"
                element={<MistakesPage />}
              />

              <Route
                path="/games"
                element={<GamesPage />}
              />

              <Route
                path="/friends"
                element={<FriendsPage />}
              />

              <Route
                path="/chat/:friendId"
                element={<ChatPage />}
              />

              <Route
                path="/goals"
                element={<GoalsPage />}
              />

              <Route
                path="/analytics"
                element={<AnalyticsPage />}
              />

              <Route
                path="/settings"
                element={<SettingsPage />}
              />

              {/* Unknown authenticated route */}
              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />

            </Routes>
          </main>

          {/* MOBILE NAVIGATION */}
          <BottomNav />

          {/* GLOBAL COMPONENTS */}
          <GlobalSearch />
          <DayPanel />

        </div>

      </UIProvider>
    </AppProvider>
  );
}


/* =========================================================
   MAIN AREA
========================================================= */

function MainArea() {
  const {
    authLoading,
    user,
    profile,
    profileLoading,
    authError,
  } = useAuth();

  /* Authentication still loading */
  if (authLoading) {
    return <FullScreenLoader />;
  }

  /* User is logged out */
  if (!user) {
    return <HomePage />;
  }

  /* Profile still loading */
  if (profileLoading) {
    return <FullScreenLoader />;
  }

  /* Profile failed */
  if (!profile) {
    if (authError) {
      return <ProfileErrorScreen />;
    }

    return <FullScreenLoader />;
  }

  /* User hasn't completed onboarding */
  if (!profile.onboarding_completed) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    );
  }

  /* Normal authenticated application */
  return <AuthenticatedShell />;
}


/* =========================================================
   ADMIN ROUTE PROTECTION
========================================================= */

function RequireAdmin({ children }) {
  const {
    authLoading,
    user,
    profileLoading,
    isAdmin,
  } = useAuth();

  if (
    authLoading ||
    (user && profileLoading)
  ) {
    return <FullScreenLoader />;
  }

  if (!user || !isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


/* =========================================================
   PUBLIC ONLY ROUTES
========================================================= */

function PublicOnly({ children }) {
  const {
    authLoading,
    user,
  } = useAuth();

  if (authLoading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


/* =========================================================
   ONBOARDING ROUTE
========================================================= */

function OnboardingRoute() {
  const {
    authLoading,
    user,
    profile,
    profileLoading,
  } = useAuth();

  if (
    authLoading ||
    (user && profileLoading)
  ) {
    return <FullScreenLoader />;
  }

  /* Not logged in */
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /* Already completed onboarding */
  if (profile?.onboarding_completed) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <OnboardingPage />;
}


/* =========================================================
   APPLICATION ROUTES
========================================================= */

function AppRoutes() {
  return (
    <Routes>

      {/* =================================================
          AUTHENTICATION
      ================================================= */}

      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <ForgotPasswordPage />
          </PublicOnly>
        }
      />

      {/* =================================================
          PASSWORD RESET

          Accessible during the Supabase recovery session.
      ================================================= */}

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      {/* =================================================
          ONBOARDING
      ================================================= */}

      <Route
        path="/onboarding"
        element={<OnboardingRoute />}
      />

      {/* =================================================
          ADMIN
      ================================================= */}

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboardPage />
          </RequireAdmin>
        }
      />

      {/* =================================================
          EVERYTHING ELSE
      ================================================= */}

      <Route
        path="/*"
        element={<MainArea />}
      />

    </Routes>
  );
}


/* =========================================================
   ROOT APP
========================================================= */

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
