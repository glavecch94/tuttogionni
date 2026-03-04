import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import WeeklyViewPage from './pages/WeeklyViewPage';
import TodayWorkoutPage from './pages/TodayWorkoutPage';
import CalendarPage from './pages/CalendarPage';
import WorkoutStatsPage from './pages/WorkoutStatsPage';
import RaccoltaPage from './pages/RaccoltaPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="workouts" element={<WorkoutStatsPage />} />
        <Route path="plans" element={<Navigate to="/workouts" replace />} />
        <Route path="today-workout" element={<TodayWorkoutPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="weekly" element={<WeeklyViewPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="raccolta" element={<RaccoltaPage />} />
      </Route>
    </Routes>
  );
}
