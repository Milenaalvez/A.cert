"use client";

import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0D1425]">
      <Navbar />
      <Hero />
    </div>
  );
}
