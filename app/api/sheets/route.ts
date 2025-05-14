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
  
  console.log(`API - Total des entrées combinées après suppression des doublons: ${allSubmissions.length}`);
  console.log('API - Dates des 5 premières entrées (triées):');
  allSubmissions.slice(0, 5).forEach((sub, i) => {
    console.log(`  ${i + 1}: ${sub.submissionDate} - ${sub.firstName} ${sub.lastName}`);
  });
  
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
    console.log('=== DÉBUT API GET SHEETS ===');
    console.log(`Date/heure: ${new Date().toISOString()}`);
    console.log(`Environnement: ${process.env.NODE_ENV || 'non défini'}`);
    console.log(`Chemin absolu: ${process.cwd()}`);
    
    // Vérification des chemins de fichiers
    console.log(`Chemin standard: ${DATA_FILE_PATH}`);
    console.log(`Chemin temporaire: ${TEMP_DATA_FILE_PATH}`);
    
    // Vérification de l'existence des fichiers
    const standardExists = fs.existsSync(DATA_FILE_PATH);
    const tempExists = fs.existsSync(TEMP_DATA_FILE_PATH);
    console.log(`Fichier standard existe: ${standardExists ? 'Oui' : 'Non'}`);
    console.log(`Fichier temporaire existe: ${tempExists ? 'Oui' : 'Non'}`);
    
    // Lire les tailles de fichiers si ils existent
    if (standardExists) {
      try {
        const stats = fs.statSync(DATA_FILE_PATH);
        console.log(`Taille du fichier standard: ${stats.size} octets`);
      } catch (err) {
        console.error(`Erreur lors de la lecture des statistiques du fichier standard:`, err);
      }
    }
    
    if (tempExists) {
      try {
        const stats = fs.statSync(TEMP_DATA_FILE_PATH);
        console.log(`Taille du fichier temporaire: ${stats.size} octets`);
      } catch (err) {
        console.error(`Erreur lors de la lecture des statistiques du fichier temporaire:`, err);
      }
    }
    
    // Lire les données
    const submissions = readSubmissions();
    console.log(`Nombre total de soumissions: ${submissions.length}`);
    
    // Afficher un aperçu des données
    if (submissions.length > 0) {
      console.log('Aperçu des soumissions:');
      submissions.slice(0, 3).forEach((sub, index) => {
        console.log(`  ${index + 1}: ${sub.submissionDate} - ${sub.firstName} ${sub.lastName} (${sub.email})`);
      });
    } else {
      console.log('Aucune soumission trouvée');
    }
    
    console.log('=== FIN API GET SHEETS - SUCCÈS ===');
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('=== FIN API GET SHEETS - ERREUR ===');
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
    // Pour chaque soumission, ajoute la date si absente
    const submissionsWithDate = (submissions as any[]).map((sub: any) => ({
      ...sub,
      submissionDate: sub.submissionDate || new Date().toLocaleString('fr-FR')
    }));
    writeSubmissions(submissionsWithDate);
    // Renvoyer la soumission effectivement enregistrée (la plus récente)
    const savedSubmission = submissionsWithDate[0];
    return NextResponse.json({ success: true, savedSubmission });
  } catch (error) {
    console.error('API - Erreur lors de la sauvegarde des données:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la sauvegarde des données',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
} 