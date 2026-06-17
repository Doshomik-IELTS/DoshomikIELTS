"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const Header: React.FC = () => {
  const [sticky, setSticky] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false);

  const handleScroll = () => {
    setSticky(window.scrollY >= 80);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Courses", href: "#courses" },
    { label: "Mentor", href: "#mentor" },
    { label: "Testimonial", href: "#testimonial" },
  ];

  return (
    <header
      className={`fixed top-0 z-40 w-full bg-white transition-all duration-300 ${
        sticky ? "shadow-lg py-3" : "shadow-none py-5"
      }`}
    >
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-primary text-white shadow-sm rounded-xl w-10 h-10">
            <span className="text-[0.72em] font-black leading-none">D</span>
            <span className="absolute right-[18%] top-[16%] h-1.5 w-1.5 rounded-full bg-success" />
          </div>
          <span className="text-secondary font-bold text-xl">
            DOshomik IELTS
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="text-sm font-medium text-grey hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/signin"
            className="bg-primary text-white hover:bg-primary-hover px-8 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-primary/15 text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setNavbarOpen(!navbarOpen)}
          className="block lg:hidden p-2 rounded-lg"
          aria-label="Toggle mobile menu"
        >
          <span
            className={`block w-6 h-0.5 bg-secondary transition-all duration-300 ${
              navbarOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-secondary mt-1.5 transition-all duration-300 ${
              navbarOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-secondary mt-1.5 transition-all duration-300 ${
              navbarOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {navbarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setNavbarOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          navbarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2" onClick={() => setNavbarOpen(false)}>
            <div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-primary text-white shadow-sm rounded-lg w-8 h-8">
              <span className="text-[0.72em] font-black leading-none">D</span>
              <span className="absolute right-[18%] top-[16%] h-1.5 w-1.5 rounded-full bg-success" />
            </div>
            <span className="text-secondary font-bold text-base">
              DOshomik IELTS
            </span>
          </Link>
          <button
            onClick={() => setNavbarOpen(false)}
            className="text-grey hover:text-primary"
            aria-label="Close menu"
          >
            <span className="block w-6 h-0.5 bg-secondary rotate-45 translate-y-0.5" />
            <span className="block w-6 h-0.5 bg-secondary -rotate-45 -translate-y-0.5" />
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          {navItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="px-4 py-3 rounded-lg text-grey hover:bg-primary-soft hover:text-primary transition-colors"
              onClick={() => setNavbarOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
            <Link
              href="/signin"
              className="w-full bg-primary text-white px-4 py-3 rounded-full text-sm font-medium text-center block"
              onClick={() => setNavbarOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full bg-primary/15 text-primary px-4 py-3 rounded-full text-sm font-medium text-center block hover:bg-primary hover:text-white transition-colors"
              onClick={() => setNavbarOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
