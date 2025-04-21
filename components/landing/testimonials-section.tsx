"use client"

import { motion } from "framer-motion"
import { TestimonialCards } from "@/components/ui/testimonial-cards"

export function TestimonialsSection() {
  return (
    <section className="relative w-full py-20 pb-32 overflow-hidden">
      {/* Dark futuristic background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-green-950 to-emerald-900" />
      
      {/* Animated glow effects */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-green-500/5 blur-3xl"
        style={{ top: "20%", left: "10%" }}
        animate={{
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl"
        style={{ bottom: "10%", right: "10%" }}
        animate={{
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "linear",
        }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      {/* Fade effect at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030303] to-transparent z-10"></div>
      
      <div className="container relative z-20 mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
              What Our Customers Say
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Hear from people who have transformed their financial lives with Green Fina
            </p>
          </motion.div>
        </div>
        
        {/* Display Cards Section */}
        <div className="flex justify-center items-center mb-16">
        <TestimonialCards />
        </div>
      </div>
    </section>
  )
}
