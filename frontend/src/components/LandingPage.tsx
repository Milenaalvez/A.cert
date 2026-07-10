"use client";

import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";

export default function LandingPage() {
  return (
    <div style={{ background: "#030205", minHeight: "100vh" }}>
      <Navbar />
      <Hero />
    </div>
  );
}
