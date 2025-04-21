"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RegistrationModal } from "@/components/ui/registration-modal"

export function CTASection() {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#030303]" />
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.03] to-emerald-500/[0.03]" />

      {/* Animated shapes */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-green-500/5 blur-3xl animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl animate-pulse"
        style={{ animationDuration: "12s" }}
      />

      {/* Fade effect at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030303] to-transparent z-10"></div>

      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white/90 to-sky-400">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already managing their finances smarter with Green Fina. Get started today
            and take control of your financial journey.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              className="get-started-button bg-gradient-to-r from-green-500 to-sky-500 text-white border-none font-semibold"
              onClick={() => setIsRegistrationModalOpen(true)}
            >
              Apply for Loan <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal isOpen={isRegistrationModalOpen} onClose={() => setIsRegistrationModalOpen(false)} />
    </section>
  )
}
