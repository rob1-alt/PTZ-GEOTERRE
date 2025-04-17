export type Commune = {
  codeDepartement: string;
  departement: string;
  commune: string;
  region: string;
  zonePTZ2014: string;
  zonePTZ2024: string;
  population: number;
};

// Cache pour stocker les communes chargées
let communesCache: Commune[] | null = null;

// Fonction pour charger les données des communes depuis le CSV
export async function loadCommunes(): Promise<Commune[]> {
  // Si les communes sont déjà en cache, les retourner
  if (communesCache) {
    return communesCache;
  }

  try {
    const response = await fetch('/20240705 Liste des zones PTZ avec population.csv');
    const text = await response.text();
    
    // Parser le CSV
    const lines = text.split('\n');
    const communes: Commune[] = [];
    
    // Commencer à partir de la ligne 7 (index 6) pour ignorer les en-têtes
    for (let i = 6; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [codeDepartement, departement, commune, region, zonePTZ2014, zonePTZ2024, population] = line.split(';');
      
      communes.push({
        codeDepartement,
        departement,
        commune,
        region,
        zonePTZ2014,
        zonePTZ2024,
        population: parseInt(population) || 0
      });
    }
    
    // Mettre en cache les communes
    communesCache = communes;
    return communes;
  } catch (error) {
    console.error('Erreur lors du chargement des communes:', error);
    return [];
  }
}

// Fonction pour rechercher une commune
export function searchCommune(communes: Commune[], query: string): Commune[] {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Recherche exacte d'abord
  const exactMatches = communes.filter(commune => {
    const communeName = commune.commune.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return communeName === searchTerm;
  });

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Si pas de correspondance exacte, chercher les correspondances partielles
  return communes.filter(commune => {
    const communeName = commune.commune.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return communeName.includes(searchTerm);
  });
} 