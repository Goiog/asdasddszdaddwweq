import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Gift,
  Layers,
  Brain,
  Menu,
  X,
  Search,
  User,
  Settings,
  Bell
} from "lucide-react";

interface NavigationProps {
  cardCount: number;
  totalCards: number;
}

// Improved, accessible, responsive Navigation component inspired by GitHub's clean header.
// - Desktop: compact links + search + counter + profile
// - Mobile: hamburger toggles an accessible panel
// - Uses Tailwind utility classes (adjust tokens to your project's design system)

export default function Navigation({ cardCount, totalCards }: NavigationProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({
    to,
    children,
    icon: Icon,
  }: {
    to: string;
    children: React.ReactNode;
    icon?: React.ComponentType<any>;
  }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring focus-visible:ring-offset-2 ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted/80"
        }`
      }
      aria-current={isActive(to) ? "page" : undefined}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/"
                className="flex items-center gap-2 no-underline focus:outline-none"
              >
                <div className="rounded-md p-1 bg-gray-100 border border-gray-200">
                  <span className="text-lg"></span>
                </div>
                <div className="truncate">
                  <h1 className="text-sm font-semibold text-gray-900 leading-5">
                    Chinese Cards
                  </h1>
                  <p className="text-xs text-gray-500 -mt-0.5">
                    Study • Collect • Train
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-2">
              <NavItem to="/" icon={Gift}>
                Pack Opening
              </NavItem>
              <NavItem to="/collection" icon={Layers}>
                Collection
              </NavItem>
              <NavItem to="/training" icon={Brain}>
                Training
              </NavItem>
            </nav>
          </div>

          {/* Right: Counter + Buttons */}
          <div className="flex items-center gap-3">
            {/* Card counter */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50 border border-gray-200">
              <span className="text-sm">🎴</span>
              <div
                className="text-sm font-semibold"
                data-testid="card-count"
              >
                {cardCount}
              </div>
              <div className="text-sm text-gray-500">/ {totalCards}</div>
            </div>

            {/* Actions */}
            <button
              className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-md border border-gray-200 hover:shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-offset-2"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="text-sm">Notifications</span>
            </button>

            <button
              className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-md border border-gray-200 hover:shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-offset-2"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </button>

            <Link
              to="/Account"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-md border border-gray-200 hover:shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-offset-2"
              aria-label="Account"
            >
              <User className="h-4 w-4" />
              <span className="text-sm">Account</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md border border-gray-200 bg-white"
              onClick={() => setMobileOpen((s) => !s)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        <div
          className={`md:hidden mt-2 overflow-hidden transition-[max-height,opacity] duration-200 ${
            mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="space-y-2 pb-4">
            <div className="flex flex-col gap-1 px-2">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                <Gift className="h-4 w-4" /> Pack Opening
              </Link>
              <Link
                to="/collection"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                <Layers className="h-4 w-4" /> Collection
              </Link>
              <Link
                to="/training"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                <Brain className="h-4 w-4" /> Training area
              </Link>
            </div>

            <div className="px-3">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2">
                <div className="flex items-center gap-2">
                  <span>🎴</span>
                  <div className="text-sm font-semibold">{cardCount}</div>
                  <div className="text-sm text-gray-500">/ {totalCards}</div>
                </div>
                <Link
                  to="/collection"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}