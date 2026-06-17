"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { Icon } from "@iconify/react";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { RegisterForm } from "@/app/(auth)/register/register-form";
import { Logo } from "@/components/layout/logo";

const navItems = siteConfig.nav;

export function PublicHeader() {
  const [sticky, setSticky] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const signInRef = useRef<HTMLDivElement>(null);
  const signUpRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY >= 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (signInRef.current && !signInRef.current.contains(target)) setIsSignInOpen(false);
      if (signUpRef.current && !signUpRef.current.contains(target)) setIsSignUpOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target) && navbarOpen) setNavbarOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navbarOpen]);

  useEffect(() => {
    document.body.style.overflow = isSignInOpen || isSignUpOpen || navbarOpen ? "hidden" : "";
  }, [isSignInOpen, isSignUpOpen, navbarOpen]);

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-all duration-300 bg-white ${
        sticky ? "shadow-lg py-3" : "shadow-none py-4"
      }`}
    >
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Logo variant="full" size="md" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-grey hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={() => setIsSignInOpen(true)}
            className="bg-primary text-white hover:bg-primary-hover px-8 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUpOpen(true)}
            className="bg-primary/15 text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setNavbarOpen(!navbarOpen)}
          className="block lg:hidden p-2 rounded-lg"
          aria-label="Toggle mobile menu"
        >
          <span className={`block w-6 h-0.5 bg-secondary transition-all ${navbarOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block w-6 h-0.5 bg-secondary mt-1.5 transition-all ${navbarOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-secondary mt-1.5 transition-all ${navbarOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Sign In Modal */}
      {isSignInOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div ref={signInRef} className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white px-8 pt-14 pb-8 text-center">
            <button
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-4 right-6 text-grey hover:text-primary transition-colors"
              aria-label="Close"
            >
              <Icon icon="tabler:x" className="text-2xl" />
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-midnight-text">Welcome back</h2>
              <p className="mt-1 text-sm text-grey">Sign in to continue your IELTS journey</p>
            </div>
            <LoginForm nextPath="/dashboard" />
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {isSignUpOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div ref={signUpRef} className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white px-8 pt-14 pb-8 text-center">
            <button
              onClick={() => setIsSignUpOpen(false)}
              className="absolute top-4 right-6 text-grey hover:text-primary transition-colors"
              aria-label="Close"
            >
              <Icon icon="tabler:x" className="text-2xl" />
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-midnight-text">Create your account</h2>
              <p className="mt-1 text-sm text-grey">Start your IELTS preparation journey</p>
            </div>
            <RegisterForm />
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {navbarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setNavbarOpen(false)} />
      )}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed top-0 right-0 h-full w-full bg-white shadow-lg transform transition-transform duration-300 max-w-xs z-50 ${
          navbarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Link href="/" className="shrink-0">
            <Logo variant="text" size="md" />
          </Link>
          <button
            onClick={() => setNavbarOpen(false)}
            className="text-grey hover:text-primary"
            aria-label="Close menu"
          >
            <Icon icon="tabler:x" className="text-2xl" />
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setNavbarOpen(false)}
              className="px-4 py-3 rounded-lg text-grey hover:bg-primary-soft hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
            <button
              onClick={() => { setIsSignInOpen(true); setNavbarOpen(false); }}
              className="w-full bg-primary text-white px-4 py-3 rounded-full text-sm font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUpOpen(true); setNavbarOpen(false); }}
              className="w-full bg-primary/15 text-primary px-4 py-3 rounded-full text-sm font-medium"
            >
              Sign Up
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
