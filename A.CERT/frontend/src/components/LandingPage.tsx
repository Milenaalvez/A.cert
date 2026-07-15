"use client";

import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";

export default function LandingPage() {
  return (
    <div style={{ background: "#07101F", minHeight: "100vh" }}>
      <Navbar />
      <Hero />
    </div>
  );
}
