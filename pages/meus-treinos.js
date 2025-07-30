// pages/meus-treinos.js

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy, where, addDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';

// Formata data para dd/mm/aaaa
function formatDateBR(dataStr) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Verifica se a data é hoje ou futura
function isFuture(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  const treinoDate = new Date(dateStr + 'T00:00:00');
  treinoDate.setHours(0,0,0,0);
  return treinoDate >= today;
}

export default function MeusTreinos() {
  const [treinos, setTreinos] = useState([]);
  const [presencas, setPresencas] = useState([]);
  const [user, loading] = useAuthState(auth);

  // Busca treinos e contagem de confirmados
  useEffect(() => {
    async function fetchTreinos() {
      const q = query(collection(db, 'treinos'), orderBy('dia', 'desc'));
      const snap = await getDocs(q);
      const lista = [];
      for (const docItem of snap.docs) {
        const t = { id: docItem.id, ...docItem.data(), confirmados: 0 };
        // conta presenças
        const presQ = query(collection(db, 'presencas'), where('treinoId', '==', t.id));
        const presSnap = await getDocs(presQ);
        t.confirmados = presSnap.size;
        lista.push(t);
      }
      setTreinos(lista);
    }
    fetchTreinos();
  }, []);

  // Busca presenças do usuário
  useEffect(() => {
    async function fetchPresencas() {
      if (!user) return;
      const q = query(collection(db, 'presencas'), where('email', '==', user.email));
      const snap = await getDocs(q);
      setPresencas(snap.docs.map(d => d.data().treinoId));
    }
    fetchPresencas();
  }, [user]);

  // Confirma presença
  async function confirmarPresenca(treinoId) {
    if (!user) return;
    const treino = treinos.find(t => t.id === treinoId);
    if (!treino) return;
    // verifica vagas
    const presQ = query(collection(db, 'presencas'), where('treinoId', '==', treinoId));
    const presSnap = await getDocs(presQ);
    if (presSnap.size >= treino.vagas) {
      alert('Lotado!');
      return;
    }
    if (!presencas.includes(treinoId)) {
      await addDoc(collection(db, 'presencas'), {
        treinoId,
        email: user.email,
        nome: user.displayName || '',
        confirmadoEm: new Date()
      });
      setPresencas(prev => [...prev, treinoId]);
      setTreinos(prev => prev.map(t =>
        t.id === treinoId
          ? { ...t, confirmados: t.confirmados + 1 }
          : t
      ));
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '400px' }}>
          <div className="card-body text-center">
            <h5 className="card-title mb-3">Faça login para ver seus treinos</h5>
            <Link href="/login">
              <a className="btn btn-primary">Ir para Login</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const proximos = treinos.filter(t => isFuture(t.dia));
  const realizados = treinos.filter(t => !isFuture(t.dia));

  return (
    <div className="container py-4">
      <div className="mx-auto" style={{ maxWidth: '700px' }}>

        {/* Título: agora com fundo do menu */}
        <h1 className="bg-menu text-light text-center p-3 rounded mb-4">
          Próximos Treinos
        </h1>
        {proximos.length === 0 ? (
          <p className="text-center text-muted">Nenhum treino futuro.</p>
        ) : proximos.map(t => (
          <div key={t.id} className="card mb-3 shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <strong>{formatDateBR(t.dia)}</strong> às <strong>{t.hora}</strong><br/>
                Confirmados: <strong>{t.confirmados}</strong> / {t.vagas}
              </div>
              <button
                className={`btn btn-sm ${presencas.includes(t.id) ? 'btn-secondary' : 'btn-primary'}`}
                disabled={presencas.includes(t.id) || t.confirmados >= t.vagas}
                onClick={() => confirmarPresenca(t.id)}
              >
                {presencas.includes(t.id) ? 'Confirmado' : 'Confirmar'}
              </button>
            </div>
            {t.metodologia && (
              <div className="card-footer text-muted">
                <em>Metodologia:</em> {t.metodologia}
              </div>
            )}
          </div>
        ))}

        {/* Título Realizados */}
        <h1 className="bg-menu text-light text-center p-3 rounded mt-5 mb-4">
          Treinos Realizados
        </h1>
        {realizados.length === 0 ? (
          <p className="text-center text-muted">Nenhum treino realizado.</p>
        ) : realizados.map(t => (
          <div key={t.id} className="card mb-3 shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <strong>{formatDateBR(t.dia)}</strong> às <strong>{t.hora}</strong><br/>
                Confirmados: <strong>{t.confirmados}</strong> / {t.vagas}
              </div>
              <span className={`badge ${presencas.includes(t.id) ? 'bg-success' : 'bg-danger'}`}>
                {presencas.includes(t.id) ? 'Compareceu' : 'Não Compareceu'}
              </span>
            </div>
            {t.metodologia && (
              <div className="card-footer text-muted">
                <em>Metodologia:</em> {t.metodologia}
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}
