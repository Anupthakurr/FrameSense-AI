import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';

// ShinyText Component Custom implementation
const ShinyText = ({ text, disabled = false, speed = 3, className = '' }: { text: string, disabled?: boolean, speed?: number, className?: string }) => {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      initial={{ backgroundPosition: '200% center' }}
      animate={disabled ? {} : { backgroundPosition: '-200% center' }}
      transition={{
        repeat: Infinity,
        duration: speed,
        ease: 'linear',
      }}
      style={{
        background: `linear-gradient(
          100deg,
          #64CEFB 0%,
          #64CEFB 40%,
          #ffffff 50%,
          #64CEFB 60%,
          #64CEFB 100%
        )`,
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {text}
    </motion.div>
  );
};


export default function DesignProHero({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black font-['Inter']">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4" type="video/mp4" />
      </video>

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full flex flex-col items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        


        {/* Hero Section Center */}
        {/* Hero Section Center */}
        <div className="flex flex-col items-center text-center" style={{ marginTop: '24vh' }}>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white/80 text-xs sm:text-sm uppercase tracking-tighter mb-4"
          >
            Scene-Based AI Screenshot Extraction
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tighter leading-[0.85] flex flex-col items-center mb-6"
          >
            <span className="text-white font-medium pb-2">Turn any YouTube video</span>
            <ShinyText text="into a smart PDF" speed={3} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-white/80 text-sm md:text-lg max-w-2xl text-center mx-auto leading-relaxed"
          >
            SnapMint detects scene changes, filters out frames where a person is blocking the content, and assembles a clean, timestamped PDF — instantly.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 bg-black hover:bg-gray-900 border border-white/10 text-white rounded-full px-6 md:px-8 py-3 md:py-4 flex items-center gap-3 group transition-all"
            onClick={onGetStarted}
          >
            <span className="font-medium">Get Started</span>
            <div className="bg-white/10 rounded-full p-1 group-hover:bg-white/20 transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </div>
        
        {/* Spacer for bottom */}
        <div className="mt-auto pb-12" />
      </div>
    </section>
  );
}
