import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DATA_FILE_PATH = path.join(process.cwd(), "data", "submissions.json");
// Chemin alternatif utilisant le répertoire temporaire du système
const TEMP_DATA_FILE_PATH = path.join(os.tmpdir(), "ptz_geoterre_submissions.json");

// Informations d'authentification
const ADMIN_USERNAME = 'geoterre';
const ADMIN_PASSWORD = 'q4T52k6EqufC3Q';

// Fonction pour vérifier l'authentification
function isAuthenticated(request: NextRequest): boolean {
  // Vérifier le cookie d'authentification
  const authCookie = request.cookies.get('ptz_admin_auth');
  
  if (authCookie?.value === 'true') {
    return true;
  }

  // Vérifier l'en-tête d'autorisation basique
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return true;
    }
  }

  return false;
}

// Fonction pour lire les données d'un fichier spécifique
function readSubmissionsFromFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.log(`CSV - Le fichier ${filePath} n'existe pas`);
    return [];
  }

  try {
    console.log(`CSV - Lecture du fichier ${path.basename(filePath)}...`);
    const data = fs.readFileSync(filePath, "utf8");
    const parsedData = JSON.parse(data);
    console.log(`CSV - Fichier ${path.basename(filePath)} lu avec succès, contient ${parsedData.length} entrées`);
    return parsedData;
  } catch (error) {
    console.error(`CSV - Erreur lors de la lecture des données depuis ${path.basename(filePath)}:`, error);
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
  
  console.log(`CSV - Total des entrées combinées après suppression des doublons: ${allSubmissions.length}`);
  console.log('CSV - Dates des 5 premières entrées (triées):');
  allSubmissions.slice(0, 5).forEach((sub, i) => {
    console.log(`  ${i + 1}: ${sub.submissionDate} - ${sub.firstName} ${sub.lastName}`);
  });
  
  return allSubmissions;
}

export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const submissions = readSubmissions();

    if (submissions.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à exporter." }, { status: 400 });
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
    ];

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
    ].join(",") + "\n";

    // Convertir les données en format CSV
    const csvRows = submissions
      .map((submission) => {
        return columns
          .map((column) => {
            const value = submission[column];
            if (value === undefined || value === null) {
              return "";
            }
            if (typeof value === "string") {
              // Échapper les guillemets et entourer de guillemets
              return `"${value.replace(/"/g, '""')}"`;
            }
            if (typeof value === "boolean") {
              return value ? "Oui" : "Non";
            }
            if (column === "housingType") {
              return value === "individual" ? "Individuel" : "Collectif";
            }
            if (column === "quotity") {
              return value ? `${value}%` : "";
            }
            if (column === "ptzAmount" || column === "income" || column === "projectCost") {
              return value ? `${value} €` : "";
            }
            return value;
          })
          .join(",");
      })
      .join("\n");

    const csvData = headers + csvRows;

    // Créer une réponse avec le contenu CSV
    const response = new NextResponse(csvData);
    
    // Définir les en-têtes pour le téléchargement
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', 'attachment; filename=ptz_submissions.csv');
    
    return response;
  } catch (error) {
    console.error("CSV - Erreur lors de l'export CSV:", error);
    return NextResponse.json({ 
      error: "Erreur lors de l'export des données",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
