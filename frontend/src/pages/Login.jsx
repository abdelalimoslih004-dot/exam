import { createContext, useContext, useState, useEffect } from 'react';

// Création du contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte facilement
export const useAuth = () => useContext(AuthContext);

// Le Provider qui englobe l'application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👇 CONFIGURATION URL : Bascule automatiquement entre Localhost et Vercel
  const API_URL = import.meta.env.VITE_API_URL;

  // 1. Vérifier si l'utilisateur est déjà connecté au chargement (Persistance)
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Erreur de récupération de session:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  // 2. Fonction d'INSCRIPTION (Register)
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Échec de l\'inscription' };
      }
    } catch (error) {
      console.error("Erreur Register:", error);
      return { success: false, error: "Impossible de contacter le serveur." };
    }
  };

  // 3. Fonction de CONNEXION (Login)
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Stockage sécurisé
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Mise à jour de l'état global
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Identifiants incorrects' };
      }
    } catch (error) {
      console.error("Erreur Login:", error);
      return { success: false, error: "Erreur de connexion serveur." };
    }
  };

  // 4. Fonction de DÉCONNEXION (Logout)
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Optionnel : rediriger vers login ici si besoin via window.location
  };

  // Export des valeurs pour toute l'app
  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};