import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, LogOut, Menu, X, Dumbbell, Target, Library } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/workouts', icon: Dumbbell, label: 'Allenamenti' },
    { to: '/events', icon: Target, label: 'Obiettivi' },
    { to: '/raccolta', icon: Library, label: 'Raccolta' },
    { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-primary-600">TuttoGionni</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="absolute top-14 left-0 right-0 bg-white shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-500">Ciao,</p>
              <p className="font-medium">{user?.name}</p>
            </div>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                    isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full mt-2"
            >
              <LogOut size={20} />
              <span>Esci</span>
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary-600">TuttoGionni</h1>
        </div>
        <nav className="flex-1 p-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-3 px-4">
            <p className="text-sm text-gray-500">Ciao,</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut size={20} />
            <span>Esci</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen overflow-x-hidden">
        <div className="p-3 sm:p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`
              }
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
