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
  
  // Combiner les résultats
  const allSubmissions = [...standardSubmissions, ...tempSubmissions];
  
  // Trier par date de soumission (du plus récent au plus ancien)
  allSubmissions.sort((a, b) => {
    const dateA = new Date(a.submissionDate?.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$2-$1') || 0);
    const dateB = new Date(b.submissionDate?.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$2-$1') || 0);
    return dateB.getTime() - dateA.getTime();
  });
  
  console.log(`CSV - Total des entrées combinées: ${allSubmissions.length}`);
  
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
