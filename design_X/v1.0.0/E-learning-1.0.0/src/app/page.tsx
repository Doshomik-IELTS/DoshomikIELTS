import Hero from "@/components/Home/Hero";
import Features from "@/components/Home/Features";
import Courses from "@/components/Home/Courses";
import Mentor from "@/components/Home/Mentor";
import Testimonial from "@/components/Home/Testimonials";
import Newsletter from "@/components/Home/Newsletter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DOshomik IELTS",
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Courses />
      <Mentor />
      <Testimonial />
      <Newsletter />
    </main>
  );
}
