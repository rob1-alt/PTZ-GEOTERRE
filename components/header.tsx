import Image from "next/image"

export function Header() {
  return (
    <header className="w-full bg-white shadow-sm py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-16">
            <Image src="/geoterre-logo.svg" alt="Geoterre Logo" fill className="object-contain" priority />
          </div>
          <div>
            <p className="text-xs text-gray-500">Simulateur d'éligibilité au Prêt à Taux Zéro</p>
          </div>
        </div>

      </div>
    </header>
  )
}
