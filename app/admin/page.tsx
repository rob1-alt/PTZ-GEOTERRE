"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cookies from 'js-cookie';
import { Checkbox } from "@/components/ui/checkbox";

type Submission = {
  submissionDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  householdSize: string;
  zone: string;
  address: string;
  income: string;
  housingType: string;
  projectCost: string;
  eligible: boolean;
  tranche?: number;
  quotity?: number;
  ptzAmount?: number;
  reason?: string;
  notOwnerForTwoYears: boolean;
};

export default function Admin() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Informations d'authentification
  const ADMIN_USERNAME = 'geoterre';
  const ADMIN_PASSWORD = 'q4T52k6EqufC3Q';

  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = Cookies.get('ptz_admin_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
        fetchSubmissions();
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Définir un cookie qui expire dans 24 heures
      Cookies.set('ptz_admin_auth', 'true', { expires: 1 });
      fetchSubmissions();
    } else {
      setAuthError('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    Cookies.remove('ptz_admin_auth');
    setUsername('');
    setPassword('');
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/sheets', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log('Données reçues:', data);
      if (!data.submissions || !Array.isArray(data.submissions)) {
        throw new Error('Format de données invalide');
      }
      // Comparer les nouvelles données avec les anciennes
      const newSubmissionsString = JSON.stringify(data.submissions);
      const currentSubmissionsString = JSON.stringify(submissions);
      
      // Ne mettre à jour que si les données ont changé
      if (newSubmissionsString !== currentSubmissionsString) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      setError('Erreur lors de la récupération des données');
      console.error('Erreur:', err);
    }
  };

  // Ajouter un intervalle de rafraîchissement
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
      // Rafraîchir toutes les 2 minutes au lieu de 30 secondes
      const interval = setInterval(fetchSubmissions, 120000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const exportCSV = async () => {
    try {
      const response = await fetch('/api/export-csv');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // Récupérer le blob de la réponse
      const blob = await response.blob();
      
      // Créer un lien temporaire pour le téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ptz_submissions.csv';
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Erreur lors de l\'export CSV');
      console.error('Erreur:', err);
    }
  };

  const handleSelectSubmission = (index: number) => {
    setSelectedSubmissions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleCancelSubmissions = async () => {
    if (selectedSubmissions.length === 0) return;

    try {
      const updatedSubmissions = submissions.filter((_, index) => !selectedSubmissions.includes(index));
      setSubmissions(updatedSubmissions);
      setSelectedSubmissions([]);

      // Sauvegarder les modifications
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissions: updatedSubmissions }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des modifications');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de l\'annulation des soumissions');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-20 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connexion Administrateur</CardTitle>
            <CardDescription>
              Veuillez vous connecter pour accéder au panneau d'administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {authError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Identifiant</Label>
                <Input 
                  id="username" 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Se connecter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Administration PTZ Calculator</CardTitle>
            <CardDescription>
              Consultez toutes les demandes de simulation PTZ soumises
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Déconnexion
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-4">
            <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700">
              Exporter en CSV
            </Button>
            {selectedSubmissions.length > 0 && (
              <Button 
                onClick={handleCancelSubmissions} 
                className="bg-red-600 hover:bg-red-700"
              >
                Annuler les soumissions sélectionnées ({selectedSubmissions.length})
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-10">Chargement des données...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-10">Aucune soumission trouvée</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedSubmissions.length === submissions.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubmissions(submissions.map((_, index) => index));
                          } else {
                            setSelectedSubmissions([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Type de logement</TableHead>
                    <TableHead>Taille du foyer</TableHead>
                    <TableHead>Revenu</TableHead>
                    <TableHead>Coût du projet</TableHead>
                    <TableHead>Éligible</TableHead>
                    <TableHead>Tranche</TableHead>
                    <TableHead>Quotité</TableHead>
                    <TableHead>Montant PTZ</TableHead>
                    <TableHead>Non propriétaire</TableHead>
                    <TableHead>Raison</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSubmissions.includes(index)}
                          onCheckedChange={() => handleSelectSubmission(index)}
                        />
                      </TableCell>
                      <TableCell>{sub.submissionDate}</TableCell>
                      <TableCell>{`${sub.firstName} ${sub.lastName}`}</TableCell>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell>{sub.phone || "-"}</TableCell>
                      <TableCell>{sub.zone}</TableCell>
                      <TableCell>
                        {sub.address ? (
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[150px]">{sub.address}</span>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sub.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                              title="Voir sur Google Maps"
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="w-4 h-4"
                              >
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                                <path d="M15 3h6v6"></path>
                                <path d="M10 14L21 3"></path>
                              </svg>
                            </a>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{sub.housingType === "individual" ? "Individuel" : "Collectif"}</TableCell>
                      <TableCell>{sub.householdSize}</TableCell>
                      <TableCell>{sub.income} €</TableCell>
                      <TableCell>{sub.projectCost} €</TableCell>
                      <TableCell>{sub.eligible ? "Oui" : "Non"}</TableCell>
                      <TableCell>{sub.tranche || "-"}</TableCell>
                      <TableCell>{sub.quotity ? `${sub.quotity}%` : "-"}</TableCell>
                      <TableCell>{sub.ptzAmount ? `${sub.ptzAmount} €` : "-"}</TableCell>
                      <TableCell>{sub.notOwnerForTwoYears ? "Oui" : "Non"}</TableCell>
                      <TableCell>{sub.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
