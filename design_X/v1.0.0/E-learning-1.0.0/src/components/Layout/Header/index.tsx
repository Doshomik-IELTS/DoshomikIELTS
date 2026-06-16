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
          <div className="bg-secondary rounded-xl w-10 h-10 flex items-center justify-center">
            <span className="text-white text-xl font-bold">D</span>
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
              className="text-grey hover:text-primary font-medium transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/signin"
            className="bg-primary text-white px-8 py-3 rounded-full text-base font-medium hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-primary/15 text-primary px-8 py-3 rounded-full text-base font-medium hover:bg-primary hover:text-white transition-all"
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
            className={`block w-6 h-0.5 bg-midnight-text transition-all duration-300 ${
              navbarOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-midnight-text mt-1.5 transition-all duration-300 ${
              navbarOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-midnight-text mt-1.5 transition-all duration-300 ${
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
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2" onClick={() => setNavbarOpen(false)}>
            <div className="bg-secondary rounded-lg w-8 h-8 flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="text-secondary font-bold text-base">
              DOshomik IELTS
            </span>
          </Link>
          <button
            onClick={() => setNavbarOpen(false)}
            className="p-2 rounded-lg"
            aria-label="Close menu"
          >
            <span className="block w-6 h-0.5 bg-midnight-text rotate-45 translate-y-0.5" />
            <span className="block w-6 h-0.5 bg-midnight-text -rotate-45 -translate-y-0.5" />
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          {navItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="text-grey hover:text-primary font-medium py-2 transition-colors"
              onClick={() => setNavbarOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-6 flex flex-col space-y-3">
            <Link
              href="/signin"
              className="bg-primary text-white text-center px-8 py-3 rounded-full text-base font-medium hover:opacity-90 transition-opacity"
              onClick={() => setNavbarOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-primary/15 text-primary text-center px-8 py-3 rounded-full text-base font-medium hover:bg-primary hover:text-white transition-all"
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
