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

async function exportSubmissionsToCSV() {
  try {
    const submissions = readSubmissions();

    if (submissions.length === 0) {
      return { success: false, error: "Aucune donnée à exporter." };
    }

    // Extraire les en-têtes à partir des clés de la première soumission
    const headers = Object.keys(submissions[0]).join(",") + "\n";

    // Convertir les données en format CSV
    const csvRows = submissions
      .map((submission) => {
        return Object.values(submission)
          .map((value) => {
            if (typeof value === "string") {
              // Échapper les guillemets et entourer de guillemets
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",");
      })
      .join("\n");

    const csvData = headers + csvRows;

    // Définir le chemin du fichier
    const dir = path.join(process.cwd(), "public", "exports");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, "ptz_submissions.csv");

    // Écrire les données dans un fichier CSV
    fs.writeFileSync(filePath, csvData);

    return { success: true, filePath: "/exports/ptz_submissions.csv" };
  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error);
    return { success: false, error: "Erreur lors de l'export des données" };
  }
}

export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  
  try {
    const result = await exportSubmissionsToCSV();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Renvoyer le chemin du fichier CSV
    return NextResponse.json({ filePath: result.filePath });
  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error);
    return NextResponse.json({ 
      error: "Erreur lors de l'export des données",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
