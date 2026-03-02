import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onClose }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🔐 Politique de Confidentialité</h1>
            <p className="text-blue-100 mt-2">INTELLECTION ClassBoard - Application Mobile</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {/* Section 1 */}
          <h2 className="text-2xl font-bold text-blue-600 mt-6 mb-4 border-l-4 border-blue-600 pl-4">
            1. Introduction
          </h2>
          <p className="text-gray-700 mb-4 text-justify">
            INTELLECTION ("nous", "notre" ou "nos") exploite l'application mobile INTELLECTION ClassBoard
            (l'«application»). Cette page vous informe de nos politiques concernant la collecte, l'utilisation
            et la divulgation des données personnelles lorsque vous utilisez notre application.
          </p>
          <p className="text-gray-700 mb-6 text-justify">
            Nous nous engageons à protéger votre vie privée. Si vous avez des questions supplémentaires
            concernant notre politique de confidentialité, n'hésitez pas à nous contacter à l'adresse
            <strong> privacy@intellection.ma</strong>
          </p>

          {/* Section 2 */}
          <h2 className="text-2xl font-bold text-blue-600 mt-6 mb-4 border-l-4 border-blue-600 pl-4">
            2. Définitions
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li><strong>Données personnelles :</strong> Toute information qui peut vous identifier directement ou indirectement</li>
            <li><strong>Application :</strong> INTELLECTION ClassBoard, application mobile disponible sur iOS et Android</li>
            <li><strong>Utilisateur :</strong> Toute personne utilisant l'application (étudiants, professeurs, administrateurs)</li>
            <li><strong>Compte :</strong> Profil d'utilisateur créé dans l'application avec identifiants d'authentification</li>
          </ul>

          {/* Section 3 */}
          <h2 className="text-2xl font-bold text-blue-600 mt-6 mb-4 border-l-4 border-blue-600 pl-4">
            3. Données Collectées
          </h2>

          <h3 className="text-lg font-semibold text-purple-700 mt-4 mb-3">3.1 Données d'Authentification</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Nom d'utilisateur / Email</li>
            <li>Mot de passe chiffré</li>
            <li>Identifiant unique d'utilisateur</li>
            <li>Niveau d'étudiant ou rôle (professeur/admin)</li>
          </ul>

          <h3 className="text-lg font-semibold text-purple-700 mt-4 mb-3">3.2 Données d'Activité</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Sessions de cours suivies</li>
            <li>Présences enregistrées (scans QR code)</li>
            <li>Heures de check-in/check-out</li>
            <li>Horaires et plannings consultés</li>
          </ul>

          <h3 className="text-lg font-semibold text-purple-700 mt-4 mb-3">3.3 Données Techniques</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Adresse IP</li>
            <li>Type d'appareil et système d'exploitation</li>
            <li>Identifiant d'appareil</li>
            <li>Jeton de notification push (Expo Push Token)</li>
            <li>Logs d'application</li>
          </ul>

          <h3 className="text-lg font-semibold text-purple-700 mt-4 mb-3">3.4 Données de Localisation</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>Centre/Filiale sélectionné (Hay Salam, Doukkali, Saada)</li>
            <li>Localisation approximative si l'utilisateur l'autorise</li>
          </ul>

          {/* Section 4 */}
          <h2 className="text-2xl font-bold text-blue-600 mt-6 mb-4 border-l-4 border-blue-600 pl-4">
            4. Utilisation des Données
          </h2>
          <p className="text-gray-700 mb-3">Nous utilisons vos données personnelles pour :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Enregistrer et tracker votre présence aux cours</li>
            <li>Générer des rapports de fréquentation et de discipline</li>
            <li>Envoyer des notifications concernant les cours et annonces</li>
            <li>Améliorer et personnaliser votre expérience dans l'application</li>
            <li>Respecter les obligations légales et réglementaires</li>
            <li>Analyser les tendances d'utilisation et améliorer nos services</li>
            <li>Détecter et prévenir les fraudes ou abus</li>
          </ul>

          {/* Section 5 */}
          <h2 className="text-2xl font-bold text-blue-600 mt-6 mb-4 border-l-4 border-blue-600 pl-4">
            5. Sécurité des Données
          </h2>
          <p className="text-gray-700 mb-3">Nous mettons en œuvre des mesures de sécurité appropriées :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Chiffrement en transit (HTTPS/TLS)</li>
            <li>Mots de passe chiffrés avec hachage sécurisé</li>
            <li>Authentification par jeton Firebase</li>
            <li>Accès limité aux données (contrôle d'accès basé sur les rôles)</li>
            <li>Sauvegarde régulière des données</li>
          </ul>
          <p className="text-gray-700 mb-6 text-justify">
            Cependant, aucune transmission de données sur Internet n'est 100% sécurisée.
            Nous ne pouvons garantir une sécurité absolue.
          </p>

          {/* Section 6 */}
          <h2 className="text-2xl font-bold text-blue-600 mt-6 mb-4 border-l-4 border-blue-600 pl-4">
            6. Vos Droits
          </h2>
          <p className="text-gray-700 mb-3">Vous avez les droits suivants concernant vos données personnelles :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Droit d'accès :</strong> Accéder à vos données personnelles stockées</li>
            <li><strong>Droit de rectification :</strong> Corriger les données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
            <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données</li>
            <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
            <li><strong>Droit de rétractation :</strong> Retirer votre consentement pour les notifications</li>
          </ul>
          <p className="text-gray-700 mb-6">
            Pour exercer ces droits, veuillez nous contacter à <strong>privacy@intellection.ma</strong>
          </p>

          {/* Section 7 */}
          <h2 className="text-2xl font-bold text-blue-600 mt-6 mb-4 border-l-4 border-blue-600 pl-4">
            7. Contact
          </h2>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded mb-6">
            <p className="text-gray-700 mb-2"><strong>📧 Email :</strong> privacy@intellection.ma</p>
            <p className="text-gray-700 mb-2"><strong>🏢 Adresse :</strong> INTELLECTION, Maroc</p>
            <p className="text-gray-700"><strong>📱 Support :</strong> support@intellection.ma</p>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 mt-8 text-center text-gray-500 text-sm">
            <p><strong>Dernière mise à jour :</strong> 2 mars 2026</p>
            <p><strong>Version :</strong> 1.0.7</p>
            <p className="mt-4">© 2024-2026 INTELLECTION. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
