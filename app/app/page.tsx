"use client";

import { motion } from "framer-motion";
import DashboardContainer from "./components/DashboardContainer";

export default function AppPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.3 }}
    >
      <DashboardContainer />
    </motion.div>
  );
}