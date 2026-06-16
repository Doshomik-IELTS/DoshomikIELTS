import React from "react";
import { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { FooterSection } from "@/components/layout/footer-section";
import { HomeHero } from "@/components/home/home-hero";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeCourses } from "@/components/home/home-courses";
import { HomeMentor } from "@/components/home/home-mentor";
import { HomeTestimonials } from "@/components/home/home-testimonials";
import { HomeNewsletter } from "@/components/home/home-newsletter";

export const metadata: Metadata = {
  title: "DOshomik IELTS",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-gray">
      <PublicHeader />
      <main>
        <HomeHero />
        <HomeFeatures />
        <HomeCourses />
        <HomeMentor />
        <HomeTestimonials />
        <HomeNewsletter />
      </main>
      <FooterSection />
    </div>
  );
}
