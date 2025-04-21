"use client"

import { useState } from "react"
import { HeroGeometric } from "@/components/ui/shape-landing-hero"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { RegistrationModal } from "@/components/ui/registration-modal"
import { AnimatedBackgroundLogo } from "@/components/ui/animated-background-logo"
import { WorldMapDemo } from "@/components/landing/world-map-demo"
import { AuthModal } from "@/components/ui/auth-modal"
import { LoadingScreen } from "@/components/ui/loading-screen"

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalView, setAuthModalView] = useState<"signIn" | "signUp">("signUp")

  return (
    <>
      <LoadingScreen />
      <div className="flex min-h-screen flex-col bg-[#030303] text-white">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="relative">
            <AnimatedBackgroundLogo />
            <HeroGeometric
              badge="" // Removed the badge
              title1="Empowering Your"
              title2="Financial Future"
              description="Apply for loans, invest in stokvela groups, and manage your finances with our AI-powered platform."
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="get-started-button bg-gradient-to-r from-green-500 to-sky-500 text-white border-none font-semibold"
                    onClick={() => {
                      setAuthModalView("signUp")
                      setIsAuthModalOpen(true)
                    }}
                  >
                    <span className="relative z-10">Apply for Loan</span>
                    <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
                  </Button>
                </motion.div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-xl mx-auto">
                {["Quick loan approvals", "Low interest rates", "Flexible repayments"].map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.5 + i * 0.2, duration: 0.5 }}
                    className="flex items-center gap-2 justify-center sm:justify-start"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-white/70">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </HeroGeometric>
          </div>
          <FeaturesSection />
          <TestimonialsSection />
          <CTASection />
          <WorldMapDemo />
        </main>
        <Footer />

        {/* Auth Modal */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authModalView} />
      </div>
    </>
  )
}
