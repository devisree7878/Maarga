import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { UIProvider } from './context/UIContext';
import { useTrackActivity } from './hooks/useTrackActivity';

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
<Route path="/admin" element={<AdminDashboardPage />} />
import {
  startStudyReminder,
  stopStudyReminder,
} from './services/studyReminder';
function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <Loader2 size={22} className="animate-spin text-[rgb(var(--text-dim))]" />
    </div>
  );
}

function ProfileErrorScreen() {
  const { refreshProfile, authError, signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4">
      <div className="max-w-sm text-center">
        <p className="text-sm font-semibold text-[rgb(var(--text))] mb-1">Couldn't load your profile</p>
        <p className="text-xs text-[rgb(var(--text-muted))] mb-5">{authError || 'Something went wrong loading your ELEVORA account.'}</p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={refreshProfile} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl accent-bg text-white text-sm font-semibold">
            <RotateCcw size={14} /> Retry
          </button>
          <button onClick={signOut} className="px-3.5 py-2 rounded-xl bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] text-sm font-medium">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// Every authenticated, onboarded page lives inside this shell: it mounts
// the per-user AppProvider (Supabase-backed plan data), the activity
// tracker (drives the admin "Active Today/Week/Month" stats), and the
// persistent nav chrome.
function AuthenticatedShell() {
  const { user, profile } = useAuth();

  useTrackActivity();

  // Start the user's daily study reminder
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
          <Sidebar />

          <main className="flex-1 min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/days" element={<DaysPage />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/mistakes" element={<MistakesPage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route
                path="/chat/:friendId"
                element={<ChatPage />}
              />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />
            </Routes>
          </main>

          <BottomNav />
          <GlobalSearch />
          <DayPanel />
        </div>
      </UIProvider>
    </AppProvider>
  );
}
// Everything that isn't the dedicated auth/onboarding/admin routes lands
// here. Decides, in order: signed out -> landing page; still resolving the
// session/profile -> loader; profile failed to load -> retry screen; first
// login -> onboarding; otherwise -> the authenticated app.
function MainArea() {
  const { authLoading, user, profile, profileLoading, authError } = useAuth();

  if (authLoading) return <FullScreenLoader />;
  if (!user) return <HomePage />;
  if (profileLoading) return <FullScreenLoader />;
  if (!profile) {
    if (authError) return <ProfileErrorScreen />;
    return <FullScreenLoader />;
  }
  if (!profile.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return <AuthenticatedShell />;
}

// Admin protection is defense-in-depth on top of the server-side check:
// `isAdmin` mirrors profiles.role (only ever set to 'admin' for
// devisreeadmin@gmail.com by the handle_new_user trigger), and every admin
// data call goes through the get_admin_stats() RPC, which independently
// verifies is_admin() in Postgres before returning anything. A non-admin
// typing /admin in the URL bar is redirected here — but even if this check
// were bypassed, the RPC itself would refuse to return data.
function RequireAdmin({ children }) {
  const { authLoading, user, profileLoading, isAdmin } = useAuth();
  if (authLoading || (user && profileLoading)) return <FullScreenLoader />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { authLoading, user } = useAuth();
  if (authLoading) return <FullScreenLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function OnboardingRoute() {
  const { authLoading, user, profile, profileLoading } = useAuth();
  if (authLoading || (user && profileLoading)) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;
  return <OnboardingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
      {/* Reachable both signed-out (fresh recovery link) and signed-in (mid recovery session), so no PublicOnly/RequireAuth gate here. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
      <Route path="/*" element={<MainArea />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
