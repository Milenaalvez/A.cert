import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface SplashScreenProps {
  userName: string
  onComplete: () => void
}

export function SplashScreen({ userName, onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [greeting, setGreeting] = useState("")
  const [secondAngle, setSecondAngle] = useState(0)
  const [minuteAngle, setMinuteAngle] = useState(0)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    const now = new Date()
    const seconds = now.getSeconds()
    const minutes = now.getMinutes()
    setSecondAngle(seconds * 6)
    setMinuteAngle(minutes * 6 + seconds * 0.1)

    const interval = setInterval(() => {
      const d = new Date()
      const s = d.getSeconds()
      const m = d.getMinutes()
      setSecondAngle(s * 6)
      setMinuteAngle(m * 6 + s * 0.1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => {
      const h = new Date().getHours()
      if (h < 12) setGreeting("Bom dia")
      else if (h < 18) setGreeting("Boa tarde")
      else setGreeting("Boa noite")
      setShowWelcome(true)
    }, 400)
    const t2 = setTimeout(() => onComplete(), 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  const greetingFn = () => greeting || "Olá"

  const firstName = userName.split(" ")[0]

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#0B1120] transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="flex flex-col items-center gap-8">
        {/* Relógio animado */}
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            {/* Outer ring */}
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(98,142,203,0.15)" strokeWidth="5" />
            <circle cx="60" cy="60" r="54" fill="none"             stroke="var(--accent-primary)" strokeWidth="5"
              strokeDasharray={`${secondAngle * Math.PI / 180 * 54} ${2 * Math.PI * 54}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray 0.9s linear" }}
            />
            {/* Minute markers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * Math.PI / 180
              const x1 = 60 + 44 * Math.cos(angle)
              const y1 = 60 + 44 * Math.sin(angle)
              const x2 = 60 + 50 * Math.cos(angle)
              const y2 = 60 + 50 * Math.sin(angle)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
            })}
            {/* Hour hand */}
            <line x1="60" y1="60" x2="60" y2="32" stroke="rgba(255,255,255,0.8)" strokeWidth="3.5" strokeLinecap="round"
              transform={`rotate(${minuteAngle / 12 - 90 + 180} 60 60)`}
              style={{ transition: "transform 2s linear" }}
            />
            {/* Minute hand */}
            <line x1="60" y1="60" x2="60" y2="24" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round"
              transform={`rotate(${minuteAngle - 90} 60 60)`}
              style={{ transition: "transform 0.8s linear" }}
            />
            {/* Second hand */}
            <line x1="60" y1="68" x2="60" y2="18" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round"
              transform={`rotate(${secondAngle - 90} 60 60)`}
              style={{ transition: "transform 0.3s cubic-bezier(0.4, 2.5, 0.6, 0.5)" }}
            />
            {/* Center dot */}
            <circle cx="60" cy="60" r="4" fill="var(--accent-primary)" />
            <circle cx="60" cy="60" r="2" fill="#0B1120" />

            <defs>
              <linearGradient id="clockGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--accent-primary)" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Logo + Nome */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">Chronos</span>
          </div>

          {/* Mensagem de boas-vindas */}
          <div className={`text-center transition-all duration-500 ${showWelcome ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-sm text-gray-400 font-medium">{greetingFn()},</p>
            <p className="text-lg font-bold text-white mt-0.5">{firstName}!</p>
            <p className="text-xs text-gray-500 mt-4">Preparando seu painel...</p>
          </div>
        </div>

        {/* Loading bar */}
        <div className="w-40 h-1 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full animate-loading-bar"
            style={{ background: "var(--accent-primary)", animation: "loadingBar 2.2s ease-in-out forwards" }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
