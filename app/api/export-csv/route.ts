import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), "data", "submissions.json");

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

// Fonction pour s'assurer que le répertoire de données existe
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Créer un fichier vide s'il n'existe pas
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([]));
  }
}

// Fonction pour lire les données existantes
function readSubmissions(): any[] {
  ensureDataDirectory();
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erreur lors de la lecture des données:", error);
    return [];
  }
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
    console.error("Erreur lors de l'export CSV:", error);
    return NextResponse.json({ 
      error: "Erreur lors de l'export des données",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
