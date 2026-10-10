"use client";

import { motion } from "motion/react";
import { LandingPage } from "@/components/landing/LandingPage";

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.3 }}
    >
      <LandingPage />
    </motion.div>
  );
}