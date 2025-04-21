"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Star } from "lucide-react"

// Define types for the testimonial card props
interface TestimonialCardProps {
  handleShuffle: () => void;
  testimonial: string;
  position: "front" | "middle" | "back" | "hidden";
  id: number;
  author: string;
  rating: number;
  imagePath: string;
}

export function TestimonialCard({ handleShuffle, testimonial, position, id, author, rating, imagePath }: TestimonialCardProps) {
  const dragRef = React.useRef(0)
  const isFront = position === "front"

  return (
    <motion.div
      style={{
        zIndex: position === "front" ? "2" : position === "middle" ? "1" : "0",
      }}
      animate={{
        rotate: position === "front" ? "-6deg" : position === "middle" ? "0deg" : "6deg",
        x: position === "front" ? "0%" : position === "middle" ? "33%" : "66%",
      }}
      drag={true}
      dragElastic={0.35}
      dragListener={isFront}
      dragConstraints={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onDragStart={(event, info) => {
        if ('clientX' in event) {
          dragRef.current = event.clientX
        }
      }}
      onDragEnd={(event, info) => {
        if ('clientX' in event && dragRef.current - event.clientX > 150) {
          handleShuffle()
        }
        dragRef.current = 0
      }}
      transition={{ duration: 0.35 }}
      className={`absolute left-0 top-0 grid h-[300px] w-[240px] select-none place-content-center space-y-3 rounded-2xl border-2 border-slate-700 bg-slate-800/20 p-3 shadow-xl backdrop-blur-md ${
        isFront ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <img
        src={imagePath}
        alt={`Avatar of ${author}`}
        className="pointer-events-none mx-auto h-20 w-20 rounded-full border-2 border-slate-700 bg-slate-200 object-cover"
        onError={(e) => {
          // Fallback to pravatar if image doesn't exist
          (e.target as HTMLImageElement).src = `https://i.pravatar.cc/128?img=${id}`
        }}
      />
      <span className="text-center text-sm italic text-slate-400">"{testimonial}"</span>
      
      {/* Star Rating */}
      <div className="flex justify-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-slate-600"}`} 
          />
        ))}
      </div>
      
      <span className="text-center text-xs font-medium text-orange-400">{author}</span>
    </motion.div>
  )
}

// Sample testimonials data with the existing people
const testimonials = [
  {
    id: 1,
    author: "Mahlatse",
    testimonial: "Green Fina has completely transformed how I manage my finances. The insights are invaluable!",
    rating: 5,
    imagePath: "/images/mahlatse.jpg"
  },
  {
    id: 2,
    author: "Clinton",
    testimonial: "I've saved more money in 3 months with Green Fina than I did in a year on my own.",
    rating: 4,
    imagePath: "/images/clinton.jpg"
  },
  {
    id: 3,
    author: "Khudi",
    testimonial: "The personalized recommendations have helped me make smarter financial decisions.",
    rating: 5,
    imagePath: "/images/khudi.jpg"
  },
  {
    id: 4,
    author: "Nhlamulo",
    testimonial: "Green Fina's approach to sustainable finance aligns perfectly with my values.",
    rating: 5,
    imagePath: "/images/nhlamulo.jpg"
  }
];

export function TestimonialCards() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  const handleShuffle = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };
  
  // Calculate positions for the three visible cards
  const getPosition = (index: number) => {
    const relativeIndex = (index - currentIndex + testimonials.length) % testimonials.length;
    if (relativeIndex === 0) return "front";
    if (relativeIndex === 1) return "middle";
    if (relativeIndex === 2) return "back";
    return "hidden";
  };
  
  return (
    <div className="relative h-[300px] w-full max-w-[240px] mx-auto">
      {testimonials.map((testimonial, index) => {
        const position = getPosition(index);
        if (position === "hidden") return null;
        
        return (
          <TestimonialCard
            key={testimonial.id}
            id={testimonial.id}
            author={testimonial.author}
            testimonial={testimonial.testimonial}
            position={position}
            handleShuffle={handleShuffle}
            rating={testimonial.rating}
            imagePath={testimonial.imagePath}
          />
        );
      })}
    </div>
  );
}
