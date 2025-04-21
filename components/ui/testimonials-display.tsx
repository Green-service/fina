"use client"

import DisplayCards from "@/components/ui/display-cards"
import { MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

const testimonialCards = [
  {
    title: "Khudi",
    date: "Software Developer",
    description: "Green Fina helped me pay my school fees when I was struggling to complete my degree. Their student loan program made it possible for me to graduate and start my career in tech.",
    icon: "/testimonials/khudi.jpg"
  },
  {
    title: "Mahlatse",
    date: "Business Owner",
    description: "Thanks to Green Fina's business loan, I was able to expand my restaurant and hire more staff. Their flexible repayment terms helped me manage my cash flow during the initial growth phase.",
    icon: "/testimonials/mahlatse.jpg"
  },
  {
    title: "Nhlamulo",
    date: "General Worker",
    description: "Green Fina's stokvela feature helped me save for my daughter's wedding. The community support and regular contributions made it possible to give her the celebration she deserved.",
    icon: "/testimonials/nhlamulo.jpg"
  }
]

export function TestimonialsDisplay() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonialCards.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative group"
          >
            <div className="relative p-6 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 hover:border-green-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 to-emerald-900/30 rounded-xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500/30">
                    <Image
                      src={testimonial.icon}
                      alt={testimonial.title}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90">{testimonial.title}</h3>
                    <p className="text-sm text-white/60">{testimonial.date}</p>
                  </div>
                </div>
                <p className="text-white/80 italic">"{testimonial.description}"</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 