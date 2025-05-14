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
  selectedCommune?: { commune: string }
}

// Chemin vers le fichier JSON local pour stocker les données
const DATA_FILE_PATH = path.join(process.cwd(), "data", "submissions.json")
// Chemin alternatif utilisant le répertoire temporaire du système
const TEMP_DATA_FILE_PATH = path.join(os.tmpdir(), "ptz_geoterre_submissions.json")

// Fonction pour lire les données d'un fichier spécifique
function readSubmissionsFromFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.log(`Le fichier ${filePath} n'existe pas`);
    return [];
  }

  try {
    console.log(`Lecture du fichier ${path.basename(filePath)}...`);
    const data = fs.readFileSync(filePath, "utf8");
    const parsedData = JSON.parse(data);
    console.log(`Fichier ${path.basename(filePath)} lu avec succès, contient ${parsedData.length} entrées`);
    return parsedData;
  } catch (error) {
    console.error(`Erreur lors de la lecture des données depuis ${path.basename(filePath)}:`, error);
    return [];
  }
}

// Fonction pour lire toutes les données disponibles
function readSubmissions(): any[] {
  // Tenter de lire à partir des deux emplacements
  const standardSubmissions = readSubmissionsFromFile(DATA_FILE_PATH);
  const tempSubmissions = readSubmissionsFromFile(TEMP_DATA_FILE_PATH);
  
  // Utiliser une Map pour identifier les doublons basés sur la combinaison des champs uniques
  const uniqueSubmissions = new Map();
  
  // Fonction pour créer une clé unique pour chaque soumission
  const getSubmissionKey = (submission: any) => {
    // Créer une clé basée sur les champs qui devraient être uniques
    // Si la date de soumission existe, utilisons-la comme base principale
    if (submission.submissionDate) {
      return `${submission.submissionDate}_${submission.email}_${submission.firstName}_${submission.lastName}`;
    }
    // Sinon, utilisons juste l'email et le nom/prénom
    return `${submission.email}_${submission.firstName}_${submission.lastName}`;
  };

  // Ajouter les soumissions standards d'abord (priorité plus basse)
  standardSubmissions.forEach(submission => {
    const key = getSubmissionKey(submission);
    if (!uniqueSubmissions.has(key)) {
      uniqueSubmissions.set(key, submission);
    }
  });

  // Ajouter ensuite les soumissions temporaires (priorité plus haute, car potentiellement plus récentes)
  tempSubmissions.forEach(submission => {
    const key = getSubmissionKey(submission);
    // Remplacer toujours par les versions du fichier temporaire car elles sont plus récentes
    uniqueSubmissions.set(key, submission);
  });

  // Convertir la Map en tableau
  const allSubmissions = Array.from(uniqueSubmissions.values());
  
  // Trier par date de soumission (du plus récent au plus ancien)
  allSubmissions.sort((a, b) => {
    // Fonction pour convertir une date française en objet Date
    const parseFrenchDate = (dateStr: string) => {
      if (!dateStr) return new Date(0);
      // Format DD/MM/YYYY HH:mm:ss
      const [datePart, timePart] = dateStr.split(' ');
      if (!datePart) return new Date(0);
      
      const [day, month, year] = datePart.split('/').map(Number);
      if (!year || !month || !day) return new Date(0);
      
      if (timePart) {
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
      }
      
      return new Date(year, month - 1, day);
    };
    
    const dateA = parseFrenchDate(a.submissionDate);
    const dateB = parseFrenchDate(b.submissionDate);
    
    return dateB.getTime() - dateA.getTime();
  });
  
  console.log(`Total des entrées combinées après suppression des doublons: ${allSubmissions.length}`);
  console.log('Dates des 3 premières entrées (triées):');
  allSubmissions.slice(0, 3).forEach((sub, i) => {
    console.log(`  ${i + 1}: ${sub.submissionDate} - ${sub.firstName} ${sub.lastName}`);
  });
  
  return allSubmissions;
}

// Fonction pour écrire les données
function writeSubmissions(submissions: any[]) {
  // Essayer d'abord d'écrire dans le répertoire standard
  try {
    const dataDir = path.join(process.cwd(), "data");
    
    // Vérifier si le répertoire existe, sinon le créer
    if (!fs.existsSync(dataDir)) {
      console.log('Le répertoire data n\'existe pas, tentative de création...');
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Répertoire data créé avec succès');
    }
    
    // Vérifier les permissions en écriture
    try {
      fs.accessSync(dataDir, fs.constants.W_OK);
      console.log(`Écriture de ${submissions.length} entrées dans ${DATA_FILE_PATH}...`);
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(submissions, null, 2));
      console.log('Données écrites avec succès dans le répertoire standard');
      return; // Si l'écriture réussit, on sort de la fonction
    } catch (accessError) {
      console.error('Le répertoire data n\'est pas accessible en écriture:', accessError);
      // Continuer à essayer avec le répertoire temporaire
    }
  } catch (dirError) {
    console.error('Erreur lors de la création/accès au répertoire data:', dirError);
    // Continuer à essayer avec le répertoire temporaire
  }
  
  // Si l'écriture dans le répertoire standard échoue, utiliser le répertoire temporaire
  try {
    console.log(`Écriture de ${submissions.length} entrées dans ${TEMP_DATA_FILE_PATH}...`);
    fs.writeFileSync(TEMP_DATA_FILE_PATH, JSON.stringify(submissions, null, 2));
    console.log('Données écrites avec succès dans le répertoire temporaire');
  } catch (error) {
    console.error('Erreur lors de l\'écriture dans le répertoire temporaire:', error);
    throw new Error(`Impossible d'écrire les données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export async function storeSubmission(data: SubmissionData) {
  try {
    console.log('=== DÉBUT STORE SUBMISSION ===');
    console.log(`Date/heure: ${new Date().toISOString()}`);
    console.log(`Environnement: ${process.env.NODE_ENV || 'non défini'}`);
    console.log(`Chemin absolu: ${process.cwd()}`);
    console.log(`Données reçues: ${JSON.stringify(data, null, 2)}`);
    
    // Lire les données existantes
    console.log('Lecture des données existantes...');
    const submissions = readSubmissions();
    console.log(`Nombre de soumissions existantes: ${submissions.length}`);

    // Ajouter la nouvelle soumission avec une date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString("fr-FR");
    console.log(`Date de soumission formatée: ${formattedDate}`);
    
    const submissionWithDate = {
      ...data,
      submissionDate: formattedDate,
    }
    console.log(`Nouvelle soumission à ajouter: ${JSON.stringify(submissionWithDate, null, 2)}`);

    // Vérifier si une soumission similaire existe déjà
    const submissionKey = `${submissionWithDate.email}_${submissionWithDate.firstName}_${submissionWithDate.lastName}`;
    const existingSimilar = submissions.find(sub => 
      `${sub.email}_${sub.firstName}_${sub.lastName}` === submissionKey
    );
    
    if (existingSimilar) {
      console.log(`Attention: une soumission similaire existe déjà pour ${submissionKey}`);
      console.log(`Date existante: ${existingSimilar.submissionDate}`);
    }

    // Ajouter au tableau et sauvegarder
    submissions.unshift(submissionWithDate); // Ajouter au début pour avoir les plus récentes en premier
    console.log(`Nouvelle longueur du tableau: ${submissions.length}`);
    console.log('Écriture des données...');
    
    // Tester les deux chemins d'écriture avant d'appeler writeSubmissions
    const dataDir = path.join(process.cwd(), "data");
    console.log(`Répertoire de données standard: ${dataDir}`);
    console.log(`Existe: ${fs.existsSync(dataDir) ? 'Oui' : 'Non'}`);
    
    if (fs.existsSync(dataDir)) {
      try {
        fs.accessSync(dataDir, fs.constants.W_OK);
        console.log('Répertoire standard accessible en écriture: Oui');
      } catch (e) {
        console.log('Répertoire standard accessible en écriture: Non');
        console.log(`Erreur d'accès: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    
    console.log(`Chemin temporaire: ${TEMP_DATA_FILE_PATH}`);
    console.log(`Dossier temporaire existe: ${fs.existsSync(path.dirname(TEMP_DATA_FILE_PATH)) ? 'Oui' : 'Non'}`);
    console.log(`Fichier temporaire existe: ${fs.existsSync(TEMP_DATA_FILE_PATH) ? 'Oui' : 'Non'}`);
    
    try {
      writeSubmissions(submissions);
      console.log('Écriture réussie');
    } catch (writeError) {
      console.error('Erreur lors de l\'écriture:', writeError);
      // Essayer une méthode de secours - écrire directement dans le fichier temporaire
      try {
        console.log('Tentative d\'écriture de secours dans le fichier temporaire...');
        fs.writeFileSync(TEMP_DATA_FILE_PATH, JSON.stringify(submissions, null, 2));
        console.log('Écriture de secours réussie');
      } catch (fallbackError) {
        console.error('Échec de l\'écriture de secours:', fallbackError);
      }
    }
    
    // Envoyer l'email de confirmation
    try {
      console.log('Envoi de l\'email de confirmation...');
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

    console.log('=== FIN STORE SUBMISSION - SUCCÈS ===');
    return { success: true }
  } catch (error) {
    console.error('=== FIN STORE SUBMISSION - ERREUR ===');
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
      "selectedCommune",
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
      "Lieu de recherche",
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
            if (column === "selectedCommune") {
              return submission.selectedCommune?.commune ? `"${submission.selectedCommune.commune.replace(/"/g, '""')}"` : '';
            }
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
