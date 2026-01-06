import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Globe, BookOpen, Users, Map, CheckCircle, Circle, ArrowRight, MapPin, Mic, Languages, FileText, Volume2, Send, Menu, X, Star, Home, Info, ClipboardList, Sparkles, Zap, Shield, LogIn, UserPlus, BarChart3, Activity, Target, Clock, Calendar, TrendingUp, Award, Settings, LogOut, User, Lock, Mail, Phone, Hash, ChevronDown, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text + ' ';
        } else {
          interim += text;
        }
      }
      setTranscript(finalTranscript);
      setInterimTranscript(interim);
    };

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = (language = 'en-US') => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setTranscript('');
        setInterimTranscript('');
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return { isListening, transcript, interimTranscript, startListening, stopListening };
};


const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        // Convert to base64 for state storage
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          setAudioURL(base64data);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Auto-stop after 10 minutes (600,000ms)
      timerRef.current = setTimeout(() => {
        stopRecording();
        console.log('Recording auto-stopped after 10 minutes');
      }, 600000);

    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    } else {
      // In case state is inconsistent, still update UI
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
  };

  return { isRecording, audioURL, startRecording, stopRecording, deleteRecording, setAudioURL };
};


// Form field components
const InputField = ({ label, name, type = 'text', required = false, value, onChange, placeholder, enableSpeech = true, enableAudio = true, audioValue, onAudioChange }) => {
  const { isListening: speechListening, transcript, interimTranscript, startListening, stopListening } = useSpeechRecognition();
  const { isRecording, audioURL, startRecording, stopRecording, deleteRecording, setAudioURL } = useAudioRecorder();
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [baseValue, setBaseValue] = useState('');

  useEffect(() => {
    if (speechListening || isRecording) {
      const liveText = (transcript || '') + (interimTranscript || '');
      onChange({ target: { name, value: baseValue + liveText } });
    }
  }, [transcript, interimTranscript]);

  useEffect(() => {
    if (audioURL && onAudioChange) {
      onAudioChange(name, audioURL);
    }
  }, [audioURL]);

  const toggleVoiceInput = () => {
    if (speechListening || isRecording) {
      stopListening();
      stopRecording();
    } else {
      setBaseValue(value || '');
      // Use ur-PK for Punjabi to ensure Shahmukhi (Urdu) script output instead of Gurmukhi
      const lang = selectedLanguage === 'pa-PK' ? 'ur-PK' : selectedLanguage;
      startListening(lang);
      startRecording();
    }
  };



  return (
    <div className="relative group">
      <label className="block text-sm font-bold text-slate-700 mb-2.5 tracking-wide transition-all group-hover:text-blue-600">
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-5 py-3.5 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200 rounded-2xl focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-200/40 transition-all duration-300 hover:border-sky-300 shadow-sm hover:shadow-md pr-32"
          required={required}
          dir={(selectedLanguage === 'ur-PK' || selectedLanguage === 'pa-PK') ? 'rtl' : 'ltr'}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {(enableSpeech || enableAudio) && (
            <>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-xs border border-gray-300 rounded px-1 py-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="en-US">EN</option>
                <option value="ur-PK">اردو</option>
                <option value="pa-PK">پنجابی</option>
              </select>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-lg transition-all ${(speechListening || isRecording)
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                title={(speechListening || isRecording) ? 'Stop Voice Input' : 'Start Voice Input'}
              >
                <Mic className="w-4 h-4" />
              </button>

            </>
          )}

        </div>
      </div>
      {(audioValue || audioURL) && (
        <div className="mt-2 flex items-center space-x-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
          <audio src={audioValue || audioURL} controls className="h-8 max-w-[200px]" />
          <button
            onClick={() => {
              deleteRecording();
              if (onAudioChange) onAudioChange(name, null);
            }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete Recording"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};


const SelectField = ({ label, name, options, required = false, value, onChange }) => (
  <div className="relative group">
    <label className="block text-sm font-bold text-slate-700 mb-2.5 tracking-wide transition-all group-hover:text-blue-600">
      {label} {required && <span className="text-amber-500">*</span>}
    </label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      className="w-full px-5 py-3.5 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200 rounded-2xl focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-200/40 transition-all duration-300 hover:border-sky-300 appearance-none cursor-pointer shadow-sm hover:shadow-md"
      required={required}
    >
      <option value="">Select...</option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const CheckboxGroup = ({ label, options, name, values = [], onChange }) => (
  <div className="space-y-3">
    <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide">{label}</label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((option, idx) => (
        <label key={idx} className="flex items-center space-x-3 p-3.5 bg-gradient-to-r from-white to-sky-50/50 border border-sky-200/50 rounded-xl hover:from-sky-50 hover:to-blue-50 hover:border-sky-300 transition-all cursor-pointer group shadow-sm hover:shadow-md">
          <input
            type="checkbox"
            value={option}
            checked={values.includes(option)}
            onChange={(e) => {
              const newValues = e.target.checked
                ? [...values, option]
                : values.filter(v => v !== option);
              onChange({ target: { name, value: newValues } });
            }}
            className="w-5 h-5 text-sky-600 rounded-lg focus:ring-sky-500 transition-all border-2 border-blue-300"
          />
          <span className="text-gray-700 group-hover:text-blue-700 transition-colors font-medium">{option}</span>
        </label>
      ))}
    </div>
  </div>
);

const TextAreaField = ({ label, name, required = false, value, onChange, rows = 4, placeholder, enableSpeech = true, enableAudio = true, audioValue, onAudioChange }) => {
  const { isListening: speechListening, transcript, interimTranscript, startListening, stopListening } = useSpeechRecognition();
  const { isRecording, audioURL, startRecording, stopRecording, deleteRecording, setAudioURL } = useAudioRecorder();
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [baseValue, setBaseValue] = useState('');

  useEffect(() => {
    if (speechListening || isRecording) {
      const liveText = (transcript || '') + (interimTranscript || '');
      onChange({ target: { name, value: baseValue + liveText } });
    }
  }, [transcript, interimTranscript]);

  useEffect(() => {
    if (audioURL && onAudioChange) {
      onAudioChange(name, audioURL);
    }
  }, [audioURL]);

  const toggleVoiceInput = () => {
    if (speechListening || isRecording) {
      stopListening();
      stopRecording();
    } else {
      setBaseValue(value || '');
      // Use ur-PK for Punjabi to ensure Shahmukhi (Urdu) script output instead of Gurmukhi
      const lang = selectedLanguage === 'pa-PK' ? 'ur-PK' : selectedLanguage;
      startListening(lang);
      startRecording();
    }
  };



  return (
    <div className="relative group">
      <label className="block text-sm font-bold text-slate-700 mb-2.5 tracking-wide transition-all group-hover:text-blue-600">
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      <div className="relative">
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-5 py-3.5 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200 rounded-2xl focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-200/40 transition-all duration-300 hover:border-sky-300 resize-none shadow-sm hover:shadow-md pr-32"
          required={required}
          dir={(selectedLanguage === 'ur-PK' || selectedLanguage === 'pa-PK') ? 'rtl' : 'ltr'}
        />
        <div className="absolute right-2 top-4 flex items-center space-x-1">
          {(enableSpeech || enableAudio) && (
            <>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-xs border border-gray-300 rounded px-1 py-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="en-US">EN</option>
                <option value="ur-PK">اردو</option>
                <option value="pa-PK">پنجابی</option>
              </select>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-lg transition-all ${(speechListening || isRecording)
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                title={(speechListening || isRecording) ? 'Stop Voice Input' : 'Start Voice Input'}

              >
                <Mic className="w-4 h-4" />
              </button>
            </>
          )}

        </div>
      </div>
      {(audioValue || audioURL) && (
        <div className="mt-2 flex items-center space-x-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
          <audio src={audioValue || audioURL} controls className="h-8 max-w-[200px]" />
          <button
            onClick={() => {
              deleteRecording();
              if (onAudioChange) onAudioChange(name, null);
            }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete Recording"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};


const FormCSection = ({ surveyData, setSurveyData, setFormCComplete, setCurrentSection }) => {
  const [formData, setFormData] = useState(surveyData.formC);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAudioChange = (name, audioURL) => {
    setFormData({
      ...formData,
      [`${name}_audio`]: audioURL
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSurveyData({ ...surveyData, formC: formData });
    setFormCComplete(true);
    setCurrentSection('newSurvey');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-2">Form C - Community Leader Interview</h2>
              <p className="text-gray-600">For Language Activist or Village Head</p>
            </div>
            <button
              onClick={() => setCurrentSection('newSurvey')}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-all flex items-center space-x-2 text-sm font-semibold"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Main Menu</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-emerald-700 border-b-2 border-emerald-200 pb-2">
                C1. Basic Information
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Your Role/Position"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="E.g., Village Head, Language Activist"
                  required
                />
                <InputField
                  label="Years in this role"
                  name="yearsInRole"
                  type="number"
                  value={formData.yearsInRole}
                  onChange={handleInputChange}
                  audioValue={formData.yearsInRole_audio}
                  onAudioChange={handleAudioChange}
                />

              </div>

              <TextAreaField
                label="Other ethnic groups residing in your area"
                name="otherEthnicGroups"
                value={formData.otherEthnicGroups}
                onChange={handleInputChange}
                rows={3}
                placeholder="List ethnic groups and their languages"
              />
            </div>

            {/* Language Preservation Views */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-emerald-700 border-b-2 border-emerald-200 pb-2">
                Language Preservation & Promotion
              </h3>

              <TextAreaField
                label="Do you think something should be done to preserve or promote your mother tongue? Why?"
                name="preservationNeed"
                value={formData.preservationNeed}
                onChange={handleInputChange}
                rows={4}
                required
              />

              <TextAreaField
                label="What ways are most effective for supporting preservation and promotion?"
                name="effectiveWays"
                value={formData.effectiveWays}
                onChange={handleInputChange}
                rows={4}
                required
              />

              <TextAreaField
                label="Do you think a script can play a role in language preservation? Why?"
                name="scriptRole"
                value={formData.scriptRole}
                onChange={handleInputChange}
                rows={3}
              />

              <TextAreaField
                label="What benefits can a dictionary provide? Why should it be compiled?"
                name="dictionaryBenefits"
                value={formData.dictionaryBenefits}
                onChange={handleInputChange}
                rows={3}
              />

              <TextAreaField
                label="Why is writing a grammar book important?"
                name="grammarImportance"
                value={formData.grammarImportance}
                onChange={handleInputChange}
                rows={3}
              />

              <TextAreaField
                label="Why should people be encouraged to write literature in their mother tongue?"
                name="literatureEncouragement"
                value={formData.literatureEncouragement}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            {/* Language in Education */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-emerald-700 border-b-2 border-emerald-200 pb-2">
                Language in Education & Administration
              </h3>

              <TextAreaField
                label="Why should mother tongue be used as medium of instruction at primary level?"
                name="motherTongueEducation"
                value={formData.motherTongueEducation}
                onChange={handleInputChange}
                rows={4}
                required
              />

              <TextAreaField
                label="Which language should be used in administration? What benefits would mother tongue bring?"
                name="administrationLanguage"
                value={formData.administrationLanguage}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-8">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <span>Complete Form C</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


const OpenEndedSection = ({ surveyData, setSurveyData, setCurrentSection }) => {
  const [responses, setResponses] = useState(surveyData.openEndedQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    "Please sing a song in your own language.",
    "How do you do your laundry (the process of washing clothes)?",
    "Do you remember any childhood lullaby your mom used to sing? If yes, please sing it for us.",
    "Please talk about the marriage rituals of your community or culture.",
    "In your culture, do you allow women or girls to go out in markets or to schools and colleges? If not, then why?",
    "How do you spend time with your friends? And how often?",
    "Please recall any folk story your grandparents used to tell and narrate.",
    "Can you talk about any home remedies your mom and grandmother do when someone gets ill?",
    "How do you celebrate Eid-ul-fitr or a religious festival?",
    "Please tell us about your school life.",
    "Can you narrate any famous story in your own language?",
    "What do you say about the younger generation about values?",
    "In which season do you feel good?",
    "Tell any incident that changed your life?",
    "How do you see your future?",
    "Tell us about your childhood.",
    "What kind of games you used to play in your childhood?",
    "Tell one proverb or joke everyone knows here.",
    "What activities do you do in your daily life?",
    "How do you start your day?"
  ];

  const handleAudioChange = (audioURL) => {
    setResponses({
      ...responses,
      [`question_${currentQuestion}_audio`]: audioURL
    });
  };

  const handleResponseChange = (value) => {
    setResponses({
      ...responses,
      [`question_${currentQuestion}`]: value
    });
  };


  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleComplete = () => {
    setSurveyData({ ...surveyData, openEndedQuestions: responses });
    setCurrentSection('newSurvey');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-2">Open-Ended Corpus Questions</h2>
              <p className="text-gray-600">Please answer in your native language</p>
            </div>
            <button
              onClick={() => setCurrentSection('newSurvey')}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-all flex items-center space-x-2 text-sm font-semibold"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Main Menu</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between mb-8">
            <span className="text-sm text-gray-600">Question {currentQuestion + 1} of {questions.length}</span>
            <div className="h-2 flex-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500`}
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="p-6 bg-emerald-50 rounded-2xl">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {currentQuestion + 1}
                </div>
                <p className="text-lg text-gray-800 font-medium flex-1">{questions[currentQuestion]}</p>
              </div>

              <div className="flex items-center space-x-3 mb-4">
                <Mic className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-600">You can record or type your response</span>
              </div>

              <TextAreaField
                label=""
                name={`question_${currentQuestion}`}
                value={responses[`question_${currentQuestion}`] || ''}
                onChange={(e) => handleResponseChange(e.target.value)}
                audioValue={responses[`question_${currentQuestion}_audio`]}
                onAudioChange={(_, url) => handleAudioChange(url)}
                rows={8}
                placeholder="Type your response here in your native language..."
                enableSpeech={true}
              />

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${currentQuestion === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {[...Array(Math.min(5, questions.length))].map((_, idx) => {
                  const questionIdx = Math.max(0, Math.min(currentQuestion - 2, questions.length - 5)) + idx;
                  if (questionIdx >= questions.length) return null;
                  return (
                    <button
                      key={questionIdx}
                      onClick={() => setCurrentQuestion(questionIdx)}
                      className={`w-10 h-10 rounded-full transition-all ${questionIdx === currentQuestion
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                        : responses[`question_${questionIdx}`]
                          ? 'bg-emerald-200 text-emerald-700'
                          : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                      {questionIdx + 1}
                    </button>
                  );
                })}
              </div>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Finish Corpus</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



// Translation Input Component with Speech Recognition
const TranslationInput = ({ word, value, onChange, audioValue, onAudioChange }) => {
  const { isListening: speechListening, transcript, interimTranscript, startListening, stopListening } = useSpeechRecognition();
  const { isRecording, audioURL, startRecording, stopRecording, deleteRecording, setAudioURL } = useAudioRecorder();
  const [selectedLanguage, setSelectedLanguage] = useState('ur-PK');
  const [baseValue, setBaseValue] = useState('');

  useEffect(() => {
    if (speechListening || isRecording) {
      const liveText = (transcript || '') + (interimTranscript || '');
      onChange(word, baseValue + liveText);
    }
  }, [transcript, interimTranscript]);

  useEffect(() => {
    if (audioURL && onAudioChange) {
      onAudioChange(word, audioURL);
    }
  }, [audioURL]);

  const toggleVoiceInput = () => {
    if (speechListening || isRecording) {
      stopListening();
      stopRecording();
    } else {
      setBaseValue(value || '');
      // Use ur-PK for Punjabi to ensure Shahmukhi (Urdu) script output instead of Gurmukhi
      const lang = selectedLanguage === 'pa-PK' ? 'ur-PK' : selectedLanguage;
      startListening(lang);
      startRecording();
    }
  };



  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(word, e.target.value)}
          placeholder="Translation..."
          className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all pr-10"
          dir={selectedLanguage === 'ur-PK' ? 'rtl' : 'ltr'}
        />
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="text-xs border border-gray-300 rounded px-1 py-0.5"
        >
          <option value="ur-PK">اردو</option>
          <option value="en-US">EN</option>
          <option value="pa-PK">پنجابی</option>
          <option value="sd-PK">سنڌي</option>
          <option value="ps-PK">پښتو</option>
        </select>
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-2 rounded-lg transition-all ${(speechListening || isRecording)
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          title={(speechListening || isRecording) ? 'Stop Voice Input' : 'Start Voice Input'}
        >
          <Mic className="w-4 h-4" />
        </button>

      </div>
      {(audioValue || audioURL) && (
        <div className="flex items-center space-x-2 p-1.5 bg-emerald-50 rounded-lg border border-emerald-100 self-start">
          <audio src={audioValue || audioURL} controls className="h-7 max-w-[150px]" />
          <button
            onClick={() => {
              deleteRecording();
              if (onAudioChange) onAudioChange(word, null);
            }}
            className="p-1 px-2 text-red-500 hover:bg-red-50 rounded transition-all text-xs font-bold"
          >
            Clear Audio
          </button>
        </div>
      )}
    </div>
  );
};


const WordListSection = ({ surveyData, setSurveyData, setFormAComplete, setFormBComplete, setFormCComplete, setCurrentSection, completeSurvey }) => {
  const [translations, setTranslations] = useState(surveyData.wordTranslations);
  const [currentPage, setCurrentPage] = useState(0);
  const wordsPerPage = 20;


  const words = [
    "Body", "Head", "Hair", "Face", "Eye", "Ear", "Nose", "Mouth", "Teeth", "Tongue",
    "Belly", "Arm/Hand", "Elbow", "Palm", "Finger", "Leg", "Skin", "Bone", "Heart", "Blood",
    "Village", "House", "Roof", "Door", "Firewood", "Broom", "Mortar", "Pestle", "Hammer", "Knife",
    "Axe", "Rope", "Thread", "Needle", "Cloth", "Ring", "Sun", "Moon", "Sky", "Star",
    "Rain", "Water", "River", "Cloud", "Lightning", "Rainbow", "Wind", "Stone", "Path", "Sand",
    "Fire", "Smoke", "Ash", "Mud", "Dust", "Gold", "Tree", "Leaf", "Root", "Thorn",
    "Flower", "Fruit", "Mango", "Banana", "Wheat", "Barley", "Rice", "Potato", "Eggplant", "Groundnut",
    "Chili", "Turmeric", "Garlic", "Onion", "Cauliflower", "Tomato", "Cabbage", "Oil", "Salt", "Meat",
    "Fat", "Fish", "Chicken", "Egg", "Cow", "Buffalo", "Milk", "Horns", "Tail", "Goat",
    "Dog", "Snake", "Monkey", "Mosquito", "Ant", "Spider", "Name", "Man", "Woman", "Child",
    "Father", "Mother", "Older Brother", "Younger Brother", "Older Sister", "Younger Sister", "Son", "Daughter", "Husband", "Wife",
    "Boy", "Girl", "Day", "Night", "Morning", "Noon", "Evening", "Yesterday", "Today", "Tomorrow",
    "Week", "Month", "Year", "Old", "New", "Good", "Bad", "Wet", "Dry", "Long",
    "Short", "Hot", "Cold", "Right", "Left", "Near", "Far", "Big", "Small", "Heavy",
    "Light", "Above", "Below", "White", "Black", "Red", "One", "Two", "Three", "Four",
    "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Twenty", "Hundred",
    "Who", "What", "Where", "When", "How", "Many", "Which", "This", "That", "These",
    "Those", "Same", "Different", "Whole", "Broken", "Few", "Many", "All", "Eat", "Bite",
    "Hungry", "Drink", "Thirsty", "Sleep", "Lie", "Sit", "Give", "Burn", "Die", "Kill",
    "Fly", "Walk", "Run", "Go", "Come", "Speak", "Hear", "Look", "I", "You (informal)",
    "You (formal)", "He", "She", "We", "They", "You (plural)", "Autumn", "Spring", "Summer", "Winter",
    "Rain", "Thousand", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "East",
    "West", "North", "South", "Bread", "Fruit", "Breakfast", "Dinner", "Lunch", "Dawn", "Morning",
    "Afternoon", "Evening", "Night"
  ];

  const totalPages = Math.ceil(words.length / wordsPerPage);
  const currentWords = words.slice(currentPage * wordsPerPage, (currentPage + 1) * wordsPerPage);

  const handleTranslationChange = (word, value) => {
    setTranslations({
      ...translations,
      [word]: value
    });
  };

  const handleComplete = () => {
    setSurveyData({ ...surveyData, wordTranslations: translations });
    completeSurvey();
    alert('Survey Complete! Thank you for your participation in documenting Pakistani languages.');
    setFormAComplete(false);
    setFormBComplete(false);
    setFormCComplete(false);
    setCurrentSection('newSurvey');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-2">Word Translation List</h2>
              <p className="text-gray-600">Please provide translations in your native language</p>
            </div>
            <button
              onClick={() => setCurrentSection('newSurvey')}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-all flex items-center space-x-2 text-sm font-semibold"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Main Menu</span>
            </button>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 mb-6">
            <p className="text-sm text-emerald-800">
              <Info className="w-4 h-4 inline mr-1" />
              Click the microphone icon next to each word to use voice input. Select your language first.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between mb-6">
            <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
            <div className="h-2 flex-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500`}
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}></div>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {currentWords.map((word, idx) => (
              <div key={word} className="flex items-center space-x-4 p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all group">
                <span className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {currentPage * wordsPerPage + idx + 1}
                </span>
                <div className="font-medium text-gray-800 w-32">{word}</div>
                <div className="flex-1">
                  <TranslationInput
                    word={word}
                    value={translations[word]}
                    onChange={handleTranslationChange}
                    audioValue={translations[`${word}_audio`]}
                    onAudioChange={(w, url) => {
                      setTranslations({
                        ...translations,
                        [`${w}_audio`]: url
                      });
                    }}
                  />

                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${currentPage === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {[...Array(Math.min(7, totalPages))].map((_, idx) => {
                const pageIdx = Math.max(0, Math.min(currentPage - 3, totalPages - 7)) + idx;
                if (pageIdx >= totalPages) return null;
                return (
                  <button
                    key={pageIdx}
                    onClick={() => setCurrentPage(pageIdx)}
                    className={`w-10 h-10 rounded-full transition-all ${pageIdx === currentPage
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-emerald-100'
                      }`}
                  >
                    {pageIdx + 1}
                  </button>
                );
              })}
            </div>

            {currentPage < totalPages - 1 ? (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Complete Survey</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const ParticipantSection = ({ personNum, responses, onResponseChange, onAudioChange }) => {
  const personKey = `person_${personNum}`;


  return (
    <div className="p-6 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 rounded-2xl border-2 border-teal-200">
      <h4 className="text-lg font-bold text-teal-800 mb-4 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
          {personNum}
        </div>
        Person {personNum}
      </h4>

      <div className="space-y-4">
        {/* Participant Name */}
        <InputField
          label={`Name of Participant ${personNum}`}
          name={`${personKey}_name`}
          value={responses.name || ''}
          onChange={(e) => onResponseChange(personKey, 'name', e.target.value)}
          audioValue={responses.name_audio}
          onAudioChange={(name, url) => onAudioChange(personKey, 'name', url)}
          placeholder="Enter participant name"
          enableSpeech={true}
        />


        {/* Question 1: Mother Tongue Occasions */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-teal-700">
            Q1: On which occasions do you usually speak your mother tongue?
          </label>
          <TextAreaField
            label=""
            name={`${personKey}_motherTongue`}
            value={responses.motherTongueOccasions || ''}
            onChange={(e) => onResponseChange(personKey, 'motherTongueOccasions', e.target.value)}
            audioValue={responses.motherTongueOccasions_audio}
            onAudioChange={(name, url) => onAudioChange(personKey, 'motherTongueOccasions', url)}
            rows={3}
            placeholder={`Person ${personNum}'s response about mother tongue usage...`}
            enableSpeech={true}
          />

        </div>

        {/* Question 2: Language of Wider Communication */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-teal-700">
            Q2: On which occasions do you use the language of wider communication?
          </label>
          <TextAreaField
            label=""
            name={`${personKey}_lwc`}
            value={responses.lwcOccasions || ''}
            onChange={(e) => onResponseChange(personKey, 'lwcOccasions', e.target.value)}
            audioValue={responses.lwcOccasions_audio}
            onAudioChange={(name, url) => onAudioChange(personKey, 'lwcOccasions', url)}
            rows={3}
            placeholder={`Person ${personNum}'s response about LWC usage...`}
            enableSpeech={true}
          />

        </div>

        {/* Question 3: Language Regions */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-teal-700">
            Q3: Name all the Districts/Villages where your language is spoken
          </label>
          <TextAreaField
            label=""
            name={`${personKey}_regions`}
            value={responses.languageRegions || ''}
            onChange={(e) => onResponseChange(personKey, 'languageRegions', e.target.value)}
            audioValue={responses.languageRegions_audio}
            onAudioChange={(name, url) => onAudioChange(personKey, 'languageRegions', url)}
            rows={3}
            placeholder={`Person ${personNum}'s response about language regions...`}
            enableSpeech={true}
          />

        </div>

        {/* Question 4: Similar Languages */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-teal-700">
            Q4: What other languages are similar to yours?
          </label>
          <TextAreaField
            label=""
            name={`${personKey}_similar`}
            value={responses.similarLanguages || ''}
            onChange={(e) => onResponseChange(personKey, 'similarLanguages', e.target.value)}
            audioValue={responses.similarLanguages_audio}
            onAudioChange={(name, url) => onAudioChange(personKey, 'similarLanguages', url)}
            rows={3}
            placeholder={`Person ${personNum}'s response about similar languages...`}
            enableSpeech={true}
          />

        </div>

        {/* Question 5: Top Two Languages */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-teal-700">
            Q5: What are the two languages your community speaks the most?
          </label>
          <TextAreaField
            label=""
            name={`${personKey}_topTwo`}
            value={responses.topTwoLanguages || ''}
            onChange={(e) => onResponseChange(personKey, 'topTwoLanguages', e.target.value)}
            audioValue={responses.topTwoLanguages_audio}
            onAudioChange={(name, url) => onAudioChange(personKey, 'topTwoLanguages', url)}
            rows={2}
            placeholder={`Person ${personNum}'s response about top languages...`}
            enableSpeech={true}
          />

        </div>

        {/* Question 6: Language Pride */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-emerald-700">
            Q6: Describe something that made you proud of your language or culture
          </label>
          <TextAreaField
            label=""
            name={`${personKey}_pride`}
            value={responses.languagePride || ''}
            onChange={(e) => onResponseChange(personKey, 'languagePride', e.target.value)}
            audioValue={responses.languagePride_audio}
            onAudioChange={(name, url) => onAudioChange(personKey, 'languagePride', url)}
            rows={3}
            placeholder={`Person ${personNum}'s response about language pride...`}
            enableSpeech={true}
          />

        </div>

        {/* Question 7: Language Dreams */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-emerald-700">
            Q7: What are your dreams for your language?
          </label>
          <TextAreaField
            label=""
            name={`${personKey}_dreams`}
            value={responses.languageDreams || ''}
            onChange={(e) => onResponseChange(personKey, 'languageDreams', e.target.value)}
            audioValue={responses.languageDreams_audio}
            onAudioChange={(name, url) => onAudioChange(personKey, 'languageDreams', url)}
            rows={3}
            placeholder={`Person ${personNum}'s vision for their language...`}
            enableSpeech={true}
          />
        </div>

      </div>
    </div>
  );
};

const FormBSection = ({ surveyData, setSurveyData, setFormBComplete, setCurrentSection }) => {
  const [formData, setFormData] = useState(surveyData.formB || {});
  const [participantCount, setParticipantCount] = useState(formData.participantCount || 1);
  const [participantResponses, setParticipantResponses] = useState(formData.participantResponses || {});


  // Initialize participant responses when count changes
  useEffect(() => {
    const newResponses = { ...participantResponses };
    for (let i = 1; i <= participantCount; i++) {
      if (!newResponses[`person_${i}`]) {
        newResponses[`person_${i}`] = {
          name: '',
          motherTongueOccasions: '',
          lwcOccasions: '',
          languageRegions: '',
          similarLanguages: '',
          topTwoLanguages: '',
          languagePride: '',
          languageDreams: ''
        };
      }
    }
    // Remove extra participants if count decreased
    Object.keys(newResponses).forEach(key => {
      const personNum = parseInt(key.split('_')[1]);
      if (personNum > participantCount) {
        delete newResponses[key];
      }
    });
    setParticipantResponses(newResponses);
  }, [participantCount]);

  const addParticipant = () => {
    if (participantCount < 20) {
      setParticipantCount(prev => prev + 1);
    }
  };

  const removeParticipant = (personNum) => {
    if (participantCount > 1) {
      const newResponses = { ...participantResponses };
      delete newResponses[`person_${personNum}`];

      // Shift remaining participants up if necessary
      const shiftedResponses = {};
      let nextIdx = 1;
      for (let i = 1; i <= participantCount; i++) {
        if (i !== personNum) {
          shiftedResponses[`person_${nextIdx}`] = newResponses[`person_${i}`];
          nextIdx++;
        }
      }

      setParticipantResponses(shiftedResponses);
      setParticipantCount(prev => prev - 1);
    }
  };

  const handleInputChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAudioChange = (name, audioURL) => {
    setFormData({
      ...formData,
      [`${name}_audio`]: audioURL
    });
  };

  const handleParticipantResponseChange = (personKey, field, value) => {
    setParticipantResponses({
      ...participantResponses,
      [personKey]: {
        ...participantResponses[personKey],
        [field]: value
      }
    });
  };

  const handleParticipantAudioChange = (personKey, field, audioURL) => {
    setParticipantResponses({
      ...participantResponses,
      [personKey]: {
        ...participantResponses[personKey],
        [`${field}_audio`]: audioURL
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSurveyData({
      ...surveyData,
      formB: {
        ...formData,
        participantCount,
        participantResponses
      }
    });
    setFormBComplete(true);
    setCurrentSection('newSurvey');
  };


  // Component for individual participant section

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-teal-800 mb-2">Form B - Participatory Method</h2>
              <p className="text-gray-600">Group Discussion & Community Mapping</p>
            </div>
            <button
              onClick={() => setCurrentSection('newSurvey')}
              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl transition-all flex items-center space-x-2 text-sm font-semibold"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Main Menu</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Meta Data */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-emerald-700 border-b-2 border-emerald-200 pb-2">
                B1. Meta Data
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2.5">
                    Participants Statistics
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                    <Users className="w-5 h-5 text-teal-600" />
                    <span className="text-lg font-bold text-teal-800">
                      {participantCount} Participant{participantCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>


                <InputField
                  label="Group Discussion Date"
                  name="discussionDate"
                  type="date"
                  value={formData.discussionDate}
                  onChange={handleInputChange}
                  required
                  enableSpeech={false}
                />

                <InputField
                  label="Discussion Location"
                  name="discussionLocation"
                  value={formData.discussionLocation}
                  onChange={handleInputChange}
                  audioValue={formData.discussionLocation_audio}
                  onAudioChange={handleAudioChange}
                  placeholder="Village/City name"
                  required
                  enableSpeech={true}
                />

              </div>
            </div>

            {/* Dynamic Participant Sections */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-emerald-700 border-b-2 border-emerald-200 pb-2">
                B2. Individual Participant Responses
              </h3>

              {/* Quick Stats */}
              <div className="p-4 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-teal-600" />
                    <span className="font-bold text-teal-800">
                      Recording responses for {participantCount} participant{participantCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-teal-600">
                    Total questions per person: 7
                  </div>
                </div>
              </div>

              {/* Render participant sections */}
              <div className="space-y-6">
                {[...Array(participantCount)].map((_, index) => (
                  <div key={`person_${index + 1}`} className="relative group/participant">
                    <ParticipantSection
                      personNum={index + 1}
                      responses={participantResponses[`person_${index + 1}`] || {}}
                      onResponseChange={handleParticipantResponseChange}
                      onAudioChange={handleParticipantAudioChange}
                    />
                    {participantCount > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index + 1)}
                        className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/participant:opacity-100 flex items-center space-x-1 text-xs font-bold"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Participant Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={addParticipant}
                  disabled={participantCount >= 20}
                  className="px-8 py-4 bg-white border-2 border-dashed border-teal-300 text-teal-600 rounded-2xl font-bold hover:bg-teal-50 hover:border-teal-500 transition-all flex items-center space-x-3 group"
                >
                  <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all">
                    <Users className="w-5 h-5" />
                  </div>
                  <span>Add New Participant Form</span>
                  <div className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                    {participantCount}/20
                  </div>
                </button>
              </div>
            </div>


            {/* Group Summary (Optional) */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-emerald-700 border-b-2 border-emerald-200 pb-2">
                B3. Group Consensus Summary (Optional)
              </h3>

              <TextAreaField
                label="Overall group consensus or additional observations"
                name="groupConsensus"
                value={formData.groupConsensus}
                onChange={handleInputChange}
                audioValue={formData.groupConsensus_audio}
                onAudioChange={handleAudioChange}
                rows={4}
                placeholder="Summarize any consensus reached or notable disagreements..."
                enableSpeech={true}
              />

            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-8">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <span>Complete Form B</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};



const FormASection = ({ surveyData, setSurveyData, setFormAComplete, setCurrentSection, currentFormStep }) => {
  const [formData, setFormData] = useState(surveyData.formA);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAudioChange = (name, audioURL) => {
    setFormData({
      ...formData,
      [`${name}_audio`]: audioURL
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSurveyData({ ...surveyData, formA: formData });
    setFormAComplete(true);
    setCurrentSection('newSurvey');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-2">Form A - Sociolinguistic Questionnaire</h2>
              <p className="text-gray-600">Individual Interview</p>
            </div>
            <button
              onClick={() => setCurrentSection('newSurvey')}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-all flex items-center space-x-2 text-sm font-semibold"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Main Menu</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between mb-8">
            <span className="text-sm text-gray-600">Progress</span>
            <div className="h-2 flex-1 mx-4 bg-emerald-100 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 shadow-lg`}
                style={{ width: `${(currentFormStep / 5) * 100}%` }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Meta Data Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-emerald-200 pb-3">
                A1. Meta Data (Baseline Information)
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Interview Number"
                  name="interviewNumber"
                  value={formData.interviewNumber}
                  onChange={handleInputChange}
                  enableSpeech={false}
                  enableAudio={false}
                  required
                />

                <InputField
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Union Council"
                  name="unionCouncil"
                  value={formData.unionCouncil}
                  onChange={handleInputChange}
                  audioValue={formData.unionCouncil_audio}
                  onAudioChange={handleAudioChange}
                  placeholder="Enter union council name"
                />

                <InputField
                  label="Ward Number"
                  name="wardNumber"
                  value={formData.wardNumber}
                  onChange={handleInputChange}
                  placeholder="Enter ward number"
                />
                <InputField
                  label="Village/Town"
                  name="villageTown"
                  value={formData.villageTown}
                  onChange={handleInputChange}
                  audioValue={formData.villageTown_audio}
                  onAudioChange={handleAudioChange}
                  required
                  placeholder="Enter village or town name"
                />

                <InputField
                  label="District"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  audioValue={formData.district_audio}
                  onAudioChange={handleAudioChange}
                  required
                  placeholder="Enter district name"
                />

                <InputField
                  label="GPS Coordinates (East)"
                  name="gpsEast"
                  value={formData.gpsEast}
                  onChange={handleInputChange}
                  audioValue={formData.gpsEast_audio}
                  onAudioChange={handleAudioChange}
                  placeholder="E.g., 74.3587"
                />

                <InputField
                  label="GPS Coordinates (North)"
                  name="gpsNorth"
                  value={formData.gpsNorth}
                  onChange={handleInputChange}
                  audioValue={formData.gpsNorth_audio}
                  onAudioChange={handleAudioChange}
                  placeholder="E.g., 31.5204"
                />

              </div>

              <TextAreaField
                label="Interviewer Names"
                name="interviewerNames"
                value={formData.interviewerNames}
                onChange={handleInputChange}
                audioValue={formData.interviewerNames_audio}
                onAudioChange={handleAudioChange}
                rows={3}
                placeholder="Enter all interviewer names (one per line)"
              />


              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Language of Elicitation"
                  name="languageElicitation"
                  value={formData.languageElicitation}
                  onChange={handleInputChange}
                  audioValue={formData.languageElicitation_audio}
                  onAudioChange={handleAudioChange}
                  placeholder="E.g., Urdu, English"
                />
                <InputField
                  label="Language of Response"
                  name="languageResponse"
                  value={formData.languageResponse}
                  onChange={handleInputChange}
                  audioValue={formData.languageResponse_audio}
                  onAudioChange={handleAudioChange}
                  placeholder="E.g., Punjabi, Sindhi"
                />
              </div>

            </div>

            {/* Consultant Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-emerald-200 pb-3">
                Language Consultant Information
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Name of Language Consultant"
                  name="consultantName"
                  value={formData.consultantName}
                  onChange={handleInputChange}
                  required
                />
                <SelectField
                  label="Sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  options={['Male', 'Female', 'Other']}
                  required
                />
                <SelectField
                  label="Age Group"
                  name="ageGroup"
                  value={formData.ageGroup}
                  onChange={handleInputChange}
                  options={['15-34', '35-60', '60+']}
                  required
                />
                <SelectField
                  label="Are you literate?"
                  name="literate"
                  value={formData.literate}
                  onChange={handleInputChange}
                  options={['Yes', 'No']}
                />
                <SelectField
                  label="Education Level"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleInputChange}
                  options={['Primary', 'Lower Secondary', 'Secondary', 'Higher']}
                />
                <SelectField
                  label="Marital Status"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  options={['Married', 'Unmarried']}
                />
                <InputField
                  label="Ethnic Group"
                  name="ethnicGroup"
                  value={formData.ethnicGroup}
                  onChange={handleInputChange}
                  placeholder="Enter ethnic group"
                />
                <SelectField
                  label="Religion"
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  options={['Islam', 'Hinduism', 'Christianity', 'Sikhism', 'Other']}
                />
              </div>
            </div>

            {/* Language Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-emerald-200 pb-3">
                Language Information
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Your Mother Tongue"
                  name="motherTongue"
                  value={formData.motherTongue}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your mother tongue"
                />
                <InputField
                  label="Name given by non-native speakers"
                  name="nonNativeName"
                  value={formData.nonNativeName}
                  onChange={handleInputChange}
                  placeholder="What others call your language"
                />
                <InputField
                  label="Mother's Mother Tongue"
                  name="motherMotherTongue"
                  value={formData.motherMotherTongue}
                  onChange={handleInputChange}
                />
                <InputField
                  label="Father's Mother Tongue"
                  name="fatherMotherTongue"
                  value={formData.fatherMotherTongue}
                  onChange={handleInputChange}
                />
              </div>

              <TextAreaField
                label="Different names of the language (if any)"
                name="languageAliases"
                value={formData.languageAliases}
                onChange={handleInputChange}
                rows={2}
                placeholder="Enter any alternative names for your language"
              />
            </div>

            {/* Language Resources */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-emerald-200 pb-3">
                A2. Language Resources
              </h3>

              <CheckboxGroup
                label="What are the major kinds of oral literature available in your language?"
                name="oralLiterature"
                options={['Folk tales', 'Songs', 'Religious literature', 'Jokes', 'Idioms/Proverbs', 'Poetry', 'Riddles', 'Other']}
                values={formData.oralLiterature || []}
                onChange={handleInputChange}
              />

              <TextAreaField
                label="What materials are written about your language?"
                name="writtenMaterials"
                value={formData.writtenMaterials}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe any written materials in your language"
              />
            </div>

            {/* Technology & Digital Resources */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-emerald-200 pb-3">
                A8. Technology & Digital Resources
              </h3>

              <CheckboxGroup
                label="Which digital devices do you personally use?"
                name="digitalDevices"
                options={['Basic phone', 'Smartphone', 'Tablet', 'Computer/laptop', 'None']}
                values={formData.digitalDevices || []}
                onChange={handleInputChange}
              />

              <SelectField
                label="Are you able to write your language on digital platforms?"
                name="digitalWriting"
                value={formData.digitalWriting}
                onChange={handleInputChange}
                options={['Yes, easily', 'Yes, with some difficulty', 'No']}
              />

              <CheckboxGroup
                label="Which social media platforms do you use regularly?"
                name="socialMedia"
                options={['Facebook', 'TikTok', 'YouTube', 'Instagram', 'X', 'Snapchat', 'WhatsApp', 'Other']}
                values={formData.socialMedia || []}
                onChange={handleInputChange}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-8 border-t-2 border-emerald-100">
              <button
                type="button"
                onClick={() => setCurrentSection('home')}
                className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200 transition-all duration-300"
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 group"
              >
                <span>Complete Form A</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
const GeoLinguisticSurvey = () => {
  // Authentication and User State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'surveyor'
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Main App State
  const [currentSection, setCurrentSection] = useState('home');
  const [formAComplete, setFormAComplete] = useState(false);
  const [formBComplete, setFormBComplete] = useState(false);
  const [formCComplete, setFormCComplete] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [surveyData, setSurveyData] = useState({
    formA: {},
    formB: {},
    formC: {},
    openEndedQuestions: {},
    wordTranslations: {}
  });
  const [currentFormStep, setCurrentFormStep] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Survey Statistics
  const [totalSurveys, setTotalSurveys] = useState(2847);
  const [activeSurveyors, setActiveSurveyors] = useState(156);
  const [todaysSurveys, setTodaysSurveys] = useState(23);
  const [pendingApprovals, setPendingApprovals] = useState(5);

  // Surveyor specific stats
  const [surveyorStats, setSurveyorStats] = useState({
    todayCompleted: 3,
    todayTarget: 10,
    weeklyCompleted: 18,
    monthlyCompleted: 87,
    totalCompleted: 234,
    currentArea: 'Rawalpindi District',
    assignedAreas: ['Rawalpindi', 'Islamabad', 'Murree']
  });

  // Mock surveyors data for admin
  const [surveyors, setSurveyors] = useState([
    { id: 1, name: 'Ahmed Khan', area: 'Rawalpindi', status: 'active', todayCount: 4, totalCount: 156, approval: 'approved' },
    { id: 2, name: 'Fatima Ali', area: 'Islamabad', status: 'active', todayCount: 6, totalCount: 243, approval: 'approved' },
    { id: 3, name: 'Hassan Malik', area: 'Murree', status: 'inactive', todayCount: 0, totalCount: 89, approval: 'approved' },
    { id: 4, name: 'Ayesha Zahid', area: 'Pending', status: 'pending', todayCount: 0, totalCount: 0, approval: 'pending' },
  ]);

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (docHeight - winHeight)) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Increment survey counter when a survey is completed
  const completeSurvey = () => {
    setTotalSurveys(prev => prev + 1);
    setTodaysSurveys(prev => prev + 1);
    setSurveyorStats(prev => ({
      ...prev,
      todayCompleted: prev.todayCompleted + 1,
      weeklyCompleted: prev.weeklyCompleted + 1,
      monthlyCompleted: prev.monthlyCompleted + 1,
      totalCompleted: prev.totalCompleted + 1
    }));
  };

  // Login Component
  const LoginModal = () => {
    const [loginType, setLoginType] = useState('surveyor');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Demo credentials
    const demoCredentials = {
      admin: {
        email: 'admin@celts.edu.pk',
        password: 'admin123',
        name: 'Dr. Admin'
      },
      surveyor: {
        email: 'surveyor@celts.edu.pk',
        password: 'survey123',
        name: 'Ahmed Khan'
      }
    };

    const handleLogin = (e) => {
      e.preventDefault();

      // Check demo credentials
      const creds = demoCredentials[loginType];
      if (email === creds.email && password === creds.password) {
        setIsAuthenticated(true);
        setUserRole(loginType);
        setCurrentUser({
          name: creds.name,
          email: email,
          role: loginType
        });
        setShowLogin(false);
        setCurrentSection(loginType === 'admin' ? 'adminDashboard' : 'surveyorDashboard');
      } else {
        alert('Invalid credentials! Please use the demo credentials shown below.');
      }
    };

    const fillDemoCredentials = () => {
      const creds = demoCredentials[loginType];
      setEmail(creds.email);
      setPassword(creds.password);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-sky-600 p-6 text-white">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-blue-100 mt-1">Login to your account</p>
          </div>

          <div className="p-8">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setLoginType('surveyor');
                  setEmail('');
                  setPassword('');
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${loginType === 'surveyor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Surveyor
              </button>
              <button
                onClick={() => {
                  setLoginType('admin');
                  setEmail('');
                  setPassword('');
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${loginType === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Admin
              </button>
            </div>

            {/* Demo Credentials Display */}
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 mb-2">Demo Credentials:</p>
                  <div className="text-xs space-y-1 text-amber-700">
                    <p><strong>Email:</strong> {demoCredentials[loginType].email}</p>
                    <p><strong>Password:</strong> {demoCredentials[loginType].password}</p>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="mt-2 px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-all"
                  >
                    Use Demo Credentials
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Login as {loginType === 'admin' ? 'Administrator' : 'Surveyor'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Register as Surveyor
                </button>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogin(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Registration Component
  const RegisterModal = () => {
    const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      phone: '',
      cnic: '',
      area: '',
      password: '',
      confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = (e) => {
      e.preventDefault();
      // Mock registration - add to pending approvals
      setPendingApprovals(prev => prev + 1);
      setSurveyors(prev => [...prev, {
        id: prev.length + 1,
        name: formData.fullName,
        area: 'Pending',
        status: 'pending',
        todayCount: 0,
        totalCount: 0,
        approval: 'pending'
      }]);
      alert('Registration successful! Please wait for admin approval.');
      setShowRegister(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-sky-600 p-6 text-white sticky top-0">
            <h2 className="text-2xl font-bold">Register as Surveyor</h2>
            <p className="text-blue-100 mt-1">Join our team of field researchers</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="03XX-XXXXXXX"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CNIC Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="XXXXX-XXXXXXX-X"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Area</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none"
                    required
                  >
                    <option value="">Select area</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Quetta">Quetta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Create password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Submit Registration
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowRegister(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Speech Recognition Hook

  // Navigation Component
  const Navigation = () => (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-teal-500 shadow-lg" style={{ width: `${scrollProgress}%` }}></div>
        <nav className="bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 backdrop-blur-lg shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl blur-lg opacity-70 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 p-3 rounded-2xl shadow-xl">
                    <Globe className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    Geo-Linguistic Survey Of Pakistan
                  </h1>
                  <p className="text-xs text-sky-300 font-semibold tracking-widest uppercase"></p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">
                {/* Main Nav Buttons */}
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setCurrentSection('home')}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${currentSection === 'home'
                        ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </button>

                    <button
                      onClick={() => setCurrentSection('about')}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${currentSection === 'about'
                        ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                      <Info className="w-4 h-4" />
                      <span>About</span>
                    </button>

                    <button
                      onClick={() => setShowLogin(true)}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </button>
                  </>
                ) : (
                  <>
                    {userRole === 'admin' ? (
                      <>
                        <button
                          onClick={() => setCurrentSection('adminDashboard')}
                          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${currentSection === 'adminDashboard'
                            ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg scale-105'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                            }`}
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>

                        <button
                          onClick={() => setCurrentSection('manageSurveyors')}
                          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${currentSection === 'manageSurveyors'
                            ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg scale-105'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                            }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>Surveyors</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setCurrentSection('surveyorDashboard')}
                          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${currentSection === 'surveyorDashboard'
                            ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg scale-105'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                            }`}
                        >
                          <Activity className="w-4 h-4" />
                          <span>My Dashboard</span>
                        </button>

                        <button
                          onClick={() => setCurrentSection('newSurvey')}
                          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span>New Survey</span>
                        </button>
                      </>
                    )}

                    <div className="w-px h-8 bg-white/20 mx-2"></div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-xs text-sky-300">Logged in as</p>
                        <p className="text-sm font-semibold text-white">{currentUser?.name}</p>
                      </div>

                      <button
                        onClick={() => {
                          setIsAuthenticated(false);
                          setUserRole(null);
                          setCurrentUser(null);
                          setCurrentSection('home');
                        }}
                        className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-white rounded-xl transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-gradient-to-b from-slate-800/95 to-blue-900/95 border-t border-white/10 py-4 px-4 space-y-2 animate-slideDown">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => { setCurrentSection('home'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${currentSection === 'home'
                      ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    <Home className="w-5 h-5" />
                    <span>Home</span>
                  </button>

                  <button
                    onClick={() => { setCurrentSection('about'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${currentSection === 'about'
                      ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    <Info className="w-5 h-5" />
                    <span>About</span>
                  </button>

                  <button
                    onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-semibold"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Login</span>
                  </button>
                </>
              ) : (
                <>
                  {userRole === 'admin' ? (
                    <>
                      <button
                        onClick={() => { setCurrentSection('adminDashboard'); setMobileMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold bg-white/10 text-white"
                      >
                        <BarChart3 className="w-5 h-5" />
                        <span>Dashboard</span>
                      </button>

                      <button
                        onClick={() => { setCurrentSection('manageSurveyors'); setMobileMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold bg-white/10 text-white"
                      >
                        <Users className="w-5 h-5" />
                        <span>Surveyors</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setCurrentSection('surveyorDashboard'); setMobileMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold bg-white/10 text-white"
                      >
                        <Activity className="w-5 h-5" />
                        <span>My Dashboard</span>
                      </button>

                      <button
                        onClick={() => { setCurrentSection('newSurvey'); setMobileMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold"
                      >
                        <ClipboardList className="w-5 h-5" />
                        <span>New Survey</span>
                      </button>
                    </>
                  )}

                  <div className="h-px bg-white/20 my-2"></div>

                  <button
                    onClick={() => {
                      setIsAuthenticated(false);
                      setUserRole(null);
                      setCurrentUser(null);
                      setCurrentSection('home');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500/20 text-white rounded-xl font-semibold"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          )}
        </nav>
      </div>
      <div className="h-20"></div>
    </>
  );

  // Home Section
  const HomeSection = () => (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background with education colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-slate-50">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-sky-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>

        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 border-4 border-blue-500 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-sky-500 rotate-45"></div>
          <div className="absolute top-1/2 left-20 w-20 h-20 border-4 border-teal-500 rounded-full"></div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fadeInUp">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-bold rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              OFFICIAL SURVEY PLATFORM
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 bg-clip-text text-transparent">
              Geo-Linguistic Survey
              Of Pakistan
            </span>
          </h1>
          <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent mb-2">

          </p>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mt-6 leading-relaxed font-medium">
            A comprehensive initiative to document, preserve, and celebrate the rich tapestry of languages
            spoken across Pakistan's diverse communities.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {isAuthenticated ? (
              userRole === 'surveyor' ? (
                <button
                  onClick={() => setCurrentSection('newSurvey')}
                  className="group relative px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <ClipboardList className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Start New Survey</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentSection('adminDashboard')}
                  className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 overflow-hidden"
                >
                  <BarChart3 className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Go to Dashboard</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 overflow-hidden"
                >
                  <LogIn className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Surveyor Login</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
                </button>

                <button
                  onClick={() => setShowRegister(true)}
                  className="px-10 py-5 bg-white/90 backdrop-blur text-blue-700 border-2 border-blue-300 rounded-2xl font-bold text-lg hover:bg-sky-50 hover:border-sky-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-6 h-6 inline mr-2" />
                  Register Now
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Statistics Counter */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">Live Survey Statistics</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl">
              <div className="text-4xl font-black text-blue-600 mb-2">
                {totalSurveys.toLocaleString()}
              </div>
              <p className="text-slate-600 font-semibold">Total Surveys</p>
              <div className="mt-2 text-green-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                +{todaysSurveys} today
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-sky-50 to-teal-50 rounded-2xl">
              <div className="text-4xl font-black text-sky-600 mb-2">
                {activeSurveyors}
              </div>
              <p className="text-slate-600 font-semibold">Active Surveyors</p>
              <div className="mt-2 text-blue-600 text-sm font-semibold">
                <Users className="w-4 h-4 inline mr-1" />
                Field teams
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl">
              <div className="text-4xl font-black text-teal-600 mb-2">
                87
              </div>
              <p className="text-slate-600 font-semibold">Languages Documented</p>
              <div className="mt-2 text-teal-600 text-sm font-semibold">
                <Languages className="w-4 h-4 inline mr-1" />
                Growing daily
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl">
              <div className="text-4xl font-black text-cyan-600 mb-2">
                142
              </div>
              <p className="text-slate-600 font-semibold">Districts Covered</p>
              <div className="mt-2 text-cyan-600 text-sm font-semibold">
                <MapPin className="w-4 h-4 inline mr-1" />
                Nationwide
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid with education design */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {[
            {
              icon: Map,
              title: 'Geographic Mapping',
              desc: 'Advanced GIS mapping of linguistic diversity across all provinces',
              color: 'from-blue-500 to-sky-600',
              bgColor: 'bg-blue-50'
            },
            {
              icon: Users,
              title: 'Community Engagement',
              desc: 'Direct participation from native speakers and cultural experts',
              color: 'from-sky-500 to-teal-600',
              bgColor: 'bg-sky-50'
            },
            {
              icon: Shield,
              title: 'Heritage Preservation',
              desc: 'Safeguarding endangered languages for future generations',
              color: 'from-teal-500 to-cyan-600',
              bgColor: 'bg-teal-50'
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className={`group relative p-8 ${feature.bgColor} backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-white hover:border-sky-200`}
              style={{ animationDelay: `${idx * 200}ms` }}
            >
              <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg`}>
                <feature.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed font-medium">{feature.desc}</p>
              <div className={`absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-br ${feature.color} rounded-full opacity-70`}></div>
            </div>
          ))}
        </div>

        {/* Call to Action for Surveyors */}
        {!isAuthenticated && (
          <>
            {/* Demo Credentials Info Box */}
            <div className="mt-16 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl shadow-xl border-2 border-amber-200">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                  <Info className="w-6 h-6 mr-2" />
                  Demo Access Available
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-2">🔐 Admin Login</h4>
                    <p className="text-sm text-slate-600">
                      <strong>Email:</strong> admin@celts.edu.pk<br />
                      <strong>Password:</strong> admin123
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Full administrative access</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-2">📋 Surveyor Login</h4>
                    <p className="text-sm text-slate-600">
                      <strong>Email:</strong> surveyor@celts.edu.pk<br />
                      <strong>Password:</strong> survey123
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Field surveyor access</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogin(true)}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <LogIn className="w-5 h-5 inline mr-2" />
                  Login with Demo Credentials
                </button>
              </div>
            </div>

            {/* Join Team Section */}
            <div className="mt-8 p-10 bg-gradient-to-r from-blue-600 to-sky-600 rounded-3xl shadow-2xl text-white">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Join Our Team of Field Surveyors</h2>
                <p className="text-lg text-blue-100 mb-8">
                  Be part of Pakistan's most comprehensive linguistic documentation project.
                  We're looking for dedicated surveyors across all provinces.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => setShowRegister(true)}
                    className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg"
                  >
                    Apply as Surveyor
                  </button>
                  <button
                    onClick={() => setCurrentSection('about')}
                    className="px-8 py-4 bg-blue-500/30 text-white border-2 border-white/50 rounded-xl font-bold hover:bg-blue-500/40 transition-all"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Survey Overview Section (New)
  const SurveySection = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-4">
            Survey Overview
          </h2>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto">
            Complete all survey forms to contribute to Pakistan's linguistic heritage documentation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              id: 'formA',
              title: 'Form A',
              subtitle: 'Individual Survey',
              description: 'Personal language profile including mother tongue, multilingualism, and digital usage patterns',
              icon: FileText,
              complete: formAComplete,
              locked: false,
              time: '15-20 minutes',
              questions: '100+ questions'
            },
            {
              id: 'formB',
              title: 'Form B',
              subtitle: 'Participatory Method',
              description: 'Group discussion on language domains, dialect mapping, and community perspectives',
              icon: Users,
              complete: formBComplete,
              locked: !formAComplete,
              time: '20-25 minutes',
              questions: '50+ questions'
            },
            {
              id: 'formC',
              title: 'Form C',
              subtitle: 'Leadership Interview',
              description: 'Village head or language activist insights on preservation and promotion strategies',
              icon: Shield,
              complete: formCComplete,
              locked: !formBComplete,
              time: '10-15 minutes',
              questions: '30+ questions'
            },
            {
              id: 'openEnded',
              title: 'Corpus Questions',
              subtitle: 'Open-ended Responses',
              description: 'Cultural narratives, folk stories, and personal experiences in native language',
              icon: Mic,
              complete: false,
              locked: !formCComplete,
              time: '25-30 minutes',
              questions: '20 questions'
            },
            {
              id: 'wordList',
              title: 'Word Translation',
              subtitle: 'Vocabulary Mapping',
              description: 'Translation of 238 common words to build comparative linguistic database',
              icon: BookOpen,
              complete: false,
              locked: !formCComplete,
              time: '30-40 minutes',
              questions: '238 words'
            }
          ].map((survey) => (
            <div
              key={survey.id}
              className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-300 ${survey.locked ? 'opacity-60' : 'hover:shadow-2xl hover:-translate-y-2'
                }`}
            >
              {survey.complete && (
                <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              )}

              <div className="p-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${survey.locked
                  ? 'bg-slate-100'
                  : 'bg-gradient-to-br from-blue-500 to-sky-600'
                  }`}>
                  <survey.icon className={`w-8 h-8 ${survey.locked ? 'text-slate-400' : 'text-white'}`} />
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mb-2">{survey.title}</h3>
                <p className="text-sky-600 font-semibold mb-3">{survey.subtitle}</p>
                <p className="text-slate-600 mb-6">{survey.description}</p>

                <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                  <span className="flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    {survey.time}
                  </span>
                  <span>{survey.questions}</span>
                </div>

                <button
                  onClick={() => !survey.locked && setCurrentSection(survey.id)}
                  disabled={survey.locked}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${survey.locked
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : survey.complete
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-sky-600 text-white hover:shadow-lg hover:scale-105'
                    }`}
                >
                  {survey.locked ? 'Locked' : survey.complete ? 'Review' : 'Start'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // About Section (New)
  const AboutSection = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-4">
            About the Survey
          </h2>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto">
            Understanding Pakistan's linguistic landscape through scientific documentation
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-sky-600 p-8 text-white">
            <h3 className="text-3xl font-bold mb-4">Centre for Languages and Translation Studies (CeLTS)</h3>
            <p className="text-lg opacity-90">Allama Iqbal Open University (AIOU), Islamabad</p>
          </div>

          <div className="p-10 space-y-8">
            <div>
              <h4 className="text-2xl font-bold text-slate-800 mb-4">Mission</h4>
              <p className="text-slate-700 leading-relaxed">
                The Geo-Linguistic Survey of Pakistan aims to create a comprehensive database of all languages
                spoken across Pakistan, documenting their geographic distribution, speaker populations, and
                sociolinguistic characteristics. This initiative will support language preservation efforts,
                educational planning, and cultural heritage documentation.
              </p>
            </div>

            <div>
              <h4 className="text-2xl font-bold text-slate-800 mb-4">Objectives</h4>
              <ul className="space-y-3">
                {[
                  'Document all indigenous and minority languages of Pakistan',
                  'Map linguistic boundaries and dialect variations',
                  'Assess language vitality and endangerment levels',
                  'Create digital resources for language preservation',
                  'Support mother tongue education initiatives',
                  'Build comprehensive linguistic corpus for research'
                ].map((objective, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-2xl font-bold text-slate-800 mb-4">Methodology</h4>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: 'Field Surveys', desc: 'Direct data collection from native speakers' },
                  { title: 'Digital Tools', desc: 'Online platforms for wider participation' },
                  { title: 'Community Engagement', desc: 'Collaborative approach with local communities' }
                ].map((method, idx) => (
                  <div key={idx} className="bg-sky-50 p-6 rounded-xl">
                    <h5 className="font-bold text-blue-900 mb-2">{method.title}</h5>
                    <p className="text-slate-700 text-sm">{method.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-8 rounded-2xl">
              <h4 className="text-2xl font-bold text-slate-800 mb-4">Contact Information</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-slate-800 mb-2">Project Director</p>
                  <p className="text-slate-700">Dr. [Name]</p>
                  <p className="text-slate-600">director.celts@aiou.edu.pk</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-2">Research Team</p>
                  <p className="text-slate-700">CeLTS, AIOU</p>
                  <p className="text-slate-600">linguistic.survey@aiou.edu.pk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Admin Dashboard Section
  const AdminDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-slate-600">Monitor and manage survey operations across Pakistan</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <ClipboardList className="w-10 h-10 text-blue-600" />
              <span className="text-sm text-green-600 font-semibold">+2.4%</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{totalSurveys.toLocaleString()}</div>
            <p className="text-sm text-slate-600 mt-1">Total Surveys</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 text-sky-600" />
              <span className="text-sm text-green-600 font-semibold">Active</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{activeSurveyors}</div>
            <p className="text-sm text-slate-600 mt-1">Field Surveyors</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-10 h-10 text-teal-600" />
              <span className="text-sm text-amber-600 font-semibold">Today</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{todaysSurveys}</div>
            <p className="text-sm text-slate-600 mt-1">Today's Surveys</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-10 h-10 text-amber-600" />
              <span className="text-sm text-red-600 font-semibold">Pending</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{pendingApprovals}</div>
            <p className="text-sm text-slate-600 mt-1">Approvals Pending</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Recent Survey Activity</h3>
            <div className="space-y-3">
              {[
                { name: 'Ahmed Khan', area: 'Rawalpindi', time: '10 mins ago', surveys: 2 },
                { name: 'Fatima Ali', area: 'Islamabad', time: '25 mins ago', surveys: 3 },
                { name: 'Hassan Malik', area: 'Murree', time: '1 hour ago', surveys: 1 },
                { name: 'Sara Ahmed', area: 'Lahore', time: '2 hours ago', surveys: 4 }
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-white font-bold">
                      {activity.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{activity.name}</p>
                      <p className="text-xs text-slate-600">{activity.area} • {activity.time}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    +{activity.surveys} surveys
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Regional Distribution</h3>
            <div className="space-y-4">
              {[
                { region: 'Punjab', count: 1234, percentage: 43 },
                { region: 'Sindh', count: 876, percentage: 31 },
                { region: 'KPK', count: 543, percentage: 19 },
                { region: 'Balochistan', count: 194, percentage: 7 }
              ].map((region, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-700">{region.region}</span>
                    <span className="text-sm text-slate-600">{region.count} surveys</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-sky-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${region.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Surveyor Dashboard Section
  const SurveyorDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 mb-2">My Dashboard</h1>
          <p className="text-lg text-slate-600">Welcome back, {currentUser?.name}</p>
        </div>

        {/* Today's Progress */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">Today's Progress</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="relative inline-flex">
                <div className="w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="64" cy="64" r="56"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(surveyorStats.todayCompleted / surveyorStats.todayTarget) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <p className="text-3xl font-bold text-slate-800">{surveyorStats.todayCompleted}</p>
                      <p className="text-sm text-slate-600">of {surveyorStats.todayTarget}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-slate-700 font-semibold">Today's Target</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <p className="text-sm text-gray-600">Weekly Completed</p>
                <p className="text-2xl font-bold text-green-700">{surveyorStats.weeklyCompleted}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl">
                <p className="text-sm text-gray-600">Monthly Total</p>
                <p className="text-2xl font-bold text-blue-700">{surveyorStats.monthlyCompleted}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                <p className="text-sm text-gray-600">Total Surveys</p>
                <p className="text-2xl font-bold text-purple-700">{surveyorStats.totalCompleted}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                <p className="text-sm text-gray-600">Current Area</p>
                <p className="text-lg font-bold text-amber-700">{surveyorStats.currentArea}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <button
                onClick={() => setCurrentSection('newSurvey')}
                className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <ClipboardList className="w-6 h-6 inline mr-2" />
                Start New Survey
              </button>
              <p className="text-sm text-slate-600 mt-3 text-center">
                {surveyorStats.todayTarget - surveyorStats.todayCompleted} surveys remaining today
              </p>
            </div>
          </div>
        </div>

        {/* Recent Surveys */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">Recent Surveys</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Survey ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Respondent</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Area</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Language</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: '#2847', name: 'Ali Hassan', area: 'Rawalpindi', language: 'Punjabi', date: 'Today, 2:30 PM', status: 'Complete' },
                  { id: '#2846', name: 'Fatima Bibi', area: 'Islamabad', language: 'Urdu', date: 'Today, 11:45 AM', status: 'Complete' },
                  { id: '#2845', name: 'Muhammad Khan', area: 'Rawalpindi', language: 'Pashto', date: 'Today, 9:20 AM', status: 'Complete' },
                  { id: '#2844', name: 'Ayesha Ahmed', area: 'Murree', language: 'Hindko', date: 'Yesterday', status: 'Complete' }
                ].map((survey, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-semibold text-blue-600">{survey.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{survey.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{survey.area}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{survey.language}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{survey.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {survey.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Manage Surveyors Section (Admin)
  const ManageSurveyors = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 mb-2">Manage Surveyors</h1>
          <p className="text-lg text-slate-600">Approve registrations and monitor surveyor performance</p>
        </div>

        {/* Pending Approvals */}
        {pendingApprovals > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-amber-800 mb-4">
              <AlertCircle className="w-6 h-6 inline mr-2" />
              Pending Approvals ({pendingApprovals})
            </h3>
            <div className="space-y-3">
              {surveyors.filter(s => s.approval === 'pending').map((surveyor) => (
                <div key={surveyor.id} className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                      {surveyor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{surveyor.name}</p>
                      <p className="text-sm text-slate-600">Applied for: {surveyor.area || 'Pending Assignment'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSurveyors(surveyors.map(s =>
                          s.id === surveyor.id
                            ? { ...s, approval: 'approved', status: 'active' }
                            : s
                        ));
                        setPendingApprovals(prev => prev - 1);
                        setActiveSurveyors(prev => prev + 1);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      Approve
                    </button>
                    <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all">
                      <X className="w-4 h-4 inline mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Surveyors */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">Active Surveyors</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Area</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Today</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Performance</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveyors.filter(s => s.approval === 'approved').map((surveyor) => (
                  <tr key={surveyor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-white font-bold">
                          {surveyor.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">{surveyor.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{surveyor.area}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${surveyor.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                        }`}>
                        {surveyor.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{surveyor.todayCount}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-800">{surveyor.totalCount}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // New Survey Section (For Surveyors)
  const NewSurveySection = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">Start New Survey</h2>
            <p className="text-green-100">Select respondent type and begin data collection</p>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Current Assignment</h3>
                <p className="text-slate-600 mb-1">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  {surveyorStats.currentArea}
                </p>
                <p className="text-sm text-slate-500">
                  Assigned Areas: {surveyorStats.assignedAreas.join(', ')}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Today's Progress</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                        style={{ width: `${(surveyorStats.todayCompleted / surveyorStats.todayTarget) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {surveyorStats.todayCompleted}/{surveyorStats.todayTarget}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-6">Select Survey Type</h3>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setCurrentSection('formA');
                  setFormAComplete(false);
                  setFormBComplete(false);
                  setFormCComplete(false);
                }}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white">
                      <User className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-slate-800">Individual Survey (Form A)</h4>
                      <p className="text-sm text-slate-600">Personal linguistic profile questionnaire</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('formB');
                  setFormAComplete(false);
                  setFormBComplete(false);
                  setFormCComplete(false);
                }}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white">
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-slate-800">Group Survey (Form B)</h4>
                      <p className="text-sm text-slate-600">Community participatory method</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('formC');
                  setFormAComplete(false);
                  setFormBComplete(false);
                  setFormCComplete(false);
                }}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                      <Award className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-slate-800">Leader Interview (Form C)</h4>
                      <p className="text-sm text-slate-600">Village head or language activist</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('openEnded');
                  setFormAComplete(false);
                  setFormBComplete(false);
                  setFormCComplete(false);
                }}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-slate-800">Corpus Form</h4>
                      <p className="text-sm text-slate-600">Open-ended sociolinguistic questions</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('wordList');
                  setFormAComplete(false);
                  setFormBComplete(false);
                  setFormCComplete(false);
                }}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                      <Languages className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-slate-800">Word Translation</h4>
                      <p className="text-sm text-slate-600">Standard word list translation</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                </div>
              </button>
            </div>

            <div className="mt-8 p-6 bg-amber-50 rounded-2xl">
              <h4 className="font-bold text-amber-800 mb-2">
                <Info className="w-5 h-5 inline mr-2" />
                Survey Guidelines
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Ensure respondent consent before starting</li>
                <li>• Complete all required fields accurately</li>
                <li>• Record GPS coordinates for each survey location</li>
                <li>• Submit survey immediately after completion</li>
              </ul>
            </div>

            {/* Final Submission Button */}
            <div className="mt-12 flex flex-col items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8"></div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to submit the final survey? This will complete the current session.')) {
                    completeSurvey();
                    alert('Survey Submitted Successfully! All data has been saved.');
                    setCurrentSection('surveyorDashboard');
                    // Reset completion flags for next survey
                    setFormAComplete(false);
                    setFormBComplete(false);
                    setFormCComplete(false);
                  }
                }}
                className="w-full max-w-md py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 group"
              >
                <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-all">
                  <Send className="w-6 h-6" />
                </div>
                <span>SUBMIT FINAL SURVEY</span>
              </button>
              <p className="mt-4 text-sm text-gray-500 font-medium italic">
                Please ensure all sections are completed before final submission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Form A Section (Simplified for space - contains key sections)

  // Form B Section (Participatory Method)
  // Form C Section (Language Activist/Village Head)
  // Open-Ended Questions Section
  // Word Translation Section
  return (
    <>
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Modals */}
        {showLogin && <LoginModal />}
        {showRegister && <RegisterModal />}

        {/* Main Sections */}
        {currentSection === 'home' && <HomeSection />}
        {currentSection === 'survey' && <SurveySection />}
        {currentSection === 'about' && <AboutSection />}
        {currentSection === 'adminDashboard' && <AdminDashboard />}
        {currentSection === 'surveyorDashboard' && <SurveyorDashboard />}
        {currentSection === 'manageSurveyors' && <ManageSurveyors />}
        {currentSection === 'newSurvey' && <NewSurveySection />}
        {currentSection === 'formA' && <FormASection surveyData={surveyData} setSurveyData={setSurveyData} setFormAComplete={setFormAComplete} setCurrentSection={setCurrentSection} currentFormStep={currentFormStep} />}
        {currentSection === 'formB' && <FormBSection surveyData={surveyData} setSurveyData={setSurveyData} setFormBComplete={setFormBComplete} setCurrentSection={setCurrentSection} />}
        {currentSection === 'formC' && <FormCSection surveyData={surveyData} setSurveyData={setSurveyData} setFormCComplete={setFormCComplete} setCurrentSection={setCurrentSection} />}
        {currentSection === 'openEnded' && <OpenEndedSection surveyData={surveyData} setSurveyData={setSurveyData} setCurrentSection={setCurrentSection} />}
        {currentSection === 'wordList' && <WordListSection surveyData={surveyData} setSurveyData={setSurveyData} setFormAComplete={setFormAComplete} setFormBComplete={setFormBComplete} setFormCComplete={setFormCComplete} setCurrentSection={setCurrentSection} completeSurvey={completeSurvey} />}
      </div>
    </>
  );
};

export default GeoLinguisticSurvey;