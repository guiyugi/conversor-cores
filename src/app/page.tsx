"use client"
import ColorConverter from "../components/ColorConverter"

export default function Home() {
  return (
    <main className="min-h-screen w-full p-4 sm:p-6 lg:p-10 font-sans" style={{ background: "var(--background)" }}>
      <ColorConverter />
      <footer className="mt-12 sm:mt-16 text-center space-y-3 sm:space-y-4">
        <div className="flex flex-col items-center gap-1 text-xs sm:text-sm text-foreground/70 bg-card/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 mx-auto max-w-xs glass-effect border border-primary/10">
          <span className="font-semibold text-white tracking-wide">Projeto Conversor de Cores</span>
          <span className="text-foreground/50">guiyugidev</span>
        </div>
      </footer>
    </main>
  )
}
