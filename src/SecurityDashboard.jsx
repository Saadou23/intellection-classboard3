import React, { useState, useEffect } from 'react';
import { AlertCircle, BarChart3, Lock, Shield, Clock, Trash2 } from 'lucide-react';
import { db } from './firebase';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';

const SecurityDashboard = ({ onBack }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    failedAttempts: 0,
    successfulLogins: 0,
    blockedAttempts: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadSecurityLogs();
  }, []);

  const loadSecurityLogs = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'security_logs');
      const timeAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

      const q = query(
        logsRef,
        where('timestamp', '>=', Timestamp.fromDate(timeAgo))
      );

      const snapshot = await getDocs(q);
      const allLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })).sort((a, b) => b.timestamp - a.timestamp);

      setLogs(allLogs);

      // Calculer les statistiques
      const stats = {
        totalAttempts: allLogs.filter(l => l.type === 'login_attempt').length,
        failedAttempts: allLogs.filter(l => l.type === 'login_attempt' && !l.success).length,
        successfulLogins: allLogs.filter(l => l.type === 'login_success').length,
        blockedAttempts: allLogs.filter(l => l.type === 'blocked_attempt').length
      };

      setStats(stats);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLog = async (logId) => {
    try {
      await deleteDoc(doc(db, 'security_logs', logId));
      setLogs(logs.filter(l => l.id !== logId));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'failed') return log.type === 'login_attempt' && !log.success;
    if (filter === 'blocked') return log.type === 'blocked_attempt';
    if (filter === 'success') return log.type === 'login_success';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Chargement des logs de sécurité...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="w-10 h-10 text-blue-400" />
              Tableau de Bord Sécurité
            </h1>
            <p className="text-gray-400 mt-2">Derniers 7 jours</p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            ← Retour
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-semibold">Tentatives Totales</p>
                <p className="text-4xl font-bold mt-2">{stats.totalAttempts}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-red-900/30 border border-red-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm font-semibold">Tentatives Échouées</p>
                <p className="text-4xl font-bold mt-2">{stats.failedAttempts}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-green-900/30 border border-green-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-semibold">Connexions Réussies</p>
                <p className="text-4xl font-bold mt-2">{stats.successfulLogins}</p>
              </div>
              <Lock className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-orange-900/30 border border-orange-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-semibold">Tentatives Bloquées</p>
                <p className="text-4xl font-bold mt-2">{stats.blockedAttempts}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {['all', 'failed', 'success', 'blocked'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f === 'all' && 'Tous'}
              {f === 'failed' && 'Échouées'}
              {f === 'success' && 'Réussies'}
              {f === 'blocked' && 'Bloquées'}
            </button>
          ))}
        </div>

        {/* Tableau des logs */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900">
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Date & Heure</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Statut</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Détails</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition">
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-semibold">
                          {log.type === 'login_attempt' && 'Login'}
                          {log.type === 'login_success' && 'Success'}
                          {log.type === 'blocked_attempt' && 'Bloqué'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {log.timestamp.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        {log.success === true && (
                          <span className="px-3 py-1 bg-green-900 text-green-300 rounded text-xs font-semibold">
                            ✓ Succès
                          </span>
                        )}
                        {log.success === false && (
                          <span className="px-3 py-1 bg-red-900 text-red-300 rounded text-xs font-semibold">
                            ✗ Échoué
                          </span>
                        )}
                        {log.reason && (
                          <span className="px-3 py-1 bg-orange-900 text-orange-300 rounded text-xs font-semibold">
                            {log.reason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {log.userAgent ? (
                          <span className="text-xs">{log.userAgent.substring(0, 50)}...</span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                      Aucun log à afficher
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Avertissements */}
        {stats.failedAttempts > 10 && (
          <div className="mt-8 p-6 bg-red-900/30 border border-red-500 rounded-lg">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-300 mb-2">⚠️ Alerte Sécurité</h3>
                <p className="text-red-200">
                  Plus de 10 tentatives échouées détectées. Considérez d'améliorer la sécurité ou de vérifier une attaque brute force.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;
