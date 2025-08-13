import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, getDocs, addDoc, query, orderBy, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// Formata data dd/mm/aaaa
function formatDateBR(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

// Verifica se a data é hoje ou futura
function isFuture(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const treinoDate = new Date(dateStr + 'T00:00:00');
  today.setHours(0, 0, 0, 0);
  treinoDate.setHours(0, 0, 0, 0);
  return treinoDate >= today;
}

function dayOfWeek(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
}

export default function Index() {
  const [treinos, setTreinos] = useState([]);
  const [presencas, setPresencas] = useState([]);
  const [user] = useAuthState(auth);
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    async function fetchTreinos() {
      const q = query(collection(db, 'treinos'), orderBy('dia'));
      const snap = await getDocs(q);
      const lista = [];
      for (const docItem of snap.docs) {
        const t = { id: docItem.id, ...docItem.data(), confirmados: 0 };
        const presQ = query(
          collection(db, 'presencas'),
          where('treinoId', '==', t.id)
        );
        const presSnap = await getDocs(presQ);
        t.confirmados = presSnap.size;
        lista.push(t);
      }
      setTreinos(lista);
    }
    fetchTreinos();
  }, []);

  useEffect(() => {
    async function fetchPresencas() {
      if (!user) return;
      const q = query(
        collection(db, 'presencas'),
        where('email', '==', user.email)
      );
      const snap = await getDocs(q);
      setPresencas(snap.docs.map(d => d.data().treinoId));
    }
    fetchPresencas();
  }, [user]);

  async function confirmarPresenca(treinoId) {
    if (!user) return;
    const treino = treinos.find(t => t.id === treinoId);
    if (!treino) return;
    const presQ = query(
      collection(db, 'presencas'),
      where('treinoId', '==', treinoId)
    );
    const presSnap = await getDocs(presQ);
    if (presSnap.size >= treino.vagas) {
      alert('Todas as vagas foram preenchidas!');
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
        t.id === treinoId ? { ...t, confirmados: t.confirmados + 1 } : t
      ));
    }
  }

  const filtrados = treinos.filter(t => {
    if (month === 'all') return true;
    return new Date(t.dia + 'T00:00:00').getMonth() === month;
  });
  const proximos = filtrados.filter(t => isFuture(t.dia));
  const realizados = filtrados.filter(t => !isFuture(t.dia));

  return (
    <div className="container py-4">
      <h1 className="text-center text-primary mb-5">Agenda de Treinos</h1>
      <div className="mb-4 text-center">
        <select
          className="form-select d-inline w-auto"
          value={month}
          onChange={e => {
            const val = e.target.value;
            setMonth(val === 'all' ? 'all' : Number(val));
          }}
        >
          <option value="all">Todos os meses</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>{new Date(2020, i).toLocaleDateString('pt-BR', { month: 'long' })}</option>
          ))}
        </select>
      </div>

      <section className="mx-auto" style={{ maxWidth: '600px' }}>
        <h2 className="bg-menu text-light text-center p-3 rounded mb-4">
          Próximos Treinos
        </h2>
        <ul className="list-unstyled">
          {proximos.length === 0 && (
            <li className="text-center text-muted">Nenhum treino futuro.</li>
          )}
          {proximos.map(t => (
            <li key={t.id} className="card mb-3 shadow-sm">
              <div className="card-body d-flex flex-column flex-md-row align-items-start justify-content-between gap-3">
                <div>
                  <h5 className="text-secondary mb-1">
                    {formatDateBR(t.dia)} ({dayOfWeek(t.dia)}) às {t.hora}
                  </h5>
                  <p className="mb-1">
                    Confirmados: <strong>{t.confirmados}</strong> / {t.vagas}
                  </p>
                  <div className="alert alert-light py-2 mb-0">
                    <strong>Metodologia:</strong><br />{t.metodologia}
                  </div>
                </div>
                <button
                  className={`btn btn-${
                    presencas.includes(t.id)
                      ? 'secondary'
                      : t.confirmados >= t.vagas
                      ? 'warning'
                      : 'primary'
                  } mt-2 mt-md-0`}
                  disabled={presencas.includes(t.id) || t.confirmados >= t.vagas}
                  onClick={() => confirmarPresenca(t.id)}
                >
                  {presencas.includes(t.id)
                    ? 'Presença Confirmada'
                    : t.confirmados >= t.vagas
                    ? 'Lotado'
                    : 'Confirmar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-5" style={{ maxWidth: '600px' }}>
        <h2 className="bg-menu text-light text-center p-3 rounded mb-4">
          Treinos Realizados
        </h2>
        <ul className="list-unstyled">
          {realizados.length === 0 && (
            <li className="text-center text-muted">Nenhum treino realizado.</li>
          )}
          {realizados.map(t => (
            <li key={t.id} className="card mb-3 shadow-sm">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-muted mb-1">
                    {formatDateBR(t.dia)} ({dayOfWeek(t.dia)}) às {t.hora}
                  </h5>
                  <p className="mb-0">
                    Confirmados: <strong>{t.confirmados}</strong> / {t.vagas}
                  </p>
                </div>
                <span className={`badge bg-${presencas.includes(t.id) ? 'success' : 'danger'}`}>
                  {presencas.includes(t.id) ? 'Compareceu' : 'Não compareceu'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}