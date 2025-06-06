"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
  Info,
  CalendarCheck,
  FileText,
  Clock,
  Star,
  UserCircle,
} from "lucide-react"
import { BankPartners } from "./bank-partners"
import Image from "next/image"
import { CommuneSearch } from "@/components/commune-search"
import { type Commune, loadCommunes } from "@/lib/communes"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Fuse from "fuse.js"
import { debounce } from "lodash"

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

// Plafonds de coût total de l'opération selon zone et nombre de personnes
const COST_CEILINGS = {
  A: {
    1: 150000,
    2: 225000,
    3: 270000,
    4: 315000,
    5: 360000
  },
  B1: {
    1: 135000,
    2: 202500,
    3: 243000,
    4: 283500,
    5: 324000
  },
  B2: {
    1: 110000,
    2: 165000,
    3: 198000,
    4: 231000,
    5: 264000
  },
  C: {
    1: 100000,
    2: 150000,
    3: 180000,
    4: 210000,
    5: 240000
  }
}

// Types
type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  householdSize: string;
  zone: string;
  address: string;
  income: string;
  housingType: string;
  projectCost: string;
  monthlyIncome?: string;
  notOwnerForTwoYears: boolean;
  selectedCommune?: Commune;
};

type ResultType = {
  eligible: boolean;
  tranche?: number;
  quotity?: number;
  ptzAmount?: number;
  reason?: string;
  costCeiling?: number;
  cappedProjectCost?: number;
};

// Constants 
const PRIMARY_COLOR = "#008B3D";
const HOVER_COLOR = "bg-green-600";

// Composant pour la slide d'information PTZ 2025
const PtzInfoSlide = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="relative overflow-hidden pb-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-50 rounded-full -ml-12 -mb-12 opacity-50"></div>
      
      <div className="flex justify-center mb-6 pt-6">
        <div className="relative h-12 w-20">
          <Image src="/geoterre-logo.svg" alt="Geoterre Logo" fill className="object-contain" />
        </div>
      </div>
      
      <div className="text-center px-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Nouvelles modalités PTZ 2025</h1>
        <p className="text-gray-600">Découvrez les changements importants pour le Prêt à Taux Zéro</p>
      </div>

      <div className="space-y-6 px-6">
        <div className="p-5 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-start mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <CalendarCheck className="h-4 w-4 text-[#008B3D]" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800 text-lg">Entrée en vigueur le 1er Avril 2025</h4>
              <p className="text-sm text-green-700 mt-1">
                Un nouveau décret vient d'être publié avec de nouvelles conditions pour bénéficier du Prêt à
                Taux Zéro (PTZ) depuis le 1er avril 2025 jusqu'au 31 décembre 2027.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-5 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-start mb-1">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <Clock className="h-4 w-4 text-amber-800" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800">Dérogation 2025-2027</h4>
              <p className="text-sm text-amber-700 mt-1">
                Avec ces nouvelles conditions, il est désormais possible de bénéficier du PTZ pour acheter
                un logement neuf :
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 mt-2 pl-2">
                <li>Peu importe la zone géographique</li>
                <li>Qu'il s'agisse d'une maison ou d'un appartement</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <Star className="h-4 w-4 text-blue-800" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Conditions pour bénéficier du PTZ</h4>
              <p className="text-sm text-blue-700 mt-1 mb-2">
                Pour être éligible au PTZ :
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1 pl-2">
                <li>Résidence principale : Le logement acheté doit devenir votre résidence principale.</li>
                <li>Primo-accédant : vous ne devez pas avoir été propriétaire de votre résidence principale au cours des deux dernières années</li>
                <li>Conditions de ressources : vos revenus ne doivent pas dépasser certains plafonds, qui varient en fonction de la composition de votre foyer et de la commune concernée par votre projet</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center px-6">
        <p className="text-sm text-gray-500 italic mb-4">
          Simulez dès maintenant votre éligibilité au PTZ avec ces nouvelles conditions.
        </p>
        <Button 
          onClick={onStart}
          className="bg-[#008B3D] hover:bg-green-600 py-6 w-full max-w-sm mx-auto flex items-center justify-center gap-2"
        >
          Commencer la simulation
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

/**
 * PtzCalculator - Simulateur d'éligibilité au PTZ avec calcul du montant
 * 
 * Optimisations réalisées:
 * - Code organisé en composants plus petits et réutilisables
 * - Utilisation de useCallback et useMemo pour éviter les re-renders inutiles
 * - Gestion plus robuste des erreurs avec try/catch
 * - Typage strict pour améliorer la maintenabilité
 * - Extraction des constantes pour éviter la duplication
 * - Gestion optimisée des ressources externes (script Google Maps)
 * - Structure de code plus modulaire et organisée
 * 
 * Le composant gère:
 * - Une slide d'information sur les changements 2025
 * - Un formulaire en 7 étapes pour collecter les informations
 * - Le calcul d'éligibilité selon les critères officiels
 * - L'affichage des résultats et des actions post-simulation
 */
export default function PtzCalculator() {
  // State hooks
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    householdSize: "",
    zone: "",
    address: "",
    income: "",
    housingType: "",
    projectCost: "",
    notOwnerForTwoYears: false,
    selectedCommune: undefined,
  })
  const [result, setResult] = useState<ResultType | null>(null)
  const [showPartners, setShowPartners] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  
  // Refs
  const addressInputRef = useRef<HTMLInputElement | null>(null)
  
  // Constants
  const totalSteps = 8
  const progress = ((step - 1) / (totalSteps - 1)) * 100
  
  // Memoized handlers
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }
  
  const nextStep = useCallback(() => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      calculateEligibility()
    }
  }, [step, totalSteps])
  
  const prevStep = useCallback(() => {
    if (step > 0) {
      setStep(step - 1)
    }
  }, [step])
  
  const viewPartners = useCallback(() => {
    setShowPartners(true)
  }, [])
  
  const resetForm = useCallback(() => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      householdSize: "",
      zone: "",
      address: "",
      income: "",
      housingType: "",
      projectCost: "",
      notOwnerForTwoYears: false,
      selectedCommune: undefined,
    })
    setResult(null)
    setShowPartners(false)
    setSubmissionError(null)
    setStep(0)
    
    // Effacer les données sauvegardées
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ptz-calculator-step')
      localStorage.removeItem('ptz-calculator-form-data')
      localStorage.removeItem('ptz-calculator-result')
      localStorage.removeItem('ptz-calculator-show-partners')
    }
  }, [])
  
  /**
   * Vérifie si l'étape actuelle est valide pour permettre de passer à la suivante
   */
  const isStepValid = useCallback(() => {
    switch (step) {
      case 0:
        return true
      case 1:
        return formData.householdSize !== ""
      case 2:
        return formData.notOwnerForTwoYears !== undefined
      case 3:
        return formData.selectedCommune !== undefined && formData.selectedCommune.commune && formData.zone
      case 4:
        return formData.address !== ""
      case 5:
        return formData.income !== "" && !isNaN(Number(formData.income))
      case 6:
        return formData.housingType !== ""
      case 7:
        return formData.projectCost !== "" && !isNaN(Number(formData.projectCost)) && Number(formData.projectCost) > 0
      case 8:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return (
          formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          formData.email.trim() !== "" &&
          emailRegex.test(formData.email.trim())
        )
      default:
        return false
    }
  }, [step, formData])
  
  // Fonction pour gérer l'appui sur la touche Entrée
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' && !result) {
      // Éviter de déclencher l'événement si l'utilisateur est en train de saisir du texte
      const activeElement = document.activeElement;
      const isInputElement = activeElement instanceof HTMLInputElement && 
        (activeElement.type === 'text' || activeElement.type === 'email' || activeElement.type === 'number');
      
      // Ne pas déclencher si on est sur un champ de saisie et que l'utilisateur appuie sur Entrée
      if (!isInputElement && isStepValid()) {
        nextStep();
      }
    }
  }, [result, isStepValid, nextStep]);

  // Charger l'état sauvegardé lors du chargement de la page
  useEffect(() => {
    if (typeof window === 'undefined') return;
  
    try {
      // Charger l'étape
      const savedStep = localStorage.getItem('ptz-calculator-step')
      if (savedStep) {
        setStep(parseInt(savedStep))
      }

      // Charger les données du formulaire
      const savedFormData = localStorage.getItem('ptz-calculator-form-data')
      if (savedFormData) {
        setFormData(JSON.parse(savedFormData))
      }

      // Charger le résultat
      const savedResult = localStorage.getItem('ptz-calculator-result')
      if (savedResult) {
        setResult(JSON.parse(savedResult))
      }

      // Charger l'état d'affichage des partenaires
      const savedShowPartners = localStorage.getItem('ptz-calculator-show-partners')
      if (savedShowPartners) {
        setShowPartners(savedShowPartners === 'true')
      }
    } catch (e) {
      console.error("Erreur lors du chargement des données sauvegardées:", e)
    }
  }, [])

  // Sauvegarder l'état actuel lorsqu'il change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('ptz-calculator-step', step.toString())
      localStorage.setItem('ptz-calculator-form-data', JSON.stringify(formData))
      localStorage.setItem('ptz-calculator-result', result ? JSON.stringify(result) : '')
      localStorage.setItem('ptz-calculator-show-partners', showPartners.toString())
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des données:", e)
    }
  }, [step, formData, result, showPartners])

  // Ajouter l'écouteur d'événements clavier
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Fonction de validation des champs
  const validateForm = useCallback(() => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.firstName?.trim()) {
      errors.firstName = "Le prénom est requis";
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = "Le nom est requis";
    }
    if (!formData.email?.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "L'email n'est pas valide";
    }

    // Mettre à jour les erreurs
    setFormErrors(errors);
    
    // Retourner true si aucune erreur
    return Object.keys(errors).length === 0;
  }, [formData.firstName, formData.lastName, formData.email]);

  const calculateEligibility = useCallback(async () => {
    // Valider le formulaire avant de procéder
    if (!validateForm()) {
      return;
    }

    // Si le client a été propriétaire, il n'est pas éligible
    if (formData.notOwnerForTwoYears) {
      setResult({
        eligible: false,
        reason: "Vous avez été propriétaire de votre résidence principale au cours des deux dernières années, vous n'êtes donc pas éligible au PTZ."
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Nettoyer les données avant de les envoyer
      const cleanedFormData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? formData.phone.trim() : "", // Rendre le téléphone optionnel
        address: formData.address.trim(),
      }

      // Calculer l'éligibilité
      const income = Number(cleanedFormData.income)
      const householdSize = Number(cleanedFormData.householdSize)
      const projectCost = Number(cleanedFormData.projectCost)
      const zone = cleanedFormData.zone
      const housingType = cleanedFormData.housingType

      if (!zone || !householdSize || !income || !housingType || !projectCost) {
        throw new Error("Une erreur est survenue lors du calcul. Veuillez recommencer.")
      }

      // Vérifier si le revenu est inférieur au seuil d'éligibilité
      const maxIncome =
        ELIGIBILITY_THRESHOLDS[zone as keyof typeof ELIGIBILITY_THRESHOLDS][
          Math.min(householdSize, 8) as keyof (typeof ELIGIBILITY_THRESHOLDS)["A"]
        ]

      let calculationResult: ResultType;

      if (income > maxIncome) {
        calculationResult = {
          eligible: false,
          reason: `Vos revenus (${income.toLocaleString()} €) dépassent le plafond d'éligibilité au PTZ (${maxIncome.toLocaleString()} €) pour votre zone et la taille de votre foyer.`
        };
      } else {
        // Déterminer la tranche en fonction du revenu
        let tranche;
        const ratio = income / maxIncome;

        if (ratio <= 0.25) tranche = 1;
        else if (ratio <= 0.5) tranche = 2;
        else if (ratio <= 0.75) tranche = 3;
        else tranche = 4;

        // Déterminer la quotité en fonction de la tranche
        const quotityMap = {
          1: 30,
          2: 20,
          3: 20,
          4: 10
        };
        const quotity = quotityMap[tranche as keyof typeof quotityMap];

        // Calculer le plafond de coût en fonction de la zone et de la taille du foyer
        const costCeilingBase = {
          A: 150000,
          B1: 135000,
          B2: 110000,
          C: 100000
        };

        const costCeiling = costCeilingBase[zone as keyof typeof costCeilingBase] * (householdSize <= 4 ? 1 : Math.min(1.4, 1 + (householdSize - 4) * 0.1));

        // Calculer le montant du PTZ
        const cappedProjectCost = Math.min(projectCost, costCeiling);
        const ptzAmount = Math.round(cappedProjectCost * (quotity / 100));

        calculationResult = {
          eligible: true,
          tranche,
          quotity,
          costCeiling,
          cappedProjectCost,
          ptzAmount
        };
      }

      // Stocker le résultat dans le state
      setResult(calculationResult);

      // Enregistrer les données
      const submissionData = {
        ...cleanedFormData,
        ...calculationResult
      };

      // Remplacement de l'appel direct à storeSubmission par un appel API
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: [submissionData] })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'enregistrement des données");
      }
      // Mettre à jour le localStorage avec la vraie soumission (timestamp inclus)
      if (typeof window !== 'undefined' && result.savedSubmission) {
        const localKey = 'ptz_geoterre_temp_submissions';
        const current = JSON.parse(localStorage.getItem(localKey) || '[]');
        localStorage.setItem(localKey, JSON.stringify([result.savedSubmission, ...current]));
        // Notifier l'admin d'une nouvelle soumission
        window.dispatchEvent(new Event('ptzSubmissionAdded'));
      }

    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      setSubmissionError(error instanceof Error ? error.message : "Une erreur est survenue");
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  const handleCommuneSelect = useCallback((commune: Commune) => {
    console.log('Commune sélectionnée:', commune) // Pour le débogage
    setFormData(prev => ({
      ...prev,
      selectedCommune: commune,
      zone: commune.zonePTZ2024 || commune.zonePTZ2014,
      address: commune.commune
    }))
  }, [])

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <PtzInfoSlide onStart={nextStep} />
          </>
        )
      case 1:
        return (
          <>
            <CardHeader className="space-y-1">
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
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
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
                <Home className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Situation actuelle</CardTitle>
              <CardDescription className="text-center">
                Confirmez votre situation de propriété
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-amber-800">
                    Pour bénéficier du PTZ, vous ne devez pas avoir été propriétaire de votre résidence principale au cours des deux dernières années précédant votre demande.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div 
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      !formData.notOwnerForTwoYears 
                      ? "border-[#008B3D] bg-green-50" 
                      : "border-gray-200 hover:border-green-300"
                    }`}
                    onClick={() => handleInputChange("notOwnerForTwoYears", false)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          !formData.notOwnerForTwoYears 
                          ? "bg-[#008B3D] border-[#008B3D]" 
                          : "border-gray-300"
                        }`}>
                          {!formData.notOwnerForTwoYears && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-lg mb-2">
                          Je n'ai pas été propriétaire de ma résidence principale au cours des 2 dernières années
                        </h3>
                        <p className="text-gray-600 text-sm">
                        Je peux être éligible au Prêt à Taux Zéro (PTZ)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.notOwnerForTwoYears 
                      ? "border-[#008B3D] bg-green-50" 
                      : "border-gray-200 hover:border-green-300"
                    }`}
                    onClick={() => handleInputChange("notOwnerForTwoYears", true)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          formData.notOwnerForTwoYears 
                          ? "bg-[#008B3D] border-[#008B3D]" 
                          : "border-gray-300"
                        }`}>
                          {formData.notOwnerForTwoYears && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-lg mb-2">
                          J'ai été propriétaire de ma résidence principale au cours des 2 dernières années
                        </h3>
                        <p className="text-gray-600 text-sm">
                        Je ne suis pas éligible au Prêt à Taux Zéro (PTZ)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="h-48 w-48 relative overflow-hidden rounded-xl">
                    <Image 
                      src="/landlord.png" 
                      alt="Propriété résidence principale" 
                      width={400} 
                      height={400}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        );
      case 3:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <MapPin className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Zone géographique de la recherche du bien</CardTitle>
              <CardDescription className="text-center">
                Recherchez votre commune de recherche pour connaître sa zone PTZ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <CommuneSearch 
                  onSelect={handleCommuneSelect}
                  selectedCommune={formData.selectedCommune}
                />
                {formData.selectedCommune && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    <p className="font-medium mb-1">Information sur la zone</p>
                    <p>Commune : {formData.selectedCommune.commune}</p>
                    <p>Département : {formData.selectedCommune.departement}</p>
                    <p>Zone PTZ : {formData.zone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )
      case 4:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <MapPin className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Où habitez-vous ?</CardTitle>
              <CardDescription className="text-center">
                Indiquez votre ville de résidence actuelle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommuneSearch 
                onSelect={(commune) => {
                  handleInputChange("address", commune.commune);
                }}
                selectedCommune={formData.selectedCommune}
              />
            </CardContent>
          </>
        )
      case 5:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Euro className="h-6 w-6 text-[#008B3D]" />
              </div>
              <CardTitle className="text-center text-xl">Revenus du foyer</CardTitle>
              <CardDescription className="text-center">
                Indiquez le revenu mensuel net de votre foyer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="monthlyIncome">Revenu mensuel net (€)</Label>
                <div className="relative">
                  <Input
                    id="monthlyIncome"
                    type="number"
                    placeholder="Ex: 2500"
                    value={formData.monthlyIncome || ""}
                    onChange={(e) => {
                      const monthlyIncome = e.target.value;
                      // Calculer le revenu fiscal de référence (mensuel x 12) avec abattement de 10%
                      const annualIncome = monthlyIncome ? 
                        (Math.round(Number(monthlyIncome) * 12 * 0.9)).toString() : "";
                      handleInputChange("income", annualIncome);
                      handleInputChange("monthlyIncome", monthlyIncome);
                    }}
                    className="h-12 pl-10"
                  />
                  <Euro className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Le revenu fiscal de référence sera calculé automatiquement (mensuel x 12 avec abattement de 10%).
                  {formData.monthlyIncome && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800">Revenu fiscal de référence calculé :</p>
                      <p className="text-lg font-bold mt-1">
                        {Number(formData.income).toLocaleString()} €
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        (Revenu mensuel x 12 avec abattement de 10%)
                      </p>
                    </div>
                  )}
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
                    <div className="h-36 w-36 mb-3 overflow-hidden rounded-xl">
                      <Image 
                        src="/house.png" 
                        alt="Maison individuelle" 
                        width={400} 
                        height={400}
                        className="rounded-xl"
                      />
                    </div>
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
                    <div className="h-36 w-36 mb-3 overflow-hidden rounded-xl">
                      <Image 
                        src="/building.png" 
                        alt="Immeuble collectif" 
                        width={400} 
                        height={400}
                        className="rounded-xl"
                      />
                    </div>
                    <h3 className="font-medium text-lg">Logement collectif</h3>
                    <p className="text-sm text-gray-500 mt-2">Appartement dans un immeuble collectif</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )
      case 7:
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
                    type="text"
                    placeholder="Ex: 200 000"
                    value={formData.projectCost ? Number(formData.projectCost).toLocaleString('fr-FR').replace(',', ' ') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      const numericValue = Number(value);
                      if (!isNaN(numericValue) && numericValue <= 2000000) {
                        handleInputChange("projectCost", value);
                      }
                    }}
                    className="h-12 pl-10"
                    maxLength={9}
                  />
                  <Euro className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Incluez le prix d'achat et les éventuels travaux prévus (maximum 2 000 000 €).
                </div>
              </div>
            </CardContent>
          </>
        )
      case 8:
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
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      placeholder="Votre prénom"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={formErrors.firstName ? "border-red-500" : ""}
                      required
                    />
                    {formErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      placeholder="Votre nom"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={formErrors.lastName ? "border-red-500" : ""}
                      required
                    />
                    {formErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={formErrors.email ? "border-red-500" : ""}
                    required
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Votre numéro de téléphone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  <p className="font-medium mb-1">Pourquoi demandons-nous ces informations ?</p>
                  <p>
                    Ces informations nous permettent de vous contacter pour vous accompagner dans votre projet et vous
                    proposer des solutions adaptées à votre situation. Les champs marqués d'un * sont obligatoires.
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
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-5 w-5 text-gray-400 hover:text-[#008B3D] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#008B3D] text-white border-[#008B3D] p-3">
                            <p className="w-[250px] text-[15px]">Le revenu fiscal de référence détermine la tranche dans laquelle vous vous situez.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-2xl font-bold">{result.tranche}</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Percent className="h-4 w-4 text-[#008B3D]" />
                      </div>
                      <span className="text-sm text-gray-500">Quotité</span>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-5 w-5 text-gray-400 hover:text-[#008B3D] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#008B3D] text-white border-[#008B3D] p-3">
                            <p className="w-[250px] text-[15px]">La quotité du prêt (pourcentage finançable avec le PTZ) dépend de votre tranche de revenus</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-2xl font-bold">{result.quotity}%</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Euro className="h-4 w-4 text-[#008B3D]" />
                      </div>
                      <span className="text-sm text-gray-500">Montant PTZ</span>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-5 w-5 text-gray-400 hover:text-[#008B3D] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#008B3D] text-white border-[#008B3D] p-3">
                            <p className="w-[250px] text-[15px]">Le montant du prêt est donné à titre indicatif, <b>hors assurance et hors frais de dossier</b> et calculé en fonction d'un coût plafonné qui varie selon la zone géographique et la composition du foyer.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-2xl font-bold">{result.ptzAmount?.toLocaleString()} €</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Calculator className="h-4 w-4 text-[#008B3D]" />
                      </div>
                      <span className="text-sm text-gray-500">Coût du projet</span>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-5 w-5 text-gray-400 hover:text-[#008B3D] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#008B3D] text-white border-[#008B3D] p-3">
                            <p className="w-[250px] text-[15px]">Correspond au montant total de votre projet. Attention, ce n'est pas ce montant qui est pris en compte pour calculer le montant du PTZ auquel vous avez droit.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {result.costCeiling && Number(formData.projectCost) > result.costCeiling ? (
                      <>
                        <p className="text-xl font-bold">{Number(formData.projectCost).toLocaleString()} €</p>
                        <p className="text-sm text-amber-600 mt-1">Plafonné à {result.costCeiling.toLocaleString()} €</p>
                      </>
                    ) : (
                      <p className="text-xl font-bold">{Number(formData.projectCost).toLocaleString()} €</p>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Home className="h-4 w-4 text-[#008B3D]" />
                      </div>
                      <span className="text-sm text-gray-500">Plafond de coût</span>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-5 w-5 text-gray-400 hover:text-[#008B3D] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#008B3D] text-white border-[#008B3D] p-3">
                            <p className="w-[250px] text-[15px]">Le coût du projet retenu pour calculer le PTZ auquel vous avez droit, dépend des plafonds ci-dessous : </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xl font-bold">{result.costCeiling?.toLocaleString()} €</p>
                    <p className="text-xs text-gray-500 mt-1">pour {formData.householdSize} {Number(formData.householdSize) > 1 ? "personnes" : "personne"} en zone {formData.zone}</p>
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
                  principal et aider à l'acquisition de votre résidence principale. Le montant du prêt est calculé 
                  en fonction d'un coût plafonné qui varie selon la zone et la taille du foyer. Cette simulation est donnée à titre indicatif.
                </p>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-2">Critères d'éligibilité au PTZ</h4>
                <div className="text-sm space-y-2">
                  <p>Le PTZ est soumis à des conditions strictes de ressources et de localisation :</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>Les plafonds de ressources varient selon la zone géographique et la taille du foyer</li>
                    <li>Le coût total de l'opération est plafonné selon la zone et le nombre de personnes</li>
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
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Plafonds de coût total de l'opération par zone</h4>
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
                        <td className="py-2 px-3 border-b text-right">150 000 €</td>
                        <td className="py-2 px-3 border-b text-right">135 000 €</td>
                        <td className="py-2 px-3 border-b text-right">110 000 €</td>
                        <td className="py-2 px-3 border-b text-right">100 000 €</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-3 border-b">2</td>
                        <td className="py-2 px-3 border-b text-right">225 000 €</td>
                        <td className="py-2 px-3 border-b text-right">202 500 €</td>
                        <td className="py-2 px-3 border-b text-right">165 000 €</td>
                        <td className="py-2 px-3 border-b text-right">150 000 €</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border-b">3</td>
                        <td className="py-2 px-3 border-b text-right">270 000 €</td>
                        <td className="py-2 px-3 border-b text-right">243 000 €</td>
                        <td className="py-2 px-3 border-b text-right">198 000 €</td>
                        <td className="py-2 px-3 border-b text-right">180 000 €</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-3 border-b">4</td>
                        <td className="py-2 px-3 border-b text-right">315 000 €</td>
                        <td className="py-2 px-3 border-b text-right">283 500 €</td>
                        <td className="py-2 px-3 border-b text-right">231 000 €</td>
                        <td className="py-2 px-3 border-b text-right">210 000 €</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border-b">5 et plus</td>
                        <td className="py-2 px-3 border-b text-right">360 000 €</td>
                        <td className="py-2 px-3 border-b text-right">324 000 €</td>
                        <td className="py-2 px-3 border-b text-right">264 000 €</td>
                        <td className="py-2 px-3 border-b text-right">240 000 €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ce plafond est utilisé pour déterminer le coût maximum finançable par le PTZ.
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
    <Card className="w-full shadow-xl overflow-hidden border-0" suppressHydrationWarning>
      <AnimatePresence mode="wait">
        <motion.div
          key={result ? "result" : `step-${step}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          suppressHydrationWarning
        >
          {result ? (
            renderResult()
          ) : (
            <>
              {step > 0 && (
                <div className="p-4 border-b bg-gray-50" suppressHydrationWarning>
                  <Progress value={progress} className="h-2 bg-gray-200 [&>div]:bg-[#008B3D]" />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Étape {step} sur {totalSteps}
                  </p>
                </div>
              )}
              {renderStepContent()}
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <CardFooter className="flex justify-between p-6 bg-gray-50" suppressHydrationWarning>
        {result ? (
          <Button onClick={resetForm} className="w-full bg-[#008B3D] hover:bg-green-600">
            Nouvelle simulation
          </Button>
        ) : (
          <>
            {step > 0 && (
              <>
                <Button variant="outline" onClick={prevStep} disabled={step === 0 || isSubmitting}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Précédent
                </Button>
                <Button
                  onClick={step === totalSteps ? calculateEligibility : nextStep}
                  disabled={!isStepValid() || isSubmitting}
                  className="bg-[#008B3D] hover:bg-green-600"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Calcul en cours...
                    </>
                  ) : (
                    <>
                      {step === totalSteps ? "Calculer" : step === 0 ? "Commencer la simulation" : "Suivant"}
                      {!isSubmitting && <ArrowRight className="h-4 w-4 ml-2" />}
                    </>
                  )}
                </Button>
              </>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}

// Component pour la recherche de ville 
const CitySearch = ({ 
  address, 
  onAddressChange, 
  inputRef 
}: { 
  address: string; 
  onAddressChange: (value: string) => void; 
  inputRef: React.RefObject<HTMLInputElement | null>;
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Commune[]>([])
  const [fuse, setFuse] = useState<Fuse<Commune> | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({
    width: 0,
    left: 0,
    top: 0
  })

  // Marquer le composant comme monté côté client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Charger les communes et initialiser Fuse.js une seule fois
  useEffect(() => {
    if (!isClient) return

    loadCommunes().then(loadedCommunes => {
      setFuse(new Fuse(loadedCommunes, {
        keys: ["commune", "departement", "codeDepartement"],
        threshold: 0.3,
        distance: 100,
        includeScore: true,
        minMatchCharLength: 2,
        useExtendedSearch: true,
        ignoreLocation: true,
        shouldSort: true,
        findAllMatches: false
      }))
    })
  }, [isClient])

  // Fonction pour mettre à jour la position du dropdown
  const updateDropdownPosition = useCallback(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownStyle({
        width: rect.width,
        left: rect.left,
        top: rect.bottom + window.scrollY + 4
      })
    }
  }, [isOpen, inputRef])

  // Mise à jour de la position et gestion des événements
  useEffect(() => {
    updateDropdownPosition()
    
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      
      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition)
      document.addEventListener("mousedown", handleClickOutside)
      
      return () => {
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition)
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen, updateDropdownPosition, inputRef])

  // Recherche avec debounce
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      if (!term || !fuse) {
        setSearchResults([])
        return
      }
      const results = fuse
        .search(term)
        .map(result => result.item)
        .slice(0, 10)
      setSearchResults(results)
    }, 150),
    [fuse]
  )

  // Gestion des événements de l'input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onAddressChange(value)
    setIsOpen(true)
    debouncedSearch(value)
  }, [debouncedSearch, onAddressChange])

  const handleSelect = useCallback((commune: Commune) => {
    onAddressChange(commune.commune)
    setIsOpen(false)
    setSearchResults([])
  }, [onAddressChange])

  // Nettoyer le debounce lors du démontage
  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  return (
    <div className="space-y-4">
      <Label htmlFor="address">Indiquez nous votre ville de résidence</Label>
      <div className="relative">
        <Input
          id="address"
          type="text"
          ref={inputRef}
          placeholder="Commencez à taper votre ville..."
          value={address}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="h-12"
          autoComplete="off"
        />
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Ces informations nous permettent de mieux évaluer votre éligibilité au PTZ.
      </div>
      
      {isOpen && address && (
        <div 
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-auto" 
          style={{
            width: `${dropdownStyle.width}px`,
            left: `${dropdownStyle.left}px`,
            top: `${dropdownStyle.top}px`
          }}
        >
          {searchResults.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">Aucune ville trouvée</div>
          ) : (
            <div className="py-1">
              {searchResults.map((commune) => (
                <button
                  key={`${commune.codeDepartement}-${commune.commune}`}
                  onClick={() => handleSelect(commune)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{commune.commune}</span>
                    <span className="text-sm text-gray-500">
                      {commune.departement} ({commune.codeDepartement})
                    </span>
          </div>
                </button>
              ))}
        </div>
      )}
        </div>
      )}
    </div>
  );
};
