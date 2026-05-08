import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, AlertCircle, GripVertical } from 'lucide-react';
import { getCheckoutQuestions, saveCheckoutQuestions } from './OTPService';

const CheckoutQuestionsManager = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const loadedQuestions = await getCheckoutQuestions();
      setQuestions(loadedQuestions);
    } catch (e) {
      console.error('Error loading questions:', e);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        text: '',
        type: 'text',
        required: true,
        options: []
      }
    ]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: [...(q.options || []), ''] }
        : q
    ));
  };

  const removeOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
        : q
    ));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? {
            ...q,
            options: q.options.map((opt, i) => i === optionIndex ? value : opt)
          }
        : q
    ));
  };

  const handleSaveQuestions = async () => {
    setError('');
    setSuccess('');

    if (questions.length === 0) {
      setError('Veuillez ajouter au moins une question');
      return;
    }

    const invalidQuestions = questions.filter(q => !q.text.trim());
    if (invalidQuestions.length > 0) {
      setError('Toutes les questions doivent avoir un texte');
      return;
    }

    const invalidChoiceQuestions = questions.filter(q =>
      q.type === 'choice' && (!q.options || q.options.filter(o => o.trim()).length < 2)
    );
    if (invalidChoiceQuestions.length > 0) {
      setError('Les questions choix multiples doivent avoir au moins 2 options');
      return;
    }

    setSaving(true);
    try {
      await saveCheckoutQuestions(questions);
      setSuccess(`${questions.length} question(s) sauvegardée(s) avec succès`);
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-400">Chargement des questions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="w-6 h-6 text-teal-400" />
        <h2 className="text-2xl font-bold">Questions de Checkout</h2>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/30 border border-blue-500 rounded p-4 text-blue-200 text-sm">
        <p>
          <strong>ℹ️ Les directeurs devront répondre à ces questions avant de finaliser leur checkout.</strong>
        </p>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400 border border-gray-700">
            <p>Aucune question définie. Cliquez sur "Ajouter une question" pour en créer une.</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
              <div className="flex gap-3 items-start">
                <GripVertical className="w-5 h-5 text-gray-500 mt-2" />
                <div className="flex-1 space-y-3">
                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Question {index + 1}
                    </label>
                    <input
                      type="text"
                      value={question.text}
                      onChange={e => updateQuestion(question.id, 'text', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="Ex: Avez-vous complété l'inspection?"
                    />
                  </div>

                  {/* Type Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Type de réponse</label>
                      <select
                        value={question.type}
                        onChange={e => updateQuestion(question.id, 'type', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                      >
                        <option value="text">Texte libre</option>
                        <option value="choice">Choix multiples</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={e => updateQuestion(question.id, 'required', e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-semibold">Obligatoire</span>
                      </label>
                    </div>
                  </div>

                  {/* Options for Choice Type */}
                  {question.type === 'choice' && (
                    <div className="bg-gray-700/50 p-3 rounded space-y-2">
                      <label className="block text-sm font-semibold">Options de réponse</label>
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={e => updateOption(question.id, optIndex, e.target.value)}
                            className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <button
                            onClick={() => removeOption(question.id, optIndex)}
                            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(question.id)}
                        className="w-full bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Ajouter une option
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => removeQuestion(question.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                  title="Supprimer cette question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Question Button */}
      <button
        onClick={addQuestion}
        className="w-full bg-teal-600 hover:bg-teal-700 px-6 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Ajouter une question
      </button>

      {/* Errors and Success */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded p-3 text-red-200 flex gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-500 rounded p-3 text-green-200 text-sm">
          ✅ {success}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSaveQuestions}
        disabled={saving || questions.length === 0}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 px-6 py-3 rounded-lg transition font-semibold"
      >
        {saving ? 'Sauvegarde...' : '💾 Sauvegarder les questions'}
      </button>
    </div>
  );
};

export default CheckoutQuestionsManager;
