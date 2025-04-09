"use server"

import fs from "fs"
import path from "path"

type SubmissionData = {
  firstName: string
  lastName: string
  email: string
  householdSize: string
  zone: string
  income: string
  housingType: string
  projectCost: string
  eligible: boolean
  tranche?: number
  quotity?: number
  ptzAmount?: number
  reason?: string
}

// Chemin vers le fichier JSON local pour stocker les données
const DATA_FILE_PATH = path.join(process.cwd(), "data", "submissions.json")

// Fonction pour s'assurer que le répertoire de données existe
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Créer un fichier vide s'il n'existe pas
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([]))
  }
}

// Fonction pour lire les données existantes
function readSubmissions(): any[] {
  ensureDataDirectory()
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Erreur lors de la lecture des données:", error)
    return []
  }
}

// Fonction pour écrire les données
function writeSubmissions(submissions: any[]) {
  ensureDataDirectory()
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(submissions, null, 2))
}

export async function storeSubmission(data: SubmissionData) {
  try {
    console.log('Tentative d\'enregistrement des données...');
    
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
    
    // Envoyer à Google Sheets en utilisant une API externe
    try {
      // Appel à l'API fetch pour envoyer les données à un service externe qui gère Google Sheets
      // Cela peut être une API serverless comme Netlify Functions, Vercel Functions, etc.
      const response = await fetch("https://docs.google.com/spreadsheets/d/1Fr4gwXZjeBvOtsOVpqPuzkOSdGC5OcEEBgT8IeMDIRQ/edit?resourcekey#gid=860741683", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionWithDate),
      });
      
      console.log('Réponse de la requête:', response.status);
    } catch (sheetError) {
      // Ne pas échouer complètement si l'envoi à Google Sheets échoue
      console.error('Erreur lors de l\'envoi à Google Sheets:', sheetError);
    }

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

    // Extraire les en-têtes à partir des clés de la première soumission
    const headers = Object.keys(submissions[0]).join(",") + "\n"

    // Convertir les données en format CSV
    const csvRows = submissions
      .map((submission) => {
        return Object.values(submission)
          .map((value) => {
            if (typeof value === "string") {
              // Échapper les guillemets et entourer de guillemets
              return `"${value.replace(/"/g, '""')}"`
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
