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

// Fonction pour s'assurer que le répertoire de données existe
function ensureDataDirectory() {
  console.log('API - Création/vérification du répertoire de données...')
  console.log('API - Chemin courant:', process.cwd())
  console.log('API - Chemin complet du fichier:', DATA_FILE_PATH)
  
  // Tentative d'utiliser le répertoire de données standard
  let useStandardPath = true
  const dataDir = path.join(process.cwd(), "data");
  
  if (!fs.existsSync(dataDir)) {
    console.log('API - Le répertoire data n\'existe pas, tentative de création...')
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('API - Répertoire data créé avec succès')
    } catch (error) {
      console.error('API - Erreur lors de la création du répertoire data:', error);
      console.log('API - Utilisation du répertoire temporaire comme alternative')
      useStandardPath = false
    }
  } else {
    console.log('API - Le répertoire data existe déjà')
    
    // Vérifier si le répertoire est accessible en écriture
    try {
      fs.accessSync(dataDir, fs.constants.W_OK)
      console.log('API - Le répertoire data est accessible en écriture')
    } catch (error) {
      console.error('API - Le répertoire data n\'est pas accessible en écriture:', error)
      console.log('API - Utilisation du répertoire temporaire comme alternative')
      useStandardPath = false
    }
  }

  // Si le chemin standard n'est pas utilisable, utiliser le répertoire temporaire
  const currentPath = useStandardPath ? DATA_FILE_PATH : TEMP_DATA_FILE_PATH
  console.log('API - Chemin final utilisé:', currentPath)

  // Créer un fichier vide s'il n'existe pas
  if (!fs.existsSync(currentPath)) {
    console.log(`API - Le fichier ${path.basename(currentPath)} n'existe pas, tentative de création...`)
    try {
      fs.writeFileSync(currentPath, JSON.stringify([]));
      console.log(`API - Fichier ${path.basename(currentPath)} créé avec succès`)
    } catch (error) {
      console.error(`API - Erreur lors de la création du fichier ${path.basename(currentPath)}:`, error);
      throw new Error(`API - Impossible de créer le fichier ${path.basename(currentPath)}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  } else {
    console.log(`API - Le fichier ${path.basename(currentPath)} existe déjà`)
  }
  
  return currentPath;
}

// Fonction pour lire les données d'un fichier spécifique
function readSubmissionsFromFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.log(`API - Le fichier ${filePath} n'existe pas`);
    return [];
  }

  try {
    console.log(`API - Lecture du fichier ${path.basename(filePath)}...`);
    const data = fs.readFileSync(filePath, "utf8");
    const parsedData = JSON.parse(data);
    console.log(`API - Fichier ${path.basename(filePath)} lu avec succès, contient ${parsedData.length} entrées`);
    return parsedData;
  } catch (error) {
    console.error(`API - Erreur lors de la lecture des données depuis ${path.basename(filePath)}:`, error);
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
  
  console.log(`API - Total des entrées combinées: ${allSubmissions.length}`);
  
  return allSubmissions;
}

// Fonction pour écrire les données
function writeSubmissions(submissions: any[]) {
  try {
    // Tenter d'écrire dans le répertoire standard d'abord
    const dataDir = path.join(process.cwd(), "data");
    if (fs.existsSync(dataDir) && fs.accessSync(dataDir, fs.constants.W_OK) === undefined) {
      console.log(`API - Écriture de ${submissions.length} entrées dans ${DATA_FILE_PATH}...`);
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(submissions, null, 2));
      console.log('API - Données écrites avec succès dans le répertoire standard');
      return;
    }
  } catch (error) {
    console.error('API - Erreur lors de l\'écriture dans le répertoire standard:', error);
  }
  
  // Si l'écriture dans le répertoire standard échoue, utiliser le répertoire temporaire
  try {
    console.log(`API - Écriture de ${submissions.length} entrées dans ${TEMP_DATA_FILE_PATH}...`);
    fs.writeFileSync(TEMP_DATA_FILE_PATH, JSON.stringify(submissions, null, 2));
    console.log('API - Données écrites avec succès dans le répertoire temporaire');
  } catch (error) {
    console.error('API - Erreur lors de l\'écriture dans le répertoire temporaire:', error);
    throw new Error(`API - Impossible d'écrire les données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

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

export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const submissions = readSubmissions();
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('API - Erreur lors de la récupération des données:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des données',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { submissions } = await request.json();
    
    // Écrire les nouvelles soumissions dans le fichier
    writeSubmissions(submissions);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API - Erreur lors de la sauvegarde des données:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la sauvegarde des données',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
} 