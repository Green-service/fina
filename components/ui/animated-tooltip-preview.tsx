"use client"
import { AnimatedTooltip } from "./animated-tooltip"

const people = [
  {
    id: 1,
    name: "Khudi",
    designation: "Software Developer",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/khudi.jpg-Vo3WGvbh4LqD5CPc1vwx8MppPjuXf7.jpeg",
    testimonial:
      "Green Fina helped me pay my school fees when I was struggling to complete my degree. Their student loan program made it possible for me to graduate and start my career in tech.",
    rating: 5,
  },
  {
    id: 2,
    name: "Mahlatse",
    designation: "Business Owner",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mahlatse.jpg-AgyMoKXMPJrdI1QHRtPhdbw5uSqJPj.jpeg",
    testimonial:
      "Thanks to Green Fina's business loan, I was able to expand my restaurant and hire more staff. Their flexible repayment terms helped me manage my cash flow during the initial growth phase.",
    rating: 5,
  },
  {
    id: 3,
    name: "Nhlamulo",
    designation: "General Worker",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nhlamulo.jpg-UShuqq7tBkvjYnu9E1Zu08EbmVFIxm.jpeg",
    testimonial:
      "Green Fina's stokvela feature helped me save for my daughter's wedding. The community support and regular contributions made it possible to give her the celebration she deserved.",
    rating: 4,
  },
  {
    id: 4,
    name: "Clinton",
    designation: "Software Developer",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/clinton.jpg-13RhA44MwjMEpvMMjgWIj2aI2ZMri9.jpeg",
    testimonial:
      "When I needed emergency funds for my mother's medical treatment, Green Fina's quick loan approval process came through. Their compassionate approach made a difficult time much easier.",
    rating: 5,
  },
]

export const AnimatedTooltipPreview = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <div className="flex flex-row items-center justify-center mb-10 w-full">
        <AnimatedTooltip items={people} />
      </div>
    </div>
  )
}
