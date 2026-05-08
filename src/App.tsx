import React from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { FinancialData, RiskResult, ImprovementSuggestion } from './types';
import { LoanForm } from './components/LoanForm';
import { RiskGauge } from './components/RiskGauge';
import { ResultsDisplay } from './components/ResultsDisplay';
import { InsightsPanel } from './components/InsightsPanel';
import { CreditTimeline } from './components/CreditTimeline';
import { CompareScenarios } from './components/CompareScenarios';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Download, History, LayoutDashboard, PieChart, ShieldCheck, RefreshCcw, LogIn, LogOut, Save, User, Layers, Sparkles } from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<RiskResult | null>(null);
  const [suggestions, setSuggestions] = React.useState<ImprovementSuggestion[]>([]);
  const [currentData, setCurrentData] = React.useState<FinancialData | null>(null);
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [savedProfiles, setSavedProfiles] = React.useState<{ id: string; name: string; data: FinancialData; result: RiskResult }[]>([]);
  const [newProfileName, setNewProfileName] = React.useState('');

  React.useEffect(() => {
    console.log('Current savedProfiles count:', savedProfiles.length);
  }, [savedProfiles]);
  const [isAuthReady, setIsAuthReady] = React.useState(false);

  // Auth Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Saved Profiles
  React.useEffect(() => {
    if (!user) {
      setSavedProfiles([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'profiles')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Fetched profiles snapshot:', snapshot.size);
      const profiles = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          data: data.financialData,
          result: data.riskResult
        };
      });
      console.log('Updated savedProfiles state:', profiles.length);
      setSavedProfiles(profiles);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/profiles`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      reset();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAnalyzeRisk = async (data: FinancialData) => {
    setIsLoading(true);
    try {
      const [riskRes, suggestionsRes] = await Promise.all([
        axios.post('/api/predict-risk', data),
        axios.post('/api/suggest-improvements', data)
      ]);

      setResult(riskRes.data);
      setSuggestions(suggestionsRes.data);
      setCurrentData(data);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze risk. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveScenario = async () => {
    if (!user || !currentData || !result) {
      console.error('Save Scenario aborted: missing data', { user: !!user, currentData: !!currentData, result: !!result });
      return;
    }
    
    const profileName = newProfileName.trim() || `Profile ${savedProfiles.length + 1}`;

    try {
      console.log('Attempting to save scenario...', { 
        uid: user.uid, 
        profileName,
        hasData: !!currentData,
        hasResult: !!result 
      });
      
      const docRef = await addDoc(collection(db, 'users', user.uid, 'profiles'), {
        uid: user.uid,
        name: profileName,
        financialData: currentData,
        riskResult: result,
        createdAt: serverTimestamp()
      });
      
      console.log('Scenario saved successfully with ID:', docRef.id);
      alert(`Profile "${profileName}" saved successfully!`);
      setNewProfileName('');
    } catch (error) {
      console.error('Error saving scenario:', error);
      try {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/profiles`);
      } catch (err: any) {
        alert(`Failed to save profile: ${err.message}`);
      }
    }
  };

  const saveProfile = async () => {
    if (!user || !currentData) {
      console.error('Save Profile aborted: missing data', { user: !!user, currentData: !!currentData });
      return;
    }
    
    if (!user.email) {
      alert('Email is required to save profile. Please ensure you are logged in with an account that has an email.');
      return;
    }

    try {
      console.log('Saving user profile to Firestore...', { uid: user.uid });
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        financialData: currentData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Profile financial data saved!');
    } catch (error) {
      console.error('Error saving profile:', error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      } catch (err: any) {
        alert(`Failed to save to profile: ${err.message}`);
      }
    }
  };

  const loadSavedProfile = (profile: { data: FinancialData; result: RiskResult }) => {
    setCurrentData(profile.data);
    setResult(profile.result);
    // Optionally re-fetch suggestions if needed, but we can just use the saved ones if we stored them
    // For now, let's just re-analyze to be fresh
    handleAnalyzeRisk(profile.data);
  };

  const exportPDF = () => {
    if (!result || !currentData) return;

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Credit Risk Analysis Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    
    doc.text('Applicant Information:', 20, 45);
    doc.text(`- Age: ${currentData.age}`, 25, 52);
    doc.text(`- Income: $${currentData.income}`, 25, 59);
    doc.text(`- Credit Score: ${currentData.creditScore}`, 25, 66);
    
    doc.text('Analysis Results:', 20, 80);
    doc.text(`- Risk Score: ${result.riskScore}/100`, 25, 87);
    doc.text(`- Category: ${result.riskCategory}`, 25, 94);
    doc.text(`- Approval Probability: ${Math.round(result.approvalProbability * 100)}%`, 25, 101);
    doc.text(`- Recommended Amount: $${result.recommendedAmount}`, 25, 108);
    
    doc.save('credit-risk-report.pdf');
  };

  const reset = () => {
    setResult(null);
    setSuggestions([]);
    setCurrentData(null);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCcw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 w-full max-w-md text-center space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
              <ShieldCheck className="w-10 h-10 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-white">FinGuard AI</h1>
              <p className="text-slate-400 text-lg">Next-generation credit risk intelligence.</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
              <p className="text-slate-400 text-sm">Sign in to access your financial dashboard and AI insights.</p>
            </div>
            
            <Button 
              onClick={handleLogin} 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-7 text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-blue-600/20 gap-3"
            >
              <LogIn className="w-6 h-6" />
              Sign in with Google
            </Button>

            <p className="text-slate-500 text-xs">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Secure', icon: ShieldCheck },
              { label: 'AI-Powered', icon: Sparkles },
              { label: 'Real-time', icon: RefreshCcw }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <feature.icon className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{feature.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">FinGuard AI</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-semibold">{user.displayName}</span>
                  <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-500 transition-colors">Sign Out</button>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden">
                  <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="User" referrerPolicy="no-referrer" />
                </div>
              </div>
            ) : (
              <Button onClick={handleLogin} variant="outline" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" /> Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  AI Credit Risk Analyzer
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Get instant, explainable loan approval predictions powered by machine learning.
                </p>
              </div>
              
              {user && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Your Saved Profiles</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        // Forcing a re-fetch by toggling a dummy state if needed, 
                        // but usually just logging is enough to see if it's working
                        console.log('Manual refresh requested');
                        window.location.reload(); // Last resort for the user
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <RefreshCcw className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {savedProfiles.map((p, i) => (
                      <Button key={i} variant="outline" onClick={() => loadSavedProfile(p)} className="gap-2 bg-white">
                        <User className="w-4 h-4" /> {p.name}
                      </Button>
                    ))}
                    {savedProfiles.length === 0 && <p className="text-slate-400 text-sm italic">No saved profiles yet.</p>}
                  </div>
                </div>
              )}

              <LoanForm onSubmit={handleAnalyzeRisk} isLoading={isLoading} initialData={currentData} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Analysis Results</h2>
                  <p className="text-slate-500">Comprehensive risk assessment for {currentData?.loanPurpose === 'Other' ? currentData?.otherLoanPurpose : currentData?.loanPurpose}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {user && (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="Profile Name..." 
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                      />
                      <Button variant="outline" onClick={saveScenario} className="gap-2 bg-slate-900 text-white hover:bg-slate-800 border-none">
                        <Save className="w-4 h-4" /> Save as New Profile
                      </Button>
                    </div>
                  )}
                  <Button variant="outline" onClick={reset} className="gap-2">
                    <RefreshCcw className="w-4 h-4" /> New Analysis
                  </Button>
                  <Button onClick={exportPDF} className="bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 gap-2">
                    <Download className="w-4 h-4" /> Download Report
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Risk Gauge & Stats */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center">
                    <RiskGauge score={result.riskScore} />
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Saved Profiles</h3>
                    <div className="space-y-3">
                      {savedProfiles.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm group">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold">{item.name}</span>
                            <span className="text-slate-500 text-xs">${item.data.loanAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${item.result.riskCategory === 'Low' ? 'text-green-600' : item.result.riskCategory === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {item.result.riskScore}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => loadSavedProfile(item)}>
                              <RefreshCcw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!user && <p className="text-slate-400 text-center py-4 text-xs">Sign in to save profiles</p>}
                      {user && savedProfiles.length === 0 && <p className="text-slate-400 text-center py-4 text-xs">No saved profiles yet</p>}
                    </div>
                  </div>
                </div>

                {/* Right Column: Detailed Analysis */}
                <div className="lg:col-span-2">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-slate-100 p-1 rounded-2xl mb-6 flex flex-wrap h-auto">
                      <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <PieChart className="w-4 h-4 mr-2" /> AI Insights
                      </TabsTrigger>
                      <TabsTrigger value="history" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <History className="w-4 h-4 mr-2" /> Credit History
                      </TabsTrigger>
                      <TabsTrigger value="compare" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Layers className="w-4 h-4 mr-2" /> Compare
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-0">
                      <ResultsDisplay result={result} />
                    </TabsContent>
                    
                    <TabsContent value="insights" className="mt-0">
                      {currentData && <InsightsPanel data={currentData} result={result} suggestions={suggestions} />}
                    </TabsContent>
                    
                    <TabsContent value="history" className="mt-0">
                      <CreditTimeline />
                    </TabsContent>

                    <TabsContent value="compare" className="mt-0">
                      <CompareScenarios scenarios={savedProfiles} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-slate-200 py-12 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 FinGuard AI. All analysis is for simulation purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
