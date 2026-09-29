import React, { useState, useRef } from 'react';

type Movement = {
  id: number;
  type: 'ingreso' | 'gasto';
  description: string;
  category: string;
  amount: number;
  date: string;
  file?: { name: string; type: string };
};

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

export const DashboardView: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([
    { id: 1, type: 'gasto', description: 'Supermercado', category: 'Alimentación', amount: 2500, date: '2026-09-28' }
  ]);
  const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentación');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2026-09-28');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const totalIngresos = movements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0);
  const totalGastos = movements.filter(m => m.type === 'gasto').reduce((s, m) => s + m.amount, 0);
  const saldo = totalIngresos - totalGastos;

  const leerReciboConIA = async (archivo: File) => {
    if (!import.meta.env.VITE_GOOGLE_API_KEY) {
      alert('⚠️ Falta configurar la clave de API');
      return;
    }

    setIsReading(true);
    try {
      // Convertir imagen a base64
      const base64 = await new Promise<string>((resolve) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result?.toString().split(',')[1] || '');
        lector.readAsDataURL(archivo);
      });

      const respuesta = await fetch(
        https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GOOGLE_API_KEY},
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `Extrae de este recibo: descripción, monto total, fecha y categoría.
Categorías disponibles: Vivienda, Alimentación, Transporte, Salud, Entretenimiento, Educación, Otros.,
Responde SOLO en formato JSON así}:
{
  "descripcion": "...",
  "monto": 0.00,
  "fecha": "AAAA-MM-DD",
  "categoria": "..."
}` },
                { inline_data: { mime_type: archivo.type, data: base64 } }
              ]
            }]
          })
        }
      );

      const datos = await respuesta.json();
      const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extraer JSON de la respuesta
      const jsonMatch = texto.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const info = JSON.parse(jsonMatch[0]);
        if (info.descripcion) setDescription(info.descripcion);
        if (info.monto) setAmount(String(info.monto));
        if (info.fecha) setDate(info.fecha);
        if (info.categoria) setCategory(info.categoria);
      }
    } catch (error) {
      console.error('Error leyendo:', error);
      alert('No se pudo leer el recibo, llénalo tú por favor ✍️');
    }
    setIsReading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
      leerReciboConIA(file);
    }
  };

  const guardar = () => {
    if (!description || !amount || parseFloat(amount) <= 0) {
      alert('Completa descripción y monto ✅');
      return;
    }
    const nuevo: Movement = {
      id: Date.now(),
      type,
      description,
      category,
      amount: parseFloat(amount),
      date,
      file: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : undefined
    };
    setMovements([nuevo, ...movements]);
    setDescription('');
    setAmount('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const limpiar = () => {
    setDescription('');
    setAmount('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const categorias = ['Vivienda', 'Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Educación', 'Otros'];

  return (
    <div style={{minHeight:'100vh', background:'#f5f5f5', padding:'20px', maxWidth:'1200px', margin:'0 auto', fontFamily:'system-ui'}}>
      <header style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
        <div>
          <h1 style={{margin:0, fontSize:'22px'}}>💰 Libro de Gastos</h1>
          <p style={{margin:0, color:'#666', fontSize:'14px'}}>Lectura automática con IA</p>
        </div>
        <span style={{color:'#666', fontSize:'14px'}}>28/09/2026</span>
      </header>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'15px', marginBottom:'30px'}}>
        <div style={{background:'white', padding:'20px', borderRadius:'10px', borderLeft:'4px solid #10b981'}}>
          <p style={{color:'#666', fontSize:'13px'}}>↑ INGRESOS</p>
          <p style={{fontSize:'24px', fontWeight:'bold'}}>${totalIngresos.toFixed(2)}</p>
        </div>
        <div style={{background:'white', padding:'20px', borderRadius:'10px', borderLeft:'4px solid #ef4444'}}>
          <p style={{color:'#666', fontSize:'13px'}}>↓ GASTOS</p>
          <p style={{fontSize:'24px', fontWeight:'bold'}}>${totalGastos.toFixed(2)}</p>
        </div>
        <div style={{background:'white', padding:'20px', borderRadius:'10px', borderLeft:'4px solid #f59e0b'}}>
          <p style={{color:'#666', fontSize:'13px'}}>SALDO</p>
          <p style={{fontSize:'24px', fontWeight:'bold', color:saldo>=0?'#d97706':'#b91c1c'}}>${saldo.toFixed(2)}</p>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
        <div style={{background:'white', padding:'25px', borderRadius:'10px'}}>
          <h2 style={{fontSize:'18px', margin:'0 0 20px 0'}}>Nuevo movimiento</h2>

          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <button onClick={()=>setType('ingreso')} style={{
              flex:1, padding:'10px', border:'none', borderRadius:'6px',
              background: type==='ingreso'?'#d1fae5':'#f3f4f6',
              color: type==='ingreso'?'#065f46':'#374151'
            }}>↑ Ingreso</button>
            <button onClick={()=>setType('gasto')} style={{
              flex:1, padding:'10px', border:'none', borderRadius:'6px',
              background: type==='gasto'?'#fee2e2':'#f3f4f6',
              color: type==='gasto'?'#991b1b':'#374151'
            }}>↓ Gasto</button>
          </div>

          <div style={{marginBottom:'15px', padding:'15px', background:'#f9fafb', borderRadius:'8px', border:'1px dashed #ccc'}}>
            <label style={{display:'block', fontSize:'13px', fontWeight:'500', marginBottom:'10px'}}>📷 Recibo / Foto</label>
            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
              <button onClick={()=>fileInputRef.current?.click()} style={{
                flex:1, padding:'10px', background:'#eef2ff', border:'none', borderRadius:'6px', cursor:'pointer'
              }}>📄 Subir</button>
              <button onClick={()=>cameraInputRef.current?.click()} style={{
                flex:1, padding:'10px', background:'#ecfdf5', border:'none', borderRadius:'6px', cursor:'pointer'
              }}>📷 Cámara</button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect}
              accept="image/*,.pdf" style={{display:'none'}} />
            <input type="file" ref={cameraInputRef} onChange={handleFileSelect}
              accept="image/*" capture="environment" style={{display:'none'}} />
            
            {isReading && <p style={{color:'#3b82f6', fontSize:'13px'}}>🤖 La IA está leyendo... ⏳</p>}
            
            {selectedFile && (
              <div style={{marginTop:'10px', padding:'10px', background:'white', borderRadius:'6px'}}>
                <p style={{margin:0, fontSize:'13px', color:'#047857'}}>✅ {selectedFile.name}</p>
                {previewUrl && <img src={previewUrl} alt="Vista" style={{maxWidth:'100%', marginTop:'8px', borderRadius:'4px'}} />}
              </div>
            )}
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', fontSize:'13px', marginBottom:'5px'}}>Descripción</label>
            <input type="text" value={description} onChange={e=>setDescription(e.target.value)}
              style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', fontSize:'13px', marginBottom:'5px'}}>Categoría</label>
            <select value={category} onChange={e=>setCategory(e.target.value)}
              style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}}>
              {categorias.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
            <div style={{flex:1}}>
              <label style={{display:'block', fontSize:'13px', marginBottom:'5px'}}>Monto</label>
              <input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}
                style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
            </div>
            <div style={{flex:1}}>
              <label style={{display:'block', fontSize:'13px', marginBottom:'5px'}}>Fecha</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
            </div>
          </div>

          <div style={{display:'flex', gap:'10px'}}>
            <button onClick={guardar} style={{
              flex:1, padding:'12px', background:'#374151', color:'white', border:'none', borderRadius:'6px', fontSize:'15px'
            }}>💾 Guardar</button>
            <button onClick={limpiar} style={{padding:'12px', background:'transparent', border:'none', color:'#666'}}>Limpiar</button>
          </div>
        </div>

        <div style={{background:'white', padding:'25px', borderRadius:'10px'}}>
          <h2 style={{fontSize:'18px', margin:'0 0 20px 0'}}>Movimientos</h2>
          {movements.map(m => (
            <div key={m.id} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #eee'}}>
              <div>
                <p style={{margin:0, fontWeight:'500'}}>{m.description}</p>
                <p style={{margin:0, fontSize:'12px', color:'#888'}}>{m.category} · {m.date.split('-').reverse().join('/')}</p>
              </div>
              <span style={{fontWeight:'bold', color:m.type==='ingreso'?'#047857':'#b91c1c'}}>
                {m.type==='ingreso'?'+':'-'}${m.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
