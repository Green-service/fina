"use client"

import Image from "next/image"
import { ThreeDPhotoCarouselDemo } from "@/components/ui/3d-carousel-demo"

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <Image
          src="/images/greenfina-building.png"
          alt="Green Fina Building"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Fade effect at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030303] to-transparent z-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Powerful Financial Features
          </h2>
          <p className="text-lg font-bold text-sky-300">Everything you need to manage your finances in one place.</p>
        </div>
        
        {/* 3D Carousel Demo */}
        <div className="flex justify-center">
          <ThreeDPhotoCarouselDemo />
        </div>
      </div>
    </section>
  )
}
