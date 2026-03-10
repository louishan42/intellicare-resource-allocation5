import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar nav - left */}
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <Link to="/" className="block p-4 border-b border-slate-200 hover:bg-slate-50/50 transition">
          <div className="flex items-center gap-2">
            <Logo className="h-11 w-11 shrink-0" showText={false} asLink={false} />
            <div>
              <div className="font-semibold text-slate-900 text-sm">IntelliCare</div>
              <div className="text-xs text-slate-500">Resource Allocation</div>
            </div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to={user?.role === "admin" ? "/admin" : user?.role === "staff" ? "/staff" : "/patient"}
            end
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`
            }
          >
            {user?.role === "admin" ? "Overview" : "Home"}
          </NavLink>
          {user?.role === "admin" && (
            <NavLink
              to="/admin/booking-load"
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`
              }
            >
              Booking Load
            </NavLink>
          )}
          <NavLink
            to="/status"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`
            }
          >
            Status
          </NavLink>
          <NavLink
            to="/departments"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`
            }
          >
            Departments
          </NavLink>
        </nav>
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
