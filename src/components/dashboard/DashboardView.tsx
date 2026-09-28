import React, { useState, useRef } from 'react';

type Movement = {
  id: number;
  type: 'ingreso' | 'gasto';
  description: string;
  category: string;
  amount: number;
  date: string;
  file?: { name: string; type: string; url?: string };
};

export const DashboardView: React.FC<{ user?: { name: string } }> = ({}) => {
  const [movements, setMovements] = useState<Movement[]>([
    { id: 1, type: 'gasto', description: 'Super', category: 'Alimentación', amount: 2500, date: '2026-09-28' }
  ]);
  const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentación');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2026-09-28');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const totalIngresos = movements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0);
  const totalGastos = movements.filter(m => m.type === 'gasto').reduce((s, m) => s + m.amount, 0);
  const saldo = totalIngresos - totalGastos;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
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
      file: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.type
      } : undefined
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
    <div style={{minHeight:'100vh', background:'#f5f5f5', padding:'20px', maxWidth:'1200px', margin:'0 auto', fontFamily:'system-ui, sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'24px'}}>$</span>
          <div>
            <h1 style={{margin:0, fontSize:'22px', fontWeight:'bold'}}>Libro</h1>
            <p style={{margin:0, color:'#666', fontSize:'14px'}}>Control de gastos e ingresos personales</p>
          </div>
        </div>
        <span style={{color:'#666', fontSize:'14px'}}>Lunes, 28 de septiembre de 2026</span>
      </header>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'15px', marginBottom:'30px'}}>
        <div style={{background:'white', padding:'20px', borderRadius:'10px', borderLeft:'4px solid #10b981'}}>
          <p style={{color:'#666', fontSize:'13px', margin:0}}>↑ INGRESOS TOTALES</p>
          <p style={{fontSize:'24px', fontWeight:'bold', margin:'5px 0'}}>${totalIngresos.toFixed(2)}</p>
          <p style={{color:'#999', fontSize:'12px', margin:0}}>{movements.filter(m=>m.type==='ingreso').length} movimientos</p>
        </div>
        <div style={{background:'white', padding:'20px', borderRadius:'10px', borderLeft:'4px solid #ef4444'}}>
          <p style={{color:'#666', fontSize:'13px', margin:0}}>↓ GASTOS TOTALES</p>
          <p style={{fontSize:'24px', fontWeight:'bold', margin:'5px 0'}}>${totalGastos.toFixed(2)}</p>
          <p style={{color:'#999', fontSize:'12px', margin:0}}>{movements.filter(m=>m.type==='gasto').length} movimientos</p>
        </div>
        <div style={{background:'white', padding:'20px', borderRadius:'10px', borderLeft:'4px solid #f59e0b'}}>
          <p style={{color:'#666', fontSize:'13px', margin:0}}>SALDO DISPONIBLE</p>
          <p style={{fontSize:'24px', fontWeight:'bold', margin:'5px 0', color:saldo>=0?'#d97706':'#b91c1c'}}>${saldo.toFixed(2)}</p>
          <p style={{color:'#999', fontSize:'12px', margin:0}}>{saldo>=0?'Saldo positivo':'Saldo negativo — revisa tus gastos'}</p>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
        <div style={{background:'white', padding:'25px', borderRadius:'10px'}}>
          <h2 style={{fontSize:'18px', margin:'0 0 5px 0'}}>Nuevo movimiento</h2>
          <p style={{color:'#666', fontSize:'13px', margin:'0 0 20px 0'}}>Completa los datos y guárdalo en tu libro.</p>

          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <button onClick={()=>setType('ingreso')} style={{
              flex:1, padding:'10px', border:'none', borderRadius:'6px', fontSize:'15px', cursor:'pointer',
              background: type==='ingreso'?'#d1fae5':'#f3f4f6', color: type==='ingreso'?'#065f46':'#374151'
            }}>↑ Ingreso</button>
            <button onClick={()=>setType('gasto')} style={{
              flex:1, padding:'10px', border:'none', borderRadius:'6px', fontSize:'15px', cursor:'pointer',
              background: type==='gasto'?'#fee2e2':'#f3f4f6', color: type==='gasto'?'#991b1b':'#374151'
            }}>↓ Gasto</button>
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', fontSize:'13px', fontWeight:'500', marginBottom:'5px'}}>Descripción</label>
            <input type="text" value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="Ej: Sueldo, alquiler, supermercado..."
              style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', fontSize:'13px', fontWeight:'500', marginBottom:'5px'}}>Categoría</label>
            <select value={category} onChange={e=>setCategory(e.target.value)}
              style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}}>
              {categorias.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
            <div style={{flex:1}}>
              <label style={{display:'block', fontSize:'13px', fontWeight:'500', marginBottom:'5px'}}>Monto</label>
              <input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}
                placeholder="0,00"
                style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
            </div>
            <div style={{flex:1}}>
              <label style={{display:'block', fontSize:'13px', fontWeight:'500', marginBottom:'5px'}}>Fecha</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
            </div>
          </div>

          {/* === SECCIÓN DE ARCHIVOS Y CÁMARA === */}
          <div style={{marginBottom:'15px', padding:'15px', background:'#f9fafb', borderRadius:'8px', border:'1px dashed #ccc'}}>
            <label style={{display:'block', fontSize:'13px', fontWeight:'500', marginBottom:'10px'}}>📎 Comprobante / Recibo</label>
            
            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
              <button type="button" onClick={()=>fileInputRef.current?.click()} style={{
                flex:1, padding:'10px', background:'#eef2ff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px'
              }}>📄 Subir archivo</button>
              <button type="button" onClick={()=>cameraInputRef.current?.click()} style={{
                flex:1, padding:'10px', background:'#ecfdf5', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px'
              }}>📷 Tomar foto</button>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.gif" style={{display:'none'}} />
            <input type="file" ref={cameraInputRef} onChange={handleFileSelect}
              accept="image/*" capture="environment" style={{display:'none'}} />

            {selectedFile && (
              <div style={{marginTop:'10px', padding:'10px', background:'white', borderRadius:'6px'}}>
                <p style={{margin:0, fontSize:'13px', color:'#047857'}}>✅ {selectedFile.name}</p>
                {previewUrl && (
                  <img src={previewUrl} alt="Vista previa" style={{maxWidth:'100%', marginTop:'8px', borderRadius:'4px'}} />
                )}
              </div>
            )}
          </div>

          <div style={{display:'flex', gap:'10px'}}>
            <button onClick={guardar} style={{
              flex:1, padding:'12px', background:'#374151', color:'white', border:'none', borderRadius:'6px', fontSize:'15px', cursor:'pointer'
            }}>Guardar movimiento</button>
            <button onClick={limpiar} style={{
              padding:'12px 20px', background:'transparent', border:'none', color:'#666', cursor:'pointer', fontSize:'14px'
            }}>Limpiar</button>
          </div>
        </div>

        <div style={{background:'white', padding:'25px', borderRadius:'10px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h2 style={{fontSize:'18px', margin:0}}>Movimientos</h2>
            <div style={{display:'flex', gap:'8px'}}>
              <span style={{fontSize:'13px', color:'#666'}}>Buscar</span>
              <span style={{fontSize:'13px', color:'#666'}}>Todas las categorías ▾</span>
            </div>
          </div>

          {movements.length === 0 ? (
            <p style={{color:'#999', textAlign:'center', padding:'30px'}}>No hay movimientos registrados</p>
          ) : (
            <div>
              <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', padding:'8px 0', borderBottom:'2px solid #eee', fontWeight:'bold', fontSize:'13px', color:'#666'}}>
                <span>DESCRIPCIÓN</span>
                <span>FECHA</span>
                <span>MONTO</span>
              </div>
              {movements.map(m => (
                <div key={m.id} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', padding:'12px 0', borderBottom:'1px solid #eee', alignItems:'center'}}>
                  <div>
                    <p style={{margin:0, fontWeight:'500'}}>{m.description}</p>
                    <p style={{margin:0, fontSize:'12px', color:'#888'}}>{m.category}</p>
                    {m.file && <p style={{margin:'4px 0 0 0', fontSize:'11px', color:'#047857'}}>📎 {m.file.name}</p>}
                  </div>
                  <span style={{fontSize:'13px'}}>{m.date.split('-').reverse().join('/')}</span>
                  <span style={{fontWeight:'bold', fontSize:'15px', color:m.type==='ingreso'?'#047857':'#b91c1c'}}>
                    {m.type==='ingreso'?'+':'-'}${m.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <p style={{textAlign:'right', fontSize:'12px', color:'#888', marginTop:'10px'}}>{movements.length} de {movements.length} movimiento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
