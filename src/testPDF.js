import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Test simple de jsPDF
console.log('=== TEST jsPDF ===');

try {
  console.log('1. jsPDF importé:', typeof jsPDF);
  
  const doc = new jsPDF();
  console.log('2. Instance jsPDF créée:', !!doc);
  
  doc.text('Test', 10, 10);
  console.log('3. Méthode text() fonctionne:', true);
  
  if (typeof doc.autoTable === 'function') {
    console.log('4. Plugin autoTable chargé:', true);
  } else {
    console.error('4. Plugin autoTable NON chargé!');
  }
  
  console.log('✅ jsPDF fonctionne correctement!');
  
} catch (error) {
  console.error('❌ Erreur jsPDF:', error);
  console.error('Stack:', error.stack);
}

console.log('===================');
