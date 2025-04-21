"use client"

import { memo, useEffect, useLayoutEffect, useMemo, useState } from "react"
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion"
import { BarChart3, CreditCard, DollarSign, Lock, MessageSquare, PiggyBank, Shield, Users } from "lucide-react"

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

const IS_SERVER = typeof window === "undefined"

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {}
): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue
    }
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query)
    }
    return defaultValue
  })

  const handleChange = () => {
    setMatches(getMatches(query))
  }

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query)
    handleChange()

    matchMedia.addEventListener("change", handleChange)

    return () => {
      matchMedia.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}

const features = [
  {
    title: "Quick Loan Applications",
    description: "Apply for loans in minutes with our streamlined application process.",
    icon: CreditCard,
  },
  {
    title: "Secure Transactions",
    description: "Your financial data is protected with bank-level security and encryption.",
    icon: Shield,
  },
  {
    title: "Financial Analytics",
    description: "Track your financial health with detailed analytics and insights.",
    icon: BarChart3,
  },
  {
    title: "Stokvela Groups",
    description: "Create or join community savings groups to achieve your financial goals together.",
    icon: Users,
  },
  {
    title: "AI Financial Advisor",
    description: "Get personalized financial advice from our AI-powered assistant.",
    icon: MessageSquare,
  },
  {
    title: "Savings Goals",
    description: "Set and track savings goals with automated contributions.",
    icon: PiggyBank,
  },
  {
    title: "Identity Verification",
    description: "Secure identity verification process to protect your account.",
    icon: Lock,
  },
  {
    title: "Competitive Rates",
    description: "Enjoy competitive interest rates on loans and savings products.",
    icon: DollarSign,
  }
]

const duration = 0.15
const transition = { duration, ease: [0.32, 0.72, 0, 1] }
const transitionOverlay = { duration: 0.5, ease: [0.32, 0.72, 0, 1] }

const Carousel = memo(
  ({
    handleClick,
    controls,
    cards,
    isCarouselActive,
  }: {
    handleClick: (card: typeof features[0], index: number) => void
    controls: any
    cards: typeof features
    isCarouselActive: boolean
  }) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
    const cylinderWidth = isScreenSizeSm ? 900 : 1400
    const faceCount = cards.length
    const faceWidth = cylinderWidth / faceCount
    const radius = cylinderWidth / (2 * Math.PI)
    const rotation = useMotionValue(0)
    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value}deg)`
    )

    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          drag={isCarouselActive ? "x" : false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDrag={(_, info) =>
            isCarouselActive &&
            rotation.set(rotation.get() + info.offset.x * 0.05)
          }
          onDragEnd={(_, info) =>
            isCarouselActive &&
            controls.start({
              rotateY: rotation.get() + info.velocity.x * 0.05,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 30,
                mass: 0.1,
              },
            })
          }
          animate={controls}
        >
          {cards.map((card, i) => (
            <motion.div
              key={`key-${card.title}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center rounded-xl p-2"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${
                  i * (360 / faceCount)
                }deg) translateZ(${radius}px)`,
              }}
              onClick={() => handleClick(card, i)}
            >
              <div className="w-full h-[160px] rounded-xl overflow-hidden border border-emerald-500 bg-black/80 backdrop-blur-md hover:bg-emerald-950/90 transition-all duration-300 group p-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-green-600/40 rounded-xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.3),rgba(255,255,255,0))]" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500/50 to-green-600/50 flex items-center justify-center mb-2 group-hover:from-emerald-500/60 group-hover:to-green-600/60 transition-colors backdrop-blur-sm">
                    <card.icon className="h-4 w-4 text-emerald-300" />
                  </div>
                  <h3 className="text-xs font-semibold mb-1 text-emerald-300 group-hover:text-emerald-200 transition-colors">{card.title}</h3>
                  <p className="text-[9px] text-emerald-200/90 line-clamp-2 group-hover:text-emerald-100 transition-colors leading-tight">{card.description}</p>
                </div>
                <div className="absolute inset-0 border border-emerald-500/40 rounded-xl group-hover:border-emerald-500/50 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }
)

function ThreeDPhotoCarousel() {
  const [activeCard, setActiveCard] = useState<typeof features[0] | null>(null)
  const [isCarouselActive, setIsCarouselActive] = useState(true)
  const controls = useAnimation()
  const cards = useMemo(() => features, [])

  const handleClick = (card: typeof features[0]) => {
    setActiveCard(card)
    setIsCarouselActive(false)
    controls.stop()
  }

  const handleClose = () => {
    setActiveCard(null)
    setIsCarouselActive(true)
  }

  return (
    <motion.div layout className="relative">
      <AnimatePresence mode="sync">
        {activeCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layoutId={`card-container-${activeCard.title}`}
            layout="position"
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-8 backdrop-blur-md"
            style={{ willChange: "opacity" }}
            transition={transitionOverlay}
          >
            <motion.div
              layoutId={`card-${activeCard.title}`}
              className="max-w-2xl w-full bg-black/80 rounded-xl overflow-hidden border border-emerald-500 shadow-2xl p-8 relative backdrop-blur-md"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{
                willChange: "transform",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-green-600/40 rounded-xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.3),rgba(255,255,255,0))]" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-500/50 to-green-600/50 flex items-center justify-center mb-6 backdrop-blur-sm">
                  <activeCard.icon className="h-6 w-6 text-emerald-300" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-emerald-300">{activeCard.title}</h3>
                <p className="text-lg text-emerald-200/90">{activeCard.description}</p>
              </div>
              <div className="absolute inset-0 border border-emerald-500/40 rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent rounded-xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative h-[250px] w-full overflow-hidden">
        <Carousel
          handleClick={handleClick}
          controls={controls}
          cards={cards}
          isCarouselActive={isCarouselActive}
        />
      </div>
    </motion.div>
  )
}

export { ThreeDPhotoCarousel }; 