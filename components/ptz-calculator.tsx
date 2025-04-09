"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Home,
  Users,
  Euro,
  MapPin,
  Building,
  Percent,
  Calculator,
  User,
} from "lucide-react"
import { BankPartners } from "./bank-partners"
import Image from "next/image"
import { storeSubmission } from "@/actions/store-submission"

// Mettre à jour les constantes ELIGIBILITY_THRESHOLDS et INCOME_TRANCHES pour qu'elles correspondent exactement aux tableaux du document

// Définition des zones et des seuils d'éligibilité
const ELIGIBILITY_THRESHOLDS = {
  A: {
    1: 49000,
    2: 73500,
    3: 88200,
    4: 102900,
    5: 117600,
    6: 132300,
    7: 147000,
    8: 161700,
  },
  B1: {
    1: 34500,
    2: 51750,
    3: 62100,
    4: 72450,
    5: 82800,
    6: 93150,
    7: 103500,
    8: 113850,
  },
  B2: {
    1: 31500,
    2: 47250,
    3: 56700,
    4: 66150,
    5: 75600,
    6: 85050,
    7: 94500,
    8: 103950,
  },
  C: {
    1: 28500,
    2: 42750,
    3: 51300,
    4: 59850,
    5: 68400,
    6: 76950,
    7: 85500,
    8: 94050,
  },
}

// Définition des tranches de revenus
const INCOME_TRANCHES = {
  A: {
    1: 25000,
    2: 31000,
    3: 37000,
    4: 49000,
  },
  B1: {
    1: 21500,
    2: 26000,
    3: 30000,
    4: 34500,
  },
  B2: {
    1: 18000,
    2: 22500,
    3: 27000,
    4: 31500,
  },
  C: {
    1: 15000,
    2: 19500,
    3: 24000,
    4: 28500,
  },
}

// Quotités pour le logement individuel
const INDIVIDUAL_QUOTITIES = {
  1: 30,
  2: 20,
  3: 20,
  4: 10,
}

// Quotités pour le logement collectif
const COLLECTIVE_QUOTITIES = {
  1: 50,
  2: 40,
  3: 40,
  4: 20,
}

export default function PtzCalculator() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    householdSize: "",
    zone: "",
    income: "",
    housingType: "",
    projectCost: "",
  })
  const [result, setResult] = useState<{
    eligible: boolean
    tranche?: number
    quotity?: number
    ptzAmount?: number
    reason?: string
  } | null>(null)
  const [showPartners, setShowPartners] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const totalSteps = 6
  const progress = (step / totalSteps) * 100

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      calculateEligibility()
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.householdSize !== ""
      case 2:
        return formData.zone !== ""
      case 3:
        return formData.income !== "" && !isNaN(Number(formData.income))
      case 4:
        return formData.housingType !== ""
      case 5:
        return formData.projectCost !== "" && !isNaN(Number(formData.projectCost))
      case 6:
        return (
          formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          formData.email.trim() !== "" &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        )
      default:
        return false
    }
  }

  const calculateEligibility = async () => {
    setIsSubmitting(true)
    setSubmissionError(null)

    const householdSize = Number.parseInt(formData.householdSize)
    const income = Number.parseInt(formData.income)
    const zone = formData.zone
    const housingType = formData.housingType
    const projectCost = Number.parseInt(formData.projectCost)

    // Vérifier si le revenu est inférieur au seuil d'éligibilité
    const maxIncome =
      ELIGIBILITY_THRESHOLDS[zone as keyof typeof ELIGIBILITY_THRESHOLDS][
        Math.min(householdSize, 8) as keyof (typeof ELIGIBILITY_THRESHOLDS)["A"]
      ]

    let calculationResult

    if (income > maxIncome) {
      calculationResult = {
        eligible: false,
        reason: `Vos revenus (${income.toLocaleString()} €) dépassent le plafond d'éligibilité au PTZ (${maxIncome.toLocaleString()} €) pour votre zone et la taille de votre foyer.`,
      }
    } else {
      // Déterminer la tranche
      let tranche = 0
      const tranchesForZone = INCOME_TRANCHES[zone as keyof typeof INCOME_TRANCHES]

      if (income <= tranchesForZone[1]) {
        tranche = 1
      } else if (income <= tranchesForZone[2]) {
        tranche = 2
      } else if (income <= tranchesForZone[3]) {
        tranche = 3
      } else if (income <= maxIncome) {
        tranche = 4
      } else {
        calculationResult = {
          eligible: false,
          reason: "Vos revenus ne correspondent à aucune tranche d'éligibilité au PTZ.",
        }
      }

      if (!calculationResult) {
        // Déterminer la quotité
        const quotity =
          housingType === "individual"
            ? INDIVIDUAL_QUOTITIES[tranche as keyof typeof INDIVIDUAL_QUOTITIES]
            : COLLECTIVE_QUOTITIES[tranche as keyof typeof COLLECTIVE_QUOTITIES]

        // Calculer le montant du PTZ
        const ptzAmount = (projectCost * quotity) / 100

        calculationResult = {
          eligible: true,
          tranche,
          quotity,
          ptzAmount,
        }
      }
    }

    // Stocker les données dans Google Sheets
    try {
      const storeResult = await storeSubmission({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        householdSize: formData.householdSize,
        zone: formData.zone,
        income: formData.income,
        housingType: formData.housingType,
        projectCost: formData.projectCost,
        ...calculationResult,
      })

      if (!storeResult.success) {
        setSubmissionError(
          "Les résultats ont été calculés mais n'ont pas pu être enregistrés. Veuillez réessayer ultérieurement.",
        )
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des données:", error)
      setSubmissionError(
        "Les résultats ont été calculés mais n'ont pas pu être enregistrés. Veuillez réessayer ultérieurement.",
      )
    } finally {
      setResult(calculationResult)
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      householdSize: "",
      zone: "",
      income: "",
      housingType: "",
      projectCost: "",
    })
    setResult(null)
    setShowPartners(false)
    setSubmissionError(null)
    setStep(1)
  }

  const viewPartners = () => {
    setShowPartners(true)
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-2">
                <div className="relative h-10 w-16">
                  <Image src="/geoterre-logo.svg" alt="Geoterre Logo" fill className="object-contain" />
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Composition du foyer</CardTitle>
              <CardDescription className="text-center">
                Indiquez le nombre de personnes dans votre foyer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="householdSize">Nombre de personnes</Label>
                <Select
                  value={formData.householdSize}
                  onValueChange={(value) => handleInputChange("householdSize", value)}
                >
                  <SelectTrigger id="householdSize" className="h-12">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "personne" : "personnes"}
                      </SelectItem>
                    ))}
                    <SelectItem value="9">8 personnes ou plus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        )
      case 2:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <MapPin className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Zone géographique</CardTitle>
              <CardDescription className="text-center">
                Sélectionnez la zone où se situe votre projet immobilier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="zone">Zone</Label>
                <Select value={formData.zone} onValueChange={(value) => handleInputChange("zone", value)}>
                  <SelectTrigger id="zone" className="h-12">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Zone A</SelectItem>
                    <SelectItem value="B1">Zone B1</SelectItem>
                    <SelectItem value="B2">Zone B2</SelectItem>
                    <SelectItem value="C">Zone C</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  <p className="font-medium mb-1">Information sur les zones</p>
                  <p>Zone A : Paris et grandes agglomérations</p>
                  <p>Zone B1 : Grandes villes et périphéries</p>
                  <p>Zone B2 : Villes moyennes</p>
                  <p>Zone C : Reste du territoire</p>
                </div>
              </div>
            </CardContent>
          </>
        )
      case 3:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Euro className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Revenus du foyer</CardTitle>
              <CardDescription className="text-center">
                Indiquez le revenu fiscal de référence de votre foyer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="income">Revenu fiscal de référence (€)</Label>
                <div className="relative">
                  <Input
                    id="income"
                    type="number"
                    placeholder="Ex: 35000"
                    value={formData.income}
                    onChange={(e) => handleInputChange("income", e.target.value)}
                    className="h-12 pl-10"
                  />
                  <Euro className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Vous trouverez cette information sur votre dernier avis d'imposition.
                </div>
              </div>
            </CardContent>
          </>
        )
      case 4:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Building className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Type de logement</CardTitle>
              <CardDescription className="text-center">
                Précisez s'il s'agit d'un logement individuel ou collectif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    formData.housingType === "individual"
                      ? "border-[#008B3D] bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                  onClick={() => handleInputChange("housingType", "individual")}
                >
                  <div className="flex flex-col items-center text-center">
                    <Home
                      className={`h-12 w-12 mb-3 ${formData.housingType === "individual" ? "text-[#008B3D]" : "text-gray-400"}`}
                    />
                    <h3 className="font-medium text-lg">Logement individuel</h3>
                    <p className="text-sm text-gray-500 mt-2">Maison individuelle ou logement indépendant</p>
                  </div>
                </div>
                <div
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    formData.housingType === "collective"
                      ? "border-[#008B3D] bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                  onClick={() => handleInputChange("housingType", "collective")}
                >
                  <div className="flex flex-col items-center text-center">
                    <Building
                      className={`h-12 w-12 mb-3 ${formData.housingType === "collective" ? "text-[#008B3D]" : "text-gray-400"}`}
                    />
                    <h3 className="font-medium text-lg">Logement collectif</h3>
                    <p className="text-sm text-gray-500 mt-2">Appartement dans un immeuble collectif</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )
      case 5:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Calculator className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Coût du projet</CardTitle>
              <CardDescription className="text-center">
                Indiquez le coût total de votre projet immobilier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="projectCost">Coût total du projet (€)</Label>
                <div className="relative">
                  <Input
                    id="projectCost"
                    type="number"
                    placeholder="Ex: 200000"
                    value={formData.projectCost}
                    onChange={(e) => handleInputChange("projectCost", e.target.value)}
                    className="h-12 pl-10"
                  />
                  <Euro className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Incluez le prix d'achat et les éventuels travaux prévus.
                </div>
              </div>
            </CardContent>
          </>
        )
      case 6:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Vos coordonnées</CardTitle>
              <CardDescription className="text-center">
                Veuillez renseigner vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      placeholder="Votre prénom"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      placeholder="Votre nom"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  <p className="font-medium mb-1">Pourquoi demandons-nous ces informations ?</p>
                  <p>
                    Ces informations nous permettent de vous contacter pour vous accompagner dans votre projet et vous
                    proposer des solutions adaptées à votre situation.
                  </p>
                </div>
              </div>
            </CardContent>
          </>
        )
      default:
        return null
    }
  }

  const renderResult = () => {
    if (!result) return null

    if (showPartners) {
      return <BankPartners onBack={() => setShowPartners(false)} />
    }

    return (
      <>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative h-10 w-16">
              <Image src="/geoterre-logo.svg" alt="Geoterre Logo" fill className="object-contain" />
            </div>
          </div>
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
            {result.eligible ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">{result.eligible ? "Félicitations !" : "Nous sommes désolés"}</CardTitle>
          <CardDescription className="text-lg mt-2">
            {result.eligible ? "Vous êtes éligible au PTZ" : "Vous n'êtes pas éligible au PTZ"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissionError && (
            <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800 text-sm">
              {submissionError}
            </div>
          )}

          {result.eligible ? (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-xl mb-4 text-green-800">Détails de votre PTZ</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-[#008B3D]" />
                      </div>
                      <span className="text-sm text-gray-500">Tranche</span>
                    </div>
                    <p className="text-2xl font-bold">{result.tranche}</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Percent className="h-4 w-4 text-[#008B3D]" />
                      </div>
                      <span className="text-sm text-gray-500">Quotité</span>
                    </div>
                    <p className="text-2xl font-bold">{result.quotity}%</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Euro className="h-4 w-4 text-[#008B3D]" />
                      </div>
                      <span className="text-sm text-gray-500">Montant PTZ</span>
                    </div>
                    <p className="text-2xl font-bold">{result.ptzAmount?.toLocaleString()} €</p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Vous pouvez maintenant contacter l'un de nos partenaires bancaires pour finaliser votre demande de
                    PTZ.
                  </p>
                  <Button onClick={viewPartners} className="bg-[#008B3D] hover:bg-green-600">
                    Voir nos partenaires bancaires
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h4 className="font-medium mb-2 text-green-800">Informations importantes</h4>
                <p className="text-sm text-green-700">
                  Le PTZ est un prêt sans intérêt, accordé sous conditions de ressources pour compléter un prêt
                  principal et aider à l'acquisition de votre résidence principale. Cette simulation est donnée à titre
                  indicatif.
                </p>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-2">Critères d'éligibilité au PTZ</h4>
                <div className="text-sm space-y-2">
                  <p>Le PTZ est soumis à des conditions strictes de ressources et de localisation :</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>Les plafonds de ressources varient selon la zone géographique et la taille du foyer</li>
                    <li>La quotité du prêt (pourcentage finançable) dépend de votre tranche de revenus</li>
                    <li>Pour le logement individuel, les quotités sont de 30%, 20%, 20% et 10% selon la tranche</li>
                    <li>Pour le logement collectif, les quotités sont de 50%, 40%, 40% et 20% selon la tranche</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-3">Plafonds de ressources par zone et taille du foyer</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-3 border-b text-left">Personnes</th>
                        <th className="py-2 px-3 border-b text-right">Zone A</th>
                        <th className="py-2 px-3 border-b text-right">Zone B1</th>
                        <th className="py-2 px-3 border-b text-right">Zone B2</th>
                        <th className="py-2 px-3 border-b text-right">Zone C</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 px-3 border-b">1</td>
                        <td className="py-2 px-3 border-b text-right">49 000 €</td>
                        <td className="py-2 px-3 border-b text-right">34 500 €</td>
                        <td className="py-2 px-3 border-b text-right">31 500 €</td>
                        <td className="py-2 px-3 border-b text-right">28 500 €</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-3 border-b">2</td>
                        <td className="py-2 px-3 border-b text-right">73 500 €</td>
                        <td className="py-2 px-3 border-b text-right">51 750 €</td>
                        <td className="py-2 px-3 border-b text-right">47 250 €</td>
                        <td className="py-2 px-3 border-b text-right">42 750 €</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border-b">3</td>
                        <td className="py-2 px-3 border-b text-right">88 200 €</td>
                        <td className="py-2 px-3 border-b text-right">62 100 €</td>
                        <td className="py-2 px-3 border-b text-right">56 700 €</td>
                        <td className="py-2 px-3 border-b text-right">51 300 €</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-3 border-b">4</td>
                        <td className="py-2 px-3 border-b text-right">102 900 €</td>
                        <td className="py-2 px-3 border-b text-right">72 450 €</td>
                        <td className="py-2 px-3 border-b text-right">66 150 €</td>
                        <td className="py-2 px-3 border-b text-right">59 850 €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tableau simplifié. Pour les foyers de 5 personnes et plus, consultez un conseiller.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-semibold text-xl mb-4 text-red-800">Raison de non-éligibilité</h3>
                <p className="text-red-700 mb-4">{result.reason}</p>

                <div className="mt-6 p-4 bg-white rounded-lg">
                  <h4 className="font-medium mb-2">Exemple de situation éligible</h4>
                  <p className="text-sm mb-3">
                    Pour votre zone ({formData.zone}) et la taille de votre foyer ({formData.householdSize}{" "}
                    {Number(formData.householdSize) > 1 ? "personnes" : "personne"}), voici les plafonds à respecter :
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">Plafond d'éligibilité :</p>
                      <p className="text-lg font-bold mt-1">
                        {ELIGIBILITY_THRESHOLDS[formData.zone as keyof typeof ELIGIBILITY_THRESHOLDS][
                          Math.min(Number(formData.householdSize), 8) as keyof (typeof ELIGIBILITY_THRESHOLDS)["A"]
                        ].toLocaleString()}{" "}
                        €
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">Votre revenu déclaré :</p>
                      <p className="text-lg font-bold mt-1 text-red-600">
                        {Number(formData.income).toLocaleString()} €
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-medium mb-2">Que faire maintenant ?</h4>
                <ul className="list-disc list-inside text-sm space-y-2">
                  <li>Vérifiez si vous êtes éligible à d'autres aides au logement</li>
                  <li>Consultez un conseiller bancaire pour explorer d'autres options de financement</li>
                  <li>Renseignez-vous sur les dispositifs d'aide à l'accession à la propriété de votre région</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </>
    )
  }

  return (
    <Card className="w-full shadow-xl overflow-hidden border-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={result ? "result" : `step-${step}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {result ? (
            renderResult()
          ) : (
            <>
              <div className="p-4 border-b bg-gray-50">
                <Progress value={progress} className="h-2 bg-gray-200 [&>div]:bg-[#008B3D]" />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Étape {step} sur {totalSteps}
                </p>
              </div>
              {renderStepContent()}
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <CardFooter className="flex justify-between p-6 bg-gray-50">
        {result ? (
          <Button onClick={resetForm} className="w-full bg-[#008B3D] hover:bg-green-600">
            Nouvelle simulation
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={prevStep} disabled={step === 1} className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button
              onClick={nextStep}
              disabled={!isStepValid() || isSubmitting}
              className="flex items-center gap-1 bg-[#008B3D] hover:bg-green-600"
            >
              {step === totalSteps ? (isSubmitting ? "Calcul en cours..." : "Calculer") : "Suivant"}{" "}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
