import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DATA_FILE_PATH = path.join(process.cwd(), "data", "submissions.json");
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

// Fonction pour vérifier l'existence et la lisibilité d'un fichier
function checkFile(filePath: string): {
  path: string;
  exists: boolean;
  readable: boolean;
  writable: boolean;
  size: number | null;
  content: any;
  error: string | null;
} {
  const result = {
    path: filePath,
    exists: false,
    readable: false,
    writable: false,
    size: null as number | null,
    content: null as any,
    error: null as string | null
  };
  
  try {
    result.exists = fs.existsSync(filePath);
    
    if (result.exists) {
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
        result.readable = true;
      } catch (e) {
        result.readable = false;
        result.error = `Non lisible: ${e instanceof Error ? e.message : String(e)}`;
      }
      
      try {
        fs.accessSync(filePath, fs.constants.W_OK);
        result.writable = true;
      } catch (e) {
        result.writable = false;
        // Ne pas écraser l'erreur de lecture si elle existe déjà
        if (!result.error) {
          result.error = `Non modifiable: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      
      try {
        const stats = fs.statSync(filePath);
        result.size = stats.size;
        
        if (result.readable && result.size && result.size < 10000) { // Lire seulement si le fichier est petit
          const content = fs.readFileSync(filePath, 'utf8');
          try {
            const parsedContent = JSON.parse(content);
            result.content = parsedContent;
          } catch (parseError) {
            result.content = content.slice(0, 200) + '...'; // Afficher juste le début si ce n'est pas du JSON valide
            result.error = `JSON invalide: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
          }
        }
      } catch (e) {
        result.error = `Erreur lors de la lecture du fichier: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  } catch (e) {
    result.error = `Erreur générale: ${e instanceof Error ? e.message : String(e)}`;
  }
  
  return result;
}

export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // Collecter des informations sur le système
    const systemInfo = {
      nodeEnv: process.env.NODE_ENV || 'non défini',
      platform: process.platform,
      cwd: process.cwd(),
      tmpdir: os.tmpdir(),
      homedir: os.homedir(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      nodeVersion: process.version,
      dataDirectory: path.join(process.cwd(), "data"),
      dataDirectoryExists: fs.existsSync(path.join(process.cwd(), "data"))
    };
    
    // Vérifier les fichiers standard et temporaire
    const standardFile = checkFile(DATA_FILE_PATH);
    const tempFile = checkFile(TEMP_DATA_FILE_PATH);
    
    // Tester la création d'un fichier temporaire pour voir si c'est possible
    let tempWriteTest: {
      success: boolean;
      error: string | null;
      path: string | null;
      exists?: boolean;
    } = { 
      success: false, 
      error: null, 
      path: null 
    };

    try {
      const testPath = path.join(os.tmpdir(), `ptz_test_${Date.now()}.txt`);
      fs.writeFileSync(testPath, 'test');
      tempWriteTest = { 
        success: true, 
        error: null, 
        path: testPath,
        exists: fs.existsSync(testPath)
      };
      // Nettoyer
      try {
        fs.unlinkSync(testPath);
      } catch (e) {
        console.log('Erreur lors du nettoyage du fichier de test:', e);
      }
    } catch (e) {
      tempWriteTest = { 
        success: false, 
        error: `${e instanceof Error ? e.message : String(e)}`,
        path: null
      };
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      system: systemInfo,
      standardFile,
      tempFile,
      tempWriteTest
    });
  } catch (error) {
    console.error('Erreur lors du diagnostic:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du diagnostic',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
} 