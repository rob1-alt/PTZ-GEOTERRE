"use server"

import fs from "fs"
import path from "path"
import os from "os"
import { sendEmail, generatePTZConfirmationEmail } from "@/src/utils/emailService"

type SubmissionData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  householdSize: string
  zone: string
  address: string
  income: string
  housingType: string
  projectCost: string
  eligible: boolean
  tranche?: number
  quotity?: number
  ptzAmount?: number
  reason?: string
  notOwnerForTwoYears: boolean
}

// Chemin vers le fichier JSON local pour stocker les données
const DATA_FILE_PATH = path.join(process.cwd(), "data", "submissions.json")
// Chemin alternatif utilisant le répertoire temporaire du système
const TEMP_DATA_FILE_PATH = path.join(os.tmpdir(), "ptz_geoterre_submissions.json")

// Fonction pour s'assurer que le répertoire de données existe
function ensureDataDirectory() {
  console.log('Création/vérification du répertoire de données...')
  console.log('Chemin courant:', process.cwd())
  console.log('Chemin complet du fichier:', DATA_FILE_PATH)
  
  // Tentative d'utiliser le répertoire de données standard
  let useStandardPath = true
  const dataDir = path.join(process.cwd(), "data")
  
  if (!fs.existsSync(dataDir)) {
    console.log('Le répertoire data n\'existe pas, tentative de création...')
    try {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log('Répertoire data créé avec succès')
    } catch (error) {
      console.error('Erreur lors de la création du répertoire data:', error)
      console.log('Utilisation du répertoire temporaire comme alternative')
      useStandardPath = false
    }
  } else {
    console.log('Le répertoire data existe déjà')
    
    // Vérifier si le répertoire est accessible en écriture
    try {
      fs.accessSync(dataDir, fs.constants.W_OK)
      console.log('Le répertoire data est accessible en écriture')
    } catch (error) {
      console.error('Le répertoire data n\'est pas accessible en écriture:', error)
      console.log('Utilisation du répertoire temporaire comme alternative')
      useStandardPath = false
    }
  }

  // Si le chemin standard n'est pas utilisable, utiliser le répertoire temporaire
  const currentPath = useStandardPath ? DATA_FILE_PATH : TEMP_DATA_FILE_PATH
  console.log('Chemin final utilisé:', currentPath)

  // Créer un fichier vide s'il n'existe pas
  if (!fs.existsSync(currentPath)) {
    console.log(`Le fichier ${path.basename(currentPath)} n'existe pas, tentative de création...`)
    try {
      fs.writeFileSync(currentPath, JSON.stringify([]))
      console.log(`Fichier ${path.basename(currentPath)} créé avec succès`)
    } catch (error) {
      console.error(`Erreur lors de la création du fichier ${path.basename(currentPath)}:`, error)
      throw new Error(`Impossible de créer le fichier ${path.basename(currentPath)}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  } else {
    console.log(`Le fichier ${path.basename(currentPath)} existe déjà`)
    
    // Vérifier si le fichier est accessible en écriture
    try {
      fs.accessSync(currentPath, fs.constants.W_OK)
      console.log(`Le fichier ${path.basename(currentPath)} est accessible en écriture`)
    } catch (error) {
      console.error(`Le fichier ${path.basename(currentPath)} n'est pas accessible en écriture:`, error)
      throw new Error(`Le fichier ${path.basename(currentPath)} n'est pas accessible en écriture: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }
  
  return currentPath
}

// Fonction pour lire les données existantes
function readSubmissions(): any[] {
  const filePath = ensureDataDirectory()
  try {
    console.log(`Lecture du fichier ${path.basename(filePath)}...`)
    const data = fs.readFileSync(filePath, "utf8")
    const parsedData = JSON.parse(data)
    console.log(`Fichier lu avec succès, contient ${parsedData.length} entrées`)
    return parsedData
  } catch (error) {
    console.error("Erreur lors de la lecture des données:", error)
    throw new Error(`Erreur lors de la lecture des données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

// Fonction pour écrire les données
function writeSubmissions(submissions: any[]) {
  const filePath = ensureDataDirectory()
  try {
    console.log(`Écriture de ${submissions.length} entrées dans le fichier ${path.basename(filePath)}...`)
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2))
    console.log('Données écrites avec succès')
  } catch (error) {
    console.error("Erreur lors de l'écriture des données:", error)
    throw new Error(`Erreur lors de l'écriture des données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

export async function storeSubmission(data: SubmissionData) {
  try {
    console.log('Tentative d\'enregistrement des données...');
    console.log('Données reçues:', data);
    console.log('Environnement:', process.env.NODE_ENV);
    
    // Lire les données existantes
    const submissions = readSubmissions()

    // Ajouter la nouvelle soumission avec une date
    const submissionWithDate = {
      ...data,
      submissionDate: new Date().toLocaleString("fr-FR"),
    }

    // Ajouter au tableau et sauvegarder
    submissions.push(submissionWithDate)
    writeSubmissions(submissions)
    
    // Envoyer l'email de confirmation
    try {
      const emailTemplate = generatePTZConfirmationEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        eligible: data.eligible,
        ptzAmount: data.ptzAmount,
        reason: data.reason
      });

      await sendEmail({
        to: data.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });

      console.log('Email de confirmation envoyé avec succès');
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Ne pas faire échouer la soumission si l'envoi d'email échoue
    }
    
    // NOTE: Suppression de la tentative d'envoi à Google Sheets via fetch
    // Cette méthode ne fonctionne pas car l'URL n'est pas une API

    return { success: true }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données:', error);
    return { 
      success: false, 
      error: "Erreur lors de l'enregistrement des données",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

export async function getSheetUrl() {
  try {
    return {
      success: true,
      url: "https://docs.google.com/spreadsheets/d/1Fr4gwXZjeBvOtsOVpqPuzkOSdGC5OcEEBgT8IeMDIRQ/edit?resourcekey#gid=860741683",
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'URL:", error);
    return { 
      success: false, 
      error: "Erreur lors de la récupération de l'URL",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

export async function exportSubmissionsToCSV() {
  try {
    const submissions = readSubmissions()

    if (submissions.length === 0) {
      return { success: false, error: "Aucune donnée à exporter." }
    }

    // Définir l'ordre des colonnes
    const columns = [
      "submissionDate",
      "firstName",
      "lastName",
      "email",
      "phone",
      "zone",
      "address",
      "housingType",
      "householdSize",
      "income",
      "projectCost",
      "eligible",
      "tranche",
      "quotity",
      "ptzAmount",
      "reason"
    ]

    // Créer les en-têtes avec des noms plus lisibles
    const headers = [
      "Date de soumission",
      "Prénom",
      "Nom",
      "Email",
      "Téléphone",
      "Zone",
      "Adresse",
      "Type de logement",
      "Taille du foyer",
      "Revenu",
      "Coût du projet",
      "Éligible",
      "Tranche",
      "Quotité",
      "Montant PTZ",
      "Raison"
    ].join(",") + "\n"

    // Convertir les données en format CSV
    const csvRows = submissions
      .map((submission) => {
        return columns
          .map((column) => {
            const value = submission[column]
            if (value === undefined || value === null) {
              return ""
            }
            if (typeof value === "string") {
              // Échapper les guillemets et entourer de guillemets
              return `"${value.replace(/"/g, '""')}"`
            }
            if (typeof value === "boolean") {
              return value ? "Oui" : "Non"
            }
            if (column === "housingType") {
              return value === "individual" ? "Individuel" : "Collectif"
            }
            if (column === "quotity") {
              return value ? `${value}%` : ""
            }
            if (column === "ptzAmount" || column === "income" || column === "projectCost") {
              return value ? `${value} €` : ""
            }
            return value
          })
          .join(",")
      })
      .join("\n")

    const csvData = headers + csvRows

    // Définir le chemin du fichier
    const dir = path.join(process.cwd(), "public", "exports")
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const filePath = path.join(dir, "ptz_submissions.csv")

    // Écrire les données dans un fichier CSV
    fs.writeFileSync(filePath, csvData)

    return { success: true, filePath: "/exports/ptz_submissions.csv" }
  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error)
    return { success: false, error: "Erreur lors de l'export des données" }
  }
}
