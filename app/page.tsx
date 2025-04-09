import PtzCalculator from "@/components/ptz-calculator"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl">
          <PtzCalculator />
        </div>
      </main>
    </div>
  )
}
