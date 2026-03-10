/**
 * DataSyncService.js (Web version)
 * Synchronize data between Web and Mobile apps
 * Handles field name conversions and validation
 */

export const DataSyncService = {
  /**
   * Normalize session data
   * Converts both old and new field names to standard format
   */
  normalizeSession(session) {
    if (!session) return null;

    return {
      // Standard fields
      level: session.level || session.niveau || 'N/A',
      subject: session.subject || session.matiere || 'N/A',
      professor: session.professor || session.professorName || 'N/A',
      groupe: session.groupe || 'N/A',
      filiale: session.filiale || 'N/A',

      // Timing
      dayOfWeek: session.dayOfWeek,
      dateString: session.dateString,
      startTime: session.startTime,
      endTime: session.endTime,

      // Status
      room: session.room,
      status: session.status || 'normal',
      period: session.period,

      // Makeup session info
      makeupDate: session.makeupDate,
      makeupTime: session.makeupTime,

      // IDs
      id: session.id,
      agentName: session.agentName,

      // Keep original
      _original: session
    };
  },

  /**
   * Validate session has required fields
   */
  validateSession(session) {
    const normalized = this.normalizeSession(session);

    const errors = [];

    if (!normalized.level || normalized.level === 'N/A') {
      errors.push('❌ Missing: level/niveau');
    }

    if (!normalized.subject || normalized.subject === 'N/A') {
      errors.push('❌ Missing: subject/matiere');
    }

    if (!normalized.professor || normalized.professor === 'N/A') {
      errors.push('❌ Missing: professor/professorName');
    }

    if (!normalized.groupe || normalized.groupe === 'N/A') {
      errors.push('❌ Missing: groupe');
    }

    if (!normalized.filiale || normalized.filiale === 'N/A') {
      errors.push('⚠️  Missing: filiale (optional for web, required for sync)');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      normalized: normalized
    };
  },

  /**
   * Create display format for session
   */
  createDisplayFormat(session) {
    const norm = this.normalizeSession(session);

    return {
      'Niveau': norm.level,
      'Matière': norm.subject,
      'Groupe': norm.groupe,
      'Professeur': norm.professor,
      'Centre': norm.filiale,
      'Salle': norm.room || 'N/A',
      'Heure': norm.startTime ? `${norm.startTime}-${norm.endTime}` : 'N/A',
      'Jour': norm.dayOfWeek !== undefined ? ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][norm.dayOfWeek] : 'N/A',
      'Statut': norm.status,
      'Agent': norm.agentName || 'Admin'
    };
  },

  /**
   * Validate sync readiness
   */
  validateSyncReadiness(sessions) {
    const results = {
      total: sessions.length,
      valid: 0,
      invalid: 0,
      issues: []
    };

    sessions.forEach((session, index) => {
      const validation = this.validateSession(session);

      if (validation.valid) {
        results.valid++;
      } else {
        results.invalid++;
        results.issues.push({
          sessionId: session.id || `Unknown_${index}`,
          errors: validation.errors
        });
      }
    });

    return results;
  },

  /**
   * Prepare sessions for mobile sync
   * Ensures all sessions have required fields
   */
  prepareForMobileSync(sessions) {
    return sessions.map(session => {
      const normalized = this.normalizeSession(session);

      // Ensure filiale is present
      const prepared = {
        ...session,
        filiale: session.filiale || 'Unknown',
        dateString: session.dateString || this.calculateDateString(session.dayOfWeek),
        // Use standard field names
        level: normalized.level,
        subject: normalized.subject,
        professor: normalized.professor,
        groupe: normalized.groupe
      };

      return prepared;
    });
  },

  /**
   * Calculate dateString from dayOfWeek (for sessions without explicit date)
   */
  calculateDateString(dayOfWeek) {
    if (typeof dayOfWeek !== 'number') return new Date().toISOString().split('T')[0];

    const today = new Date();
    const currentDay = today.getDay();
    const diff = dayOfWeek - currentDay;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);

    return targetDate.toISOString().split('T')[0];
  },

  /**
   * Generate sync report
   */
  generateSyncReport(webSessions, status = 'info') {
    const syncReadiness = this.validateSyncReadiness(webSessions);

    const report = {
      timestamp: new Date().toISOString(),
      status: status,
      summary: {
        totalSessions: syncReadiness.total,
        validSessions: syncReadiness.valid,
        invalidSessions: syncReadiness.invalid,
        syncReadyPercentage: Math.round((syncReadiness.valid / syncReadiness.total) * 100)
      },
      issues: syncReadiness.issues,
      recommendations: []
    };

    // Add recommendations
    if (syncReadiness.invalid > 0) {
      report.recommendations.push('⚠️  Fix invalid sessions before syncing with mobile');
      report.recommendations.push('📋 Check sessions missing required fields: level, subject, professor, groupe');
    }

    if (syncReadiness.syncReadyPercentage < 100) {
      report.recommendations.push('🔧 Ensure all sessions have filiale field');
      report.recommendations.push('📅 Calculate dateString for sessions');
    } else {
      report.recommendations.push('✅ All sessions ready for mobile sync!');
    }

    return report;
  },

  /**
   * Log sync status
   */
  logSyncStatus(webSessions) {
    const report = this.generateSyncReport(webSessions);

    console.log('\n═══════════════════════════════════════');
    console.log('📊 DATA SYNC STATUS REPORT');
    console.log('═══════════════════════════════════════');
    console.log(`⏰ Timestamp: ${report.timestamp}`);
    console.log(`📈 Summary:`);
    console.log(`   Total Sessions: ${report.summary.totalSessions}`);
    console.log(`   Valid Sessions: ${report.summary.validSessions}`);
    console.log(`   Invalid Sessions: ${report.summary.invalidSessions}`);
    console.log(`   Sync Ready: ${report.summary.syncReadyPercentage}%`);

    if (report.issues.length > 0) {
      console.log(`\n❌ Issues Found:`);
      report.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. Session ${issue.sessionId}:`);
        issue.errors.forEach(err => console.log(`      - ${err}`));
      });
    }

    console.log(`\n💡 Recommendations:`);
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });

    console.log('═══════════════════════════════════════\n');

    return report;
  }
};

/**
 * Usage:
 *
 * // Validate all sessions
 * const validation = DataSyncService.validateSession(session);
 * if (!validation.valid) console.error(validation.errors);
 *
 * // Prepare for mobile sync
 * const prepared = DataSyncService.prepareForMobileSync(allSessions);
 *
 * // Generate sync report
 * const report = DataSyncService.logSyncStatus(allSessions);
 */
