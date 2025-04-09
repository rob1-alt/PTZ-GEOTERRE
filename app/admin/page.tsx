"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cookies from 'js-cookie';

type Submission = {
  submissionDate: string;
  firstName: string;
  lastName: string;
  email: string;
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
};

export default function Admin() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
    setLoading(true);
    try {
      const response = await fetch('/api/sheets');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError('Erreur lors de la récupération des données');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch('/api/export-csv');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.filePath) {
        // Télécharger le fichier
        window.location.href = data.filePath;
      }
    } catch (err) {
      setError('Erreur lors de l\'export CSV');
      console.error('Erreur:', err);
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
          <div className="mb-6">
            <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700">
              Exporter en CSV
            </Button>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Foyer</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Revenu</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Coût</TableHead>
                    <TableHead>Éligible</TableHead>
                    <TableHead>Tranche</TableHead>
                    <TableHead>Montant PTZ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub, index) => (
                    <TableRow key={index}>
                      <TableCell>{sub.submissionDate}</TableCell>
                      <TableCell>{`${sub.firstName} ${sub.lastName}`}</TableCell>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell>{sub.householdSize}</TableCell>
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
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{Number(sub.income).toLocaleString()} €</TableCell>
                      <TableCell>{sub.housingType === 'individual' ? 'Individuel' : 'Collectif'}</TableCell>
                      <TableCell>{Number(sub.projectCost).toLocaleString()} €</TableCell>
                      <TableCell>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sub.eligible 
                              ? 'bg-green-100 text-green-800 border border-green-400' 
                              : 'bg-red-100 text-red-800 border border-red-400'
                          }`}
                        >
                          {sub.eligible ? 'Oui' : 'Non'}
                        </span>
                      </TableCell>
                      <TableCell>{sub.tranche || '-'}</TableCell>
                      <TableCell>{sub.ptzAmount ? `${Number(sub.ptzAmount).toLocaleString()} €` : '-'}</TableCell>
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
