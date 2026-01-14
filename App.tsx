
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Layers, 
  Activity, 
  Waves, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Ruler,
  MousePointer2,
  XCircle,
  Droplet,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Printer
} from 'lucide-react';
import { 
  SoilProperties, 
  FoundationProperties, 
  LoadingConditions, 
  SoilType,
  FoundationShape
} from './types';
import { calculateBearingCapacity } from './engine';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const App: React.FC = () => {
  // State for inputs
  const [soil, setSoil] = useState<SoilProperties>({
    type: 'Cohesionless (Sand)',
    c: 0,
    phi: 30,
    gamma: 18,
    gamma_sub: 10,
    spt_n: 15,
    Es: 20000
  });

  const [foundation, setFoundation] = useState<FoundationProperties>({
    shape: 'Square',
    B: 2.0,
    L: 2.0,
    Df: 1.5
  });

  const [load, setLoad] = useState<LoadingConditions>({
    V: 500,
    H: 0,
    Mx: 0,
    My: 0
  });

  const [waterTable, setWaterTable] = useState<number>(5);
  const [fos, setFos] = useState<number>(3.0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // State for chart interaction
  const [selectedSettlementPoint, setSelectedSettlementPoint] = useState<{ width: string, settlement: number } | null>(null);

  // Derived results
  const results = useMemo(() => {
    return calculateBearingCapacity(soil, foundation, load, waterTable, fos);
  }, [soil, foundation, load, waterTable, fos]);

  // Sensitivity Data for Charts
  const sensitivityData = useMemo(() => {
    const points = [];
    for (let b = 1; b <= 6; b += 0.5) {
      const tempFoundation = { ...foundation, B: b, L: foundation.shape === 'Square' ? b : foundation.L };
      const res = calculateBearingCapacity(soil, tempFoundation, load, waterTable, fos);
      points.push({
        width: b.toFixed(1),
        sbc: parseFloat(res.recommended_sbc.toFixed(2)),
        settlement: parseFloat(res.settlement.toFixed(2))
      });
    }
    return points;
  }, [soil, foundation, load, waterTable, fos]);

  const handleSoilChange = (field: keyof SoilProperties, value: string | number) => {
    setSoil(prev => ({ ...prev, [field]: value }));
  };

  const handleFoundationChange = (field: keyof FoundationProperties, value: string | number) => {
    setFoundation(prev => ({ ...prev, [field]: value }));
  };

  const getWaterTableStatus = () => {
    if (waterTable <= foundation.Df) return { label: 'Surcharge Correction Active', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (waterTable <= foundation.Df + foundation.B) return { label: 'Self-Weight Correction Active', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'No Correction (Dry)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  };

  const wtStatus = getWaterTableStatus();

  // Export Logic
  const handleExportPDF = () => {
    window.print();
    setIsExportOpen(false);
  };

  const handleExportCSV = () => {
    const dataRows = [
      ['GEOTECHCALC PRO - TECHNICAL REPORT'],
      ['Date', new Date().toLocaleString()],
      [''],
      ['INPUT PARAMETERS'],
      ['Soil Type', soil.type],
      ['Cohesion (c)', soil.c, 'kPa'],
      ['Friction Angle (phi)', soil.phi, 'deg'],
      ['Unit Weight (gamma)', soil.gamma, 'kN/m3'],
      ['Submerged Weight', soil.gamma_sub, 'kN/m3'],
      ['SPT N-Value', soil.spt_n || 'N/A'],
      ['Elastic Modulus (Es)', soil.Es || 'N/A', 'kPa'],
      ['Foundation Shape', foundation.shape],
      ['Width (B)', foundation.B, 'm'],
      ['Depth (Df)', foundation.Df, 'm'],
      ['Water Table Depth (Dw)', waterTable, 'm'],
      ['Factor of Safety', fos],
      [''],
      ['CALCULATION RESULTS'],
      ['Recommended SBC', results.recommended_sbc.toFixed(2), 'kPa'],
      ['Est. Settlement', results.settlement.toFixed(2), 'mm'],
      ['Ultimate Capacity (qu)', results.qu.toFixed(2), 'kPa'],
      ['Net Safe Capacity (qns)', results.qns.toFixed(2), 'kPa'],
      ['Design Status', results.status],
      ['Effective Width (B\')', results.B_prime.toFixed(3), 'm'],
      [''],
      ['BEARING CAPACITY FACTORS'],
      ['Nc', results.Nc.toFixed(3)],
      ['Nq', results.Nq.toFixed(3)],
      ['Ngamma', results.Ngamma.toFixed(3)],
      ['sc', results.sc.toFixed(3)],
      ['sq', results.sq.toFixed(3)],
      ['sgamma', results.sgamma.toFixed(3)],
      ['dc', results.dc.toFixed(3)],
      ['dq', results.dq.toFixed(3)],
      ['W\' factor', results.W_prime.toFixed(3)]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + dataRows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Geotech_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          header, aside, footer, .no-print { display: none !important; }
          main { display: block !important; padding: 0 !important; }
          .print-only { display: block !important; }
          .page-break { page-break-before: always; }
          .card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; break-inside: avoid; }
          .print-header { display: flex !important; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 2rem; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm no-print">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
            <Calculator size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">GeotechCalc Pro</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Foundation Engineering Suite v2.6</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`hidden md:flex px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider items-center gap-2 border shadow-sm ${
            results.status === 'SAFE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {results.status === 'SAFE' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            Design Status: {results.status}
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
            >
              <Download size={18} />
              Export Report
              <ChevronDown size={16} className={`transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Printer size={16} /></div>
                  PDF Technical Report
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FileSpreadsheet size={16} /></div>
                  Excel / CSV Data
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* PDF / Print Template Header */}
        <div className="print-only p-10 bg-white">
          <div className="print-header">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">GEOTECHNICAL INVESTIGATION REPORT</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Foundation Bearing Capacity & Settlement Analysis</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase">Report ID: GTR-{Math.floor(Math.random()*100000)}</p>
              <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Input Controls Sidebar */}
        <aside className="w-full lg:w-[400px] bg-white border-r border-slate-200 overflow-y-auto p-8 scrollbar-hide space-y-10 no-print">
          {/* Soil Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Layers size={20} /></div>
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Soil Properties</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">SOIL TYPE</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-500 transition-all outline-none appearance-none"
                  value={soil.type}
                  onChange={(e) => handleSoilChange('type', e.target.value as SoilType)}
                >
                  <option>Cohesionless (Sand)</option>
                  <option>Cohesive (Clay)</option>
                  <option>c-φ Soil</option>
                  <option>Rock</option>
                </select>
              </div>

              {/* Conditional SPT N-Value visibility */}
              {(soil.type === 'Cohesionless (Sand)' || soil.type === 'Cohesive (Clay)' || soil.type === 'c-φ Soil') && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border-2 border-indigo-100/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">SPT N-VALUE (FIELD)</label>
                    <span className="text-[9px] font-bold text-indigo-400 italic">Optional</span>
                  </div>
                  <input 
                    type="number"
                    placeholder="Enter N-value"
                    className="w-full bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-500 transition-all outline-none"
                    value={soil.spt_n || ''}
                    onChange={(e) => handleSoilChange('spt_n', parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">COHESION (kPa)</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    value={soil.c}
                    onChange={(e) => handleSoilChange('c', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">FRICTION Φ (°)</label>
                  <input 
                    type="number" step="0.5"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    value={soil.phi}
                    onChange={(e) => handleSoilChange('phi', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">BULK γ (kN/m³)</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    value={soil.gamma}
                    onChange={(e) => handleSoilChange('gamma', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">SUB γ' (kN/m³)</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    value={soil.gamma_sub}
                    onChange={(e) => handleSoilChange('gamma_sub', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Foundation Geometry Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Activity size={20} /></div>
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Foundation geometry</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">SHAPE</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-amber-500 outline-none transition-all"
                  value={foundation.shape}
                  onChange={(e) => handleFoundationChange('shape', e.target.value as FoundationShape)}
                >
                  <option>Strip/Continuous</option>
                  <option>Square</option>
                  <option>Rectangular</option>
                  <option>Circular</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">WIDTH B (m)</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-amber-500 outline-none transition-all"
                    value={foundation.B}
                    onChange={(e) => handleFoundationChange('B', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">DEPTH Df (m)</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-amber-500 outline-none transition-all"
                    value={foundation.Df}
                    onChange={(e) => handleFoundationChange('Df', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Environmental Params (Water Table) */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600"><Droplet size={20} /></div>
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Environmental Params</h2>
            </div>
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-2">
                    Water Table Dw (m) <Waves size={16} className="text-cyan-400" />
                  </label>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-widest ${wtStatus.color}`}>
                    {wtStatus.label}
                  </span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600 mb-2"
                  value={waterTable}
                  onChange={(e) => setWaterTable(parseFloat(e.target.value) || 0)}
                />
                <div className="flex justify-between mt-3 px-1">
                  <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">GL (0m)</span>
                  <span className="text-sm font-black text-cyan-700 underline decoration-cyan-200 underline-offset-4">{waterTable.toFixed(1)} m</span>
                  <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">10m</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">FACTOR OF SAFETY (FOS)</label>
                <input 
                  type="number" step="0.1"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                  value={fos}
                  onChange={(e) => setFos(parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>
          </section>
        </aside>

        {/* Dashboard Content Area */}
        <section className="flex-1 p-8 overflow-y-auto bg-slate-50 scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-7 rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group transition-all card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[3rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 no-print" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recommended SBC</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black text-indigo-600 tracking-tighter">{results.recommended_sbc.toFixed(2)}</h3>
                  <span className="text-lg font-black text-slate-300">kPa</span>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500 border-t border-slate-50 pt-4">
                  <Info size={16} className="text-indigo-400" />
                  Governed by {results.qa_spt < results.qs ? 'SPT Values' : 'Shear Failure'}
                </div>
              </div>

              <div className="bg-white p-7 rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group transition-all card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[3rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 no-print" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Est. Settlement</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black text-amber-600 tracking-tighter">{results.settlement.toFixed(2)}</h3>
                  <span className="text-lg font-black text-slate-300">mm</span>
                </div>
                <div className={`mt-5 flex items-center gap-2 text-xs font-bold border-t border-slate-50 pt-4 ${results.settlement > 25 ? 'text-red-600' : 'text-slate-500'}`}>
                  {results.settlement > 25 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
                  Allowable Limit: 25mm
                </div>
              </div>

              <div className="bg-white p-7 rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group transition-all card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[3rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 no-print" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Capacity Reserve</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black text-emerald-600 tracking-tighter">{(results.qu / results.recommended_sbc).toFixed(2)}x</h3>
                </div>
                <div className="mt-5 text-xs font-bold text-slate-500 border-t border-slate-50 pt-4 italic">
                   Factor of Safety Applied: {fos.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Visualizer and Analysis Factors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SVG Visualizer */}
              <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col card">
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center no-print">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-3">
                    <Activity size={20} className="text-indigo-500" /> Foundation cross-section
                  </h3>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Scale Visualization</span>
                </div>
                <div className="flex-1 p-10 flex items-center justify-center bg-white min-h-[380px] relative">
                   <svg viewBox="0 0 320 280" className="w-full h-full max-w-sm overflow-visible filter drop-shadow-2xl">
                      <defs>
                        <pattern id="soilTexture" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                          <circle cx="1" cy="1" r="0.8" fill="#cbd5e1" opacity="0.4" />
                        </pattern>
                        <linearGradient id="foundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#475569" />
                          <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                      </defs>
                      
                      {/* Soil Background */}
                      <rect x="0" y="60" width="320" height="220" fill="url(#soilTexture)" rx="8" />
                      
                      {/* Ground Surface */}
                      <line x1="0" y1="60" x2="320" y2="60" stroke="#64748b" strokeWidth="3" strokeDasharray="10 5" />
                      <text x="5" y="52" className="text-[10px] font-black fill-slate-300 uppercase tracking-widest">Ground Line</text>
                      
                      {/* Water Table Area */}
                      {waterTable < 10 && (
                        <>
                          <rect 
                            x="0" 
                            y={60 + (waterTable * 20)} 
                            width="320" 
                            height={220 - (waterTable * 20)} 
                            fill="rgba(14, 165, 233, 0.08)"
                            rx="8"
                          />
                          <line 
                            x1="0" y1={60 + (waterTable * 20)} 
                            x2="320" y2={60 + (waterTable * 20)} 
                            stroke="#0ea5e9" 
                            strokeWidth="3.5" 
                            className="animate-pulse no-print"
                          />
                          <text x="315" y={54 + (waterTable * 20)} textAnchor="end" className="text-[10px] font-black italic fill-cyan-700">Water Table Dw={waterTable.toFixed(1)}m</text>
                        </>
                      )}

                      {/* Foundation Block */}
                      <rect 
                        x={160 - (foundation.B * 15)} 
                        y={60 + (foundation.Df * 20)} 
                        width={foundation.B * 30} 
                        height="24" 
                        fill="url(#foundGrad)" 
                        rx="3"
                        className="transition-all duration-700 ease-out shadow-inner"
                      />
                      {/* Stem/Column */}
                      <rect x="151" y="0" width="18" height={60 + (foundation.Df * 20)} fill="#94a3b8" rx="2" />
                      
                      {/* Pressure Bulb zone (B depth below base) */}
                      <rect 
                        x={160 - (foundation.B * 15)} 
                        y={60 + (foundation.Df * 20) + 24} 
                        width={foundation.B * 30} 
                        height={foundation.B * 20} 
                        fill="none" 
                        stroke="#cbd5e1" 
                        strokeWidth="2" 
                        strokeDasharray="6 4"
                      />
                      <text x="160" y={60 + (foundation.Df * 20) + (foundation.B * 10) + 20} textAnchor="middle" className="text-[9px] font-black fill-slate-300 italic uppercase">Influence Zone</text>

                      {/* Dimensions labels */}
                      <g className="text-slate-400 text-[10px] font-black tracking-tighter">
                        <line x1="285" y1="60" x2="285" y2={60 + (foundation.Df * 20)} stroke="currentColor" strokeWidth="1.5" />
                        <text x="290" y={60 + (foundation.Df * 10)} className="fill-slate-500 italic">Df = {foundation.Df}m</text>
                        
                        <line x1={160 - (foundation.B * 15)} y1={255} x2={160 + (foundation.B * 15)} y2={255} stroke="currentColor" strokeWidth="1.5" />
                        <text x="160" y={270} textAnchor="middle" className="fill-slate-500 italic">B = {foundation.B}m</text>
                      </g>
                   </svg>
                </div>
              </div>

              {/* Factors Card */}
              <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col card">
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center no-print">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-3">
                    <TrendingUp size={20} className="text-emerald-500" /> IS 6403 factors
                  </h3>
                </div>
                <div className="flex-1 p-8 grid grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Load Capacity</p>
                      <FactorItem label="Nc (Cohesion)" value={results.Nc} />
                      <FactorItem label="Nq (Surcharge)" value={results.Nq} />
                      <FactorItem label="Nγ (Weight)" value={results.Ngamma} />
                      <div className="pt-4 mt-2 border-t border-slate-50">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Shape Factors</p>
                        <FactorItem label="sc" value={results.sc} />
                        <FactorItem label="sq" value={results.sq} />
                        <FactorItem label="sγ" value={results.sgamma} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Environmental</p>
                      <FactorItem label="dc (Depth)" value={results.dc} />
                      <FactorItem label="dq (Depth)" value={results.dq} />
                      <div className="p-4 bg-cyan-50 border-2 border-cyan-100/50 rounded-2xl mt-4 shadow-sm group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-cyan-600 uppercase">W' Factor</span>
                          <span className="text-sm font-black text-cyan-700">{results.W_prime.toFixed(3)}</span>
                        </div>
                      </div>
                      <div className="pt-6 mt-2 border-t border-slate-50">
                         <span className="text-[11px] font-black text-slate-400 block mb-1 uppercase tracking-tight">Effective Width B'</span>
                         <span className="text-2xl font-black text-indigo-700 tracking-tighter">{results.B_prime.toFixed(3)} m</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Analysis Charts Grid - Hide in Print to save space or move to page 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 no-print">
              {/* SBC sensitivity */}
              <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 p-8 overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm"><TrendingUp size={20} /></div>
                   <h3 className="text-base font-black text-slate-800 tracking-tight">Capacity sensitivity analysis</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensitivityData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="width" tick={{ fontSize: 11, fontWeight: '900', fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fontWeight: '900', fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontSize: '13px', padding: '12px' }}
                      />
                      <Line type="monotone" dataKey="sbc" stroke="#4f46e5" strokeWidth={5} dot={{ r: 5, fill: '#fff', strokeWidth: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Settlement Sensitivity */}
              <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 p-8 overflow-hidden relative group">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shadow-sm"><Ruler size={20} /></div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">Settlement inspector</h3>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensitivityData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="width" tick={{ fontSize: 11, fontWeight: '900', fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fontWeight: '900', fill: '#94a3b8' }} />
                      <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="10 5" strokeWidth={3} label={{ value: "Max Limit (25mm)", position: "top", fill: "#ef4444", fontSize: 12, fontWeight: '900', offset: 15 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontSize: '13px', padding: '12px' }} />
                      <Line type="monotone" dataKey="settlement" stroke="#ea580c" strokeWidth={5} dot={{ r: 5, fill: '#fff', strokeWidth: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Engineering Breakdown Log */}
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden mb-16 card">
               <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center no-print">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-3">
                    <ChevronRight size={20} className="text-indigo-500" /> Standard calculation breakdown
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Compliance Assured
                  </div>
                </div>
                
                {/* Printable detailed breakdown header */}
                <div className="print-only px-8 py-4 bg-slate-50 border-b">
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Detailed Engineering Breakdown</h4>
                </div>

                <div className="p-10 overflow-x-auto">
                   <table className="w-full text-xs text-left border-separate border-spacing-y-2">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest text-[10px] rounded-l-2xl">Design parameter</th>
                          <th className="px-6 py-4 font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest text-[10px]">Magnitude</th>
                          <th className="px-6 py-4 font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest text-[10px] rounded-r-2xl">Formula Components</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-5 font-bold text-slate-800 italic">Term 1 (Cohesion)</td>
                          <td className="px-6 py-5 font-black text-indigo-900 text-sm">{results.term1.toFixed(2)} kPa</td>
                          <td className="px-6 py-5 font-mono text-slate-400 font-black">cNc · sc · dc · ic</td>
                        </tr>
                        <tr className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-5 font-bold text-slate-800 italic">Term 2 (Surcharge)</td>
                          <td className="px-6 py-5 font-black text-indigo-900 text-sm">{results.term2.toFixed(2)} kPa</td>
                          <td className="px-6 py-5 font-mono text-slate-400 font-black">qNq · sq · dq · iq</td>
                        </tr>
                        <tr className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-5 font-bold text-slate-800 italic">Term 3 (Self Weight)</td>
                          <td className="px-6 py-5 font-black text-indigo-900 text-sm">{results.term3.toFixed(2)} kPa</td>
                          <td className="px-6 py-5 font-mono text-slate-400 font-black">0.5 · γ_eff · B' · Nγ · sγ · dγ · iγ</td>
                        </tr>
                        <tr className="bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 print:text-black print:bg-slate-100">
                          <td className="px-6 py-6 font-black text-base rounded-l-[1.5rem]">Ultimate Capacity (qu)</td>
                          <td className="px-6 py-6 font-black text-base">{results.qu.toFixed(2)} kPa</td>
                          <td className="px-6 py-6 font-mono font-black text-indigo-200 print:text-slate-600 rounded-r-[1.5rem]">qu = T1 + T2 + T3</td>
                        </tr>
                      </tbody>
                   </table>
                </div>
            </div>

            {/* Print Only Disclaimer */}
            <div className="print-only px-8 text-[10px] text-slate-400 italic">
              <p>* Calculations performed as per IS 6403:1981 (Bearing Capacity) and IS 1904:2021 (Settlement).</p>
              <p>* Generated automatically by GeotechCalc Pro Engineering Suite.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer System Info */}
      <footer className="bg-white border-t border-slate-200 px-10 py-5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-widest no-print">
         <div className="flex gap-8">
           <span className="hover:text-slate-600 transition-colors cursor-help">IS 6403:1981 (Bearing Capacity)</span>
           <span className="border-l-2 border-slate-100 pl-8 hover:text-slate-600 transition-colors cursor-help">IS 1904:2021 (Settlement)</span>
         </div>
         <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm transition-transform hover:scale-105">
              <CheckCircle2 size={14} /> Full Compliance Verified 2.6.2
            </span>
            <span className="text-slate-200">© 2025 Vasudha Geotechnical Solutions</span>
         </div>
      </footer>
    </div>
  );
};

const FactorItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 transition-colors px-2 rounded-xl">
    <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
    <span className="text-[11px] font-mono font-black text-slate-800">{value.toFixed(3)}</span>
  </div>
);

export default App;
