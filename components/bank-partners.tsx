"use client"

import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Phone, Mail } from "lucide-react"
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
          Nous sommes en partenariat avec des entités bancaires.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <BankLogo name="Crédit Mutuel" color="#008B3D" initials="CM" />
            <BankLogo name="Crédit du Nord" color="#00692E" initials="CDN" />
            <BankLogo name="Société Générale" color="#005827" initials="SG" />
          </div> */}

          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="text-xl font-semibold text-green-800 mb-4">Nous facilitons votre demande de PTZ</h3>
            <p className="text-green-700 mb-6">
              Grâce à nos relations privilégiées avec nos partenaires bancaires, nous étudierons votre dossier 
              et vous mettrons en relation avec l'établissement le plus adapté.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800 mb-1">Téléphone</h4>
                  <p className="text-green-700">01 64 71 18 75</p>
                  <p className="text-sm text-green-600 mt-1">Du lundi au vendredi, 9h-18h</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800 mb-1">Email</h4>
                  <p className="text-green-700">info@simulateur-ptz-2025.fr</p>
                  <p className="text-sm text-green-600 mt-1">Réponse sous 24h ouvrées</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Nos conseillers sont à votre disposition pour vous accompagner dans vos démarches.
            </p>
            <Button onClick={onBack} variant="outline" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Retour aux résultats
            </Button>
          </div>
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
