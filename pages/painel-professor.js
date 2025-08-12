import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/router';

const ADMIN_EMAIL = 'gustavohmassaro@gmail.com';

function formatDateBR(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export default function PainelProfessor() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const [dia, setDia] = useState('');
  const [hora, setHora] = useState('');
  const [vagas, setVagas] = useState(6);
  const [metodologia, setMetodologia] = useState('');
  const [msg, setMsg] = useState('');
  const [treinos, setTreinos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editDia, setEditDia] = useState('');
  const [editHora, setEditHora] = useState('');
  const [editVagas, setEditVagas] = useState(6);
  const [editMetodologia, setEditMetodologia] = useState('');

  useEffect(() => {
    async function fetchTreinos() {
      const q = query(collection(db, 'treinos'), orderBy('dia'));
      const snap = await getDocs(q);
      setTreinos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchTreinos();
  }, [msg]);

  async function handleSubmit(e) {
    e.preventDefault();
    await addDoc(collection(db, 'treinos'), {
      dia,
      hora,
      vagas: Number(vagas),
      metodologia,
    });
    setMsg('Treino cadastrado!');
    setDia(''); setHora(''); setVagas(6); setMetodologia('');
    setTimeout(() => setMsg(''), 1800);
  }

  async function removerTreino(id) {
    if (!confirm('Tem certeza que deseja remover este treino?')) return;
    await deleteDoc(doc(db, 'treinos', id));
    setMsg('Treino removido!');
    setTimeout(() => setMsg(''), 1200);
  }

  function startEdit(t) {
    setEditId(t.id);
    setEditDia(t.dia);
    setEditHora(t.hora);
    setEditVagas(t.vagas);
    setEditMetodologia(t.metodologia || '');
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    await updateDoc(doc(db, 'treinos', editId), {
      dia: editDia,
      hora: editHora,
      vagas: Number(editVagas),
      metodologia: editMetodologia,
    });
    setMsg('Treino editado!');
    setEditId(null);
    setTimeout(() => setMsg(''), 1300);
  }

  if (loading || !user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="container py-4">
      <div className="mx-auto" style={{ maxWidth: '600px', width: '100%' }}>

        {/* Título do Painel */}
        <h3 className="text-center mb-4" style={{ color: 'var(--link-color)' }}>
          Painel do Professor
        </h3>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <input
                type="date"
                className="form-control"
                value={dia}
                onChange={e => setDia(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <input
                type="time"
                className="form-control"
                value={hora}
                onChange={e => setHora(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <input
                type="number"
                className="form-control"
                value={vagas}
                onChange={e => setVagas(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                required
              />
            </div>
            <div className="col-12">
              <textarea
                className="form-control"
                style={{ minHeight: '56px' }}
                value={metodologia}
                onChange={e => setMetodologia(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100 mt-3">
            Adicionar Treino
          </button>
        </form>

        {msg && <div className="alert alert-secondary py-2">{msg}</div>}

        {/* Subtítulo de Cadastro */}
        <h5 className="text-center mb-3" style={{ color: 'var(--link-color)' }}>
          Treinos Cadastrados
        </h5>
        <ul className="list-group">
          {treinos.map(t => (
            editId === t.id ? (
              <li key={t.id} className="list-group-item bg-light">
                <form onSubmit={salvarEdicao} className="row g-3">
                  <div className="col-12 col-md-6">
                    <input
                      type="date"
                      className="form-control"
                      value={editDia}
                      onChange={e => setEditDia(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <input
                      type="time"
                      className="form-control"
                      value={editHora}
                      onChange={e => setEditHora(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <input
                      type="number"
                      className="form-control"
                      value={editVagas}
                      onChange={e => setEditVagas(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <textarea
                      className="form-control"
                      value={editMetodologia}
                      onChange={e => setEditMetodologia(e.target.value)}
                      style={{ minHeight: '36px' }}
                      required
                    />
                  </div>
                  <div className="col-12 d-flex flex-column flex-md-row justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary flex-fill flex-md-none">Salvar</button>
                    <button type="button" className="btn btn-secondary flex-fill flex-md-none" onClick={() => setEditId(null)}>Cancelar</button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={t.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                  <strong>{formatDateBR(t.dia)}</strong> às <strong>{t.hora}</strong> — Vagas: <strong>{t.vagas}</strong>
                  <div className="small text-muted mt-1">{t.metodologia}</div>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => startEdit(t)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removerTreino(t.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            )
          ))}
          {treinos.length === 0 && (
            <li className="list-group-item text-center text-muted">Nenhum treino cadastrado ainda.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
