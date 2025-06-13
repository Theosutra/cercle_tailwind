import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    username: user?.username || '',
    mail: user?.mail || '',
    telephone: user?.telephone || '',
    bio: user?.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // TODO: Ajouter l'appel API pour mettre à jour le profil
      // const updatedUser = await UserService.updateProfile(editForm)
      
      // Pour l'instant, on simule la mise à jour
      const updatedUser = { ...user, ...editForm };
      updateUser(updatedUser);
      
      setSuccess('Profil mis à jour avec succès!');
      setIsEditing(false);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Erreur lors de la mise à jour du profil');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      prenom: user?.prenom || '',
      nom: user?.nom || '',
      username: user?.username || '',
      mail: user?.mail || '',
      telephone: user?.telephone || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
    setError('');
  };

  const getInitials = (user) => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || '?';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          {user?.photo_profil ? (
            <img src={user.photo_profil} alt="Your profile" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-white font-bold text-sm">{getInitials(user)}</span>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <LeftSidebar />
            </div>
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:fixed lg:left-0 lg:w-72 lg:h-screen lg:overflow-y-auto">
          <LeftSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-72 xl:mr-80 pt-16 lg:pt-0 px-4 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-gray-200">
                      {user?.photo_profil ? (
                        <img 
                          src={user.photo_profil} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-bold text-2xl lg:text-3xl">
                            {getInitials(user)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Badge certifié */}
                    {user?.certified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Informations de base */}
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      {user?.prenom && user?.nom 
                        ? `${user.prenom} ${user.nom}` 
                        : user?.username || 'Utilisateur'
                      }
                    </h1>
                    <p className="text-lg text-gray-500 mt-1">@{user?.username}</p>
                    {user?.bio && (
                      <p className="text-gray-600 mt-2 max-w-md">{user.bio}</p>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors duration-200 font-medium"
                      >
                        Modifier le profil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                      >
                        Se déconnecter
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50"
                      >
                        {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages d'état */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Informations personnelles */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Informations personnelles</h2>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                        <input
                          type="text"
                          name="prenom"
                          value={editForm.prenom}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                        <input
                          type="text"
                          name="nom"
                          value={editForm.nom}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Nom"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Nom d'utilisateur"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={editForm.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Parlez-nous de vous..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Prénom</label>
                        <p className="text-gray-900">{user?.prenom || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                        <p className="text-gray-900">{user?.nom || 'Non renseigné'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Nom d'utilisateur</label>
                      <p className="text-gray-900">@{user?.username}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                      <p className="text-gray-900">{user?.bio || 'Aucune bio configurée'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations de contact */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Informations de contact</h2>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="mail"
                        value={editForm.mail}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        name="telephone"
                        value={editForm.telephone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Téléphone"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900">{user?.mail}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Téléphone</label>
                      <p className="text-gray-900">{user?.telephone || 'Non renseigné'}</p>
                    </div>
                    
                    {user?.certified && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Statut</label>
                        <div className="flex items-center">
                          <span className="text-blue-600 font-medium text-sm bg-blue-50 px-3 py-1 rounded-full">
                            ✓ Compte certifié
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Préférences */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Préférences</h2>
              
              <div className="space-y-6">
                {/* Confidentialité */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidentialité</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900">Compte privé</h4>
                        <p className="text-sm text-gray-500">Seuls vos abonnés peuvent voir vos publications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={user?.private} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900">Notifications email</h4>
                        <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900">Notifications push</h4>
                        <p className="text-sm text-gray-500">Recevoir des notifications sur votre appareil</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Zone Danger */}
                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-4">Zone de danger</h3>
                  <div className="p-4 border border-red-200 rounded-xl bg-red-50">
                    <h4 className="font-medium text-red-900 mb-2">Supprimer mon compte</h4>
                    <p className="text-sm text-red-700 mb-4">Cette action est irréversible. Toutes vos données seront définitivement supprimées.</p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                      Supprimer mon compte
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Hidden on mobile */}
        <aside className="hidden xl:block xl:fixed xl:right-0 xl:w-80 xl:h-screen xl:overflow-y-auto">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
};

export default Settings;