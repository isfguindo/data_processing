export const fr = {
  // Navigation
  nav: {
    dashboard: 'Tableau de Bord',
    sensors: 'Capteurs IoT',
    irrigation: 'Irrigation',
    plants: 'Plantes',
    stock: 'Stock',
    sales: 'Ventes',
    customers: 'Clients',
    employees: 'Personnel',
    tasks: 'Tâches',
    reports: 'Rapports',
    settings: 'Paramètres',
    logout: 'Déconnexion'
  },
  
  // Auth
  auth: {
    login: 'Connexion',
    register: 'Créer un compte',
    email: 'Email',
    password: 'Mot de passe',
    fullName: 'Nom complet',
    role: 'Rôle',
    signIn: 'Se connecter',
    signUp: 'Créer le compte',
    hasAccount: 'Déjà un compte ?',
    noAccount: 'Pas encore de compte ?',
    loginSuccess: 'Connexion réussie !',
    registerSuccess: 'Compte créé avec succès !',
    welcome: 'Bienvenue ! Connectez-vous à votre compte',
    joinUs: 'Rejoignez AgroFarm pour optimiser votre ferme'
  },
  
  // Common
  common: {
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    search: 'Rechercher',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    actions: 'Actions',
    status: 'Statut',
    date: 'Date',
    name: 'Nom',
    description: 'Description',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    refresh: 'Actualiser'
  },
  
  // Dashboard
  dashboard: {
    title: 'Tableau de Bord',
    subtitle: 'Vue d\'ensemble de votre ferme en temps réel',
    plants: 'Plantes',
    healthyPlants: 'en bonne santé',
    stock: 'Stock',
    lowStockItems: 'articles à restock',
    sales: 'Ventes',
    transactions: 'transactions',
    customers: 'Clients',
    pendingTasks: 'tâches en attente',
    realTimeSensors: 'Capteurs en Temps Réel',
    stockAlert: 'Alertes Stock',
    stockAlertMessage: 'articles en stock sont sous le seuil minimum. Consultez la page Stock pour plus de détails.'
  },
  
  // Plants
  plants: {
    title: 'Gestion des Plantes',
    subtitle: 'Surveillez et diagnostiquez vos cultures avec l\'IA',
    addPlant: 'Ajouter une Plante',
    diagnose: 'Diagnostiquer',
    plantName: 'Nom',
    plantType: 'Type',
    location: 'Localisation',
    plantingDate: 'Date de Plantation',
    healthy: 'Saine',
    sick: 'Malade',
    treated: 'Traitée',
    diagnosisTitle: 'Diagnostic IA',
    analyzing: 'Analyse IA en cours...',
    analyzingMessage: 'L\'IA analyse l\'image de votre plante. Cela peut prendre 10-30 secondes.',
    uploadImage: 'Glissez une image ou cliquez pour sélectionner',
    dropImage: 'Déposez l\'image ici',
    formatsAccepted: 'Formats acceptés: JPG, PNG, WEBP',
    diagnosisResult: 'Résultat du Diagnostic',
    diagnosisComplete: 'Diagnostic terminé !',
    noPlants: 'Aucune plante enregistrée'
  },
  
  // Irrigation
  irrigation: {
    title: 'Gestion de l\'Irrigation',
    subtitle: 'Planification et optimisation automatique',
    addSchedule: 'Ajouter un Horaire',
    aiRecommendation: 'Recommandation IA',
    generating: 'Génération...',
    zone: 'Zone',
    startTime: 'Heure de début',
    duration: 'Durée (min)',
    waterAmount: 'Quantité d\'eau (L)',
    scheduled: 'Planifié',
    running: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    scheduleAdded: 'Horaire d\'irrigation ajouté !',
    recommendationGenerated: 'Recommandation IA générée !'
  },
  
  // Sensors
  sensors: {
    title: 'Capteurs IoT',
    subtitle: 'Surveillance environnementale en temps réel',
    humidity: 'Humidité du Sol',
    temperature: 'Température',
    ph: 'pH du Sol',
    wind: 'Vitesse du Vent',
    rain: 'Précipitations',
    sunlight: 'Ensoleillement',
    optimal: 'Optimal',
    low: 'Faible',
    high: 'Élevé',
    ideal: 'Idéal',
    normal: 'Normal'
  },
  
  // Stock
  stock: {
    title: 'Gestion du Stock',
    subtitle: 'Inventaire et suivi des ressources',
    addItem: 'Ajouter un Article',
    itemName: 'Nom de l\'article',
    category: 'Catégorie',
    unit: 'Unité',
    minThreshold: 'Seuil Minimum',
    pricePerUnit: 'Prix Unitaire',
    lowStock: 'Stock Faible',
    available: 'Disponible',
    seeds: 'Graines',
    fertilizers: 'Fertilisants',
    pesticides: 'Pesticides',
    harvestedProducts: 'Produits Récoltés',
    tools: 'Outils'
  },
  
  // Settings
  settings: {
    title: 'Paramètres',
    subtitle: 'Configurez votre système de gestion',
    language: 'Langue',
    aiConfig: 'Configuration de l\'IA',
    aiProvider: 'Fournisseur d\'IA',
    aiModel: 'Modèle',
    automation: 'Automatisation',
    autoIrrigation: 'Irrigation Automatique',
    autoIrrigationDesc: 'Active l\'irrigation automatique basée sur les capteurs et l\'IA',
    notifications: 'Notifications',
    notificationsDesc: 'Recevez des alertes pour les événements importants',
    saveSettings: 'Enregistrer les Paramètres',
    settingsSaved: 'Paramètres enregistrés !',
    emergentKeyNote: 'Note: L\'application utilise la clé universelle Emergent pour tous les fournisseurs d\'IA.'
  }
};
