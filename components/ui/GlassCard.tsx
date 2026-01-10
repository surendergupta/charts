"use client";

import React from "react";
import { motion } from "motion/react";

type GlassCardProps = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
};

const GlassCard = ({
  title,
  subtitle,
  children,
  className = "",
}: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative rounded-2xl border border-white/20 
        bg-white/10 backdrop-blur-xl shadow-xl
        hover:shadow-2xl transition-shadow
        ${className}`}
    >
      {/* Glass gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-white/10 to-transparent pointer-events-none" />

      <div className="relative p-5">
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-black/90 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-black/70">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Chart / content */}
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
