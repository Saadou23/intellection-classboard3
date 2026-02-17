import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const FormulaEditor = ({ value, onChange, onClose }) => {
  const [latex, setLatex] = useState(value || '');
  const inputRef = useRef(null);

  const mathSymbols = [
    { label: 'x²', latex: 'x^{2}', category: 'Puissances' },
    { label: 'xⁿ', latex: 'x^{n}', category: 'Puissances' },
    { label: 'eˣ', latex: 'e^{x}', category: 'Exponentielles' },
    { label: '10ˣ', latex: '10^{x}', category: 'Exponentielles' },
    
    { label: '√x', latex: '\\sqrt{x}', category: 'Racines' },
    { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', category: 'Racines' },
    
    { label: 'a/b', latex: '\\frac{a}{b}', category: 'Fractions' },
    
    { label: 'ln(x)', latex: '\\ln(x)', category: 'Logarithmes' },
    { label: 'log(x)', latex: '\\log(x)', category: 'Logarithmes' },
    
    { label: 'sin(x)', latex: '\\sin(x)', category: 'Trigonométrie' },
    { label: 'cos(x)', latex: '\\cos(x)', category: 'Trigonométrie' },
    { label: 'tan(x)', latex: '\\tan(x)', category: 'Trigonométrie' },
    
    { label: 'lim', latex: '\\lim_{x \\to a}', category: 'Limites' },
    { label: 'lim∞', latex: '\\lim_{x \\to \\infty}', category: 'Limites' },
    
    { label: '∫', latex: '\\int', category: 'Intégrales' },
    { label: '∫ₐᵇ', latex: '\\int_{a}^{b}', category: 'Intégrales' },
    
    { label: '∑', latex: '\\sum', category: 'Sommes' },
    { label: '∑ⁿᵢ₌₁', latex: '\\sum_{i=1}^{n}', category: 'Sommes' },
    
    { label: 'π', latex: '\\pi', category: 'Grecques' },
    { label: 'α', latex: '\\alpha', category: 'Grecques' },
    { label: 'β', latex: '\\beta', category: 'Grecques' },
    { label: 'θ', latex: '\\theta', category: 'Grecques' },
    { label: 'Δ', latex: '\\Delta', category: 'Grecques' },
    { label: 'Σ', latex: '\\Sigma', category: 'Grecques' },
    
    { label: '≤', latex: '\\leq', category: 'Comparaisons' },
    { label: '≥', latex: '\\geq', category: 'Comparaisons' },
    { label: '≠', latex: '\\neq', category: 'Comparaisons' },
    { label: '≈', latex: '\\approx', category: 'Comparaisons' },
    
    { label: '∞', latex: '\\infty', category: 'Autres' },
    { label: '±', latex: '\\pm', category: 'Autres' },
    { label: '×', latex: '\\times', category: 'Autres' },
    { label: '÷', latex: '\\div', category: 'Autres' },
  ];

  const categories = [...new Set(mathSymbols.map(s => s.category))];

  const insertSymbol = (symbol) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue = latex.substring(0, start) + symbol + latex.substring(end);
    
    setLatex(newValue);
    
    // Repositionner le curseur
    setTimeout(() => {
      const newPos = start + symbol.length;
      input.setSelectionRange(newPos, newPos);
      input.focus();
    }, 0);
  };

  const handleSave = () => {
    onChange(latex);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Éditeur de Formules Mathématiques</h2>
              <p className="text-purple-100 text-sm mt-1">Cliquez sur les symboles pour les insérer</p>
            </div>
            <button
              onClick={onClose}
              className="bg-purple-700 hover:bg-purple-800 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Input LaTeX */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Code LaTeX
            </label>
            <textarea
              ref={inputRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 font-mono text-sm"
              rows={4}
              placeholder="Tapez votre formule ou cliquez sur les symboles ci-dessous..."
            />
          </div>

          {/* Aperçu */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Aperçu
            </label>
            <div className="bg-white p-4 rounded border-2 border-purple-200 min-h-[80px] flex items-center justify-center">
              {latex ? (
                <div className="text-2xl" dangerouslySetInnerHTML={{ 
                  __html: renderLatexPreview(latex) 
                }} />
              ) : (
                <p className="text-gray-400 italic">L'aperçu de votre formule apparaîtra ici</p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: Pour un rendu précis, la formule sera affichée avec MathJax côté étudiant
            </p>
          </div>

          {/* Bibliothèque de symboles */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Bibliothèque de Symboles
            </label>
            
            {categories.map(category => {
              const symbols = mathSymbols.filter(s => s.category === category);
              
              return (
                <div key={category} className="mb-4">
                  <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {symbols.map((symbol, index) => (
                      <button
                        key={index}
                        onClick={() => insertSymbol(symbol.latex)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-2 border-purple-200 hover:border-purple-400 rounded-lg font-medium text-gray-700 transition-all hover:scale-105 active:scale-95"
                        title={symbol.latex}
                      >
                        {symbol.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Exemples */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-2">💡 Exemples</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded border border-blue-200">
                <code className="text-blue-600">f(x) = x^2 + 3x + 5</code>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <code className="text-blue-600">\frac{"{a + b}"}{"{c + d}"}</code>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <code className="text-blue-600">\lim_{"{x \\to 0}"} \frac{"{\\sin(x)}"}{"{x}"} = 1</code>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <code className="text-blue-600">\int_{"{a}"}^{"{b}"} f(x) dx</code>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 sticky bottom-0 bg-white pt-4 border-t-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
            >
              Insérer la Formule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonction simple de rendu LaTeX pour aperçu (très basique)
const renderLatexPreview = (latex) => {
  let html = latex;
  
  // Remplacements simples pour aperçu
  html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span style="display:inline-block;vertical-align:middle"><span style="display:block;border-bottom:1px solid black;padding:2px">$1</span><span style="display:block;padding:2px">$2</span></span>');
  html = html.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  html = html.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '<sup>$1</sup>√($2)');
  html = html.replace(/\^\\{([^}]+)\\}/g, '<sup>$1</sup>');
  html = html.replace(/\^([0-9a-z])/g, '<sup>$1</sup>');
  html = html.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
  html = html.replace(/_([0-9a-z])/g, '<sub>$1</sub>');
  html = html.replace(/\\pi/g, 'π');
  html = html.replace(/\\alpha/g, 'α');
  html = html.replace(/\\beta/g, 'β');
  html = html.replace(/\\theta/g, 'θ');
  html = html.replace(/\\Delta/g, 'Δ');
  html = html.replace(/\\Sigma/g, 'Σ');
  html = html.replace(/\\infty/g, '∞');
  html = html.replace(/\\leq/g, '≤');
  html = html.replace(/\\geq/g, '≥');
  html = html.replace(/\\neq/g, '≠');
  html = html.replace(/\\approx/g, '≈');
  html = html.replace(/\\pm/g, '±');
  html = html.replace(/\\times/g, '×');
  html = html.replace(/\\div/g, '÷');
  html = html.replace(/\\lim_\{([^}]+)\}/g, 'lim<sub>$1</sub>');
  html = html.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫<sub>$1</sub><sup>$2</sup>');
  html = html.replace(/\\int/g, '∫');
  html = html.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '∑<sub>$1</sub><sup>$2</sup>');
  html = html.replace(/\\sum/g, '∑');
  html = html.replace(/\\sin/g, 'sin');
  html = html.replace(/\\cos/g, 'cos');
  html = html.replace(/\\tan/g, 'tan');
  html = html.replace(/\\ln/g, 'ln');
  html = html.replace(/\\log/g, 'log');
  html = html.replace(/\\to/g, '→');
  
  return html;
};

export default FormulaEditor;
