"use client"

import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export function BankPartners({ onBack }: { onBack: () => void }) {
  return (
    <>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative h-12 w-20">
            <Image src="/geoterre-logo.svg" alt="Geoterre Logo" fill className="object-contain" />
          </div>
        </div>
        <CardTitle className="text-2xl">Nos partenaires bancaires</CardTitle>
        <CardDescription className="text-lg mt-2">
          Ces établissements peuvent vous accompagner dans votre demande de PTZ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <BankLogo name="Crédit Mutuel" color="#008B3D" initials="CM" />
          <BankLogo name="Crédit du Nord" color="#00692E" initials="CDN" />
          <BankLogo name="Société Générale" color="#005827" initials="SG" />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Contactez l'un de nos partenaires pour finaliser votre demande de PTZ. Nos conseillers sont à votre
            disposition pour vous accompagner dans vos démarches.
          </p>
          <Button onClick={onBack} variant="outline" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Retour aux résultats
          </Button>
        </div>
      </CardContent>
    </>
  )
}

function BankLogo({ name, color, initials }: { name: string; color: string; initials: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-24 h-24 rounded-lg flex items-center justify-center mb-3 shadow-md"
        style={{ backgroundColor: color }}
      >
        <span className="text-white text-2xl font-bold">{initials}</span>
      </div>
      <span className="text-sm font-medium text-center">{name}</span>
    </div>
  )
}
