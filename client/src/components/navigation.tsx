import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Gift,
  Layers,
  Brain,
  Menu,
  X,
  Search,
  User,
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
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon?: any; }) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring focus-visible:ring-offset-2` +
        (isActive(href)
          ? " bg-primary text-primary-foreground"
          : " text-muted-foreground hover:bg-muted/80")}
      aria-current={isActive(href) ? "page" : undefined}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="rounded-md p-1 bg-gray-100 border border-gray-200">
                <span className="text-lg">🃏</span>
              </div>
              <div className="truncate">
                <h1 className="text-sm font-semibold text-gray-900 leading-5">Chinese Cards</h1>
                <p className="text-xs text-gray-500 -mt-0.5">Study • Collect • Train</p>
              </div>
            </Link>
          </div>

          {/* Center / Desktop nav */}
          <nav className="hidden md:flex md:items-center md:space-x-2">
            <NavLink href="/" icon={Gift}>Pack Opening</NavLink>
            <NavLink href="/collection" icon={Layers}>Collection</NavLink>
            <NavLink href="/training" icon={Brain}>Training</NavLink>
          </nav>

          {/* Right: Search, counter, profile, mobile button */}
          <div className="flex items-center gap-3">
            {/* Search (desktop) */}
            <div className="hidden md:flex items-center border border-gray-200 rounded-md px-2 py-1 bg-white shadow-sm">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                aria-label="Search cards"
                placeholder="Search cards, decks..."
                className="ml-2 w-44 text-sm placeholder-gray-400 bg-transparent focus:outline-none"
              />
            </div>

            {/* Card counter */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50 border border-gray-200">
              <span className="text-sm">🎴</span>
              <div className="text-sm font-semibold" data-testid="card-count">{cardCount}</div>
              <div className="text-sm text-gray-500">/ {totalCards}</div>
            </div>

            {/* Profile / Actions */}
            <button
              className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-md border border-gray-200 hover:shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-offset-2"
              aria-label="Open profile menu"
            >
              <User className="h-4 w-4" />
              <span className="text-sm">Account</span>
            </button>

            {/* Mobile menu button */}
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

        {/* Mobile panel */}
        <div
          className={`md:hidden mt-2 overflow-hidden transition-[max-height,opacity] duration-200 ${
            mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="space-y-2 pb-4">
            <div className="flex flex-col gap-1 px-2">
              <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
                <Gift className="h-4 w-4" /> Pack Opening
              </Link>
              <Link href="/collection" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
                <Layers className="h-4 w-4" /> Collection
              </Link>
              <Link href="/training" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
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
                <Link href="/collection" className="text-sm text-blue-600">View collection</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
