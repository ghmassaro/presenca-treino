import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Painel() {
  const [treinos, setTreinos] = useState([]);
  const [presencas, setPresencas] = useState({});
  const [alunos, setAlunos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user] = useAuthState(auth);

  useEffect(() => {
    async function fetchTreinos() {
      if (!user) return;
      const q = query(
        collection(db, "treinos"),
        where("professor", "==", user.email),
        orderBy("dia")
      );
      const snap = await getDocs(q);
      setTreinos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchTreinos();
  }, [user]);

  useEffect(() => {
    async function fetchAlunos() {
      const q = query(collection(db, "alunos"), orderBy("nome"));
      const snap = await getDocs(q);
      setAlunos(snap.docs.map(d => d.data()));
    }
    fetchAlunos();
  }, []);

  async function viewPresencas(id) {
    setLoading(true);
    const q = query(collection(db, "presencas"), where("treinoId", "==", id));
    const snap = await getDocs(q);
    setPresencas(prev => ({ ...prev, [id]: snap.docs.map(d => ({ _id: d.id, ...d.data() })) }));
    setSelected(id);
    setLoading(false);
  }

  async function removePresenca(docId, treinoId) {
    if (!confirm("Remover presença?")) return;
    await deleteDoc(doc(db, "presencas", docId));
    viewPresencas(treinoId);
  }

  if (!user) return null;

  return (
    <div className="container py-4">
      <div className="card mx-auto" style={{ maxWidth: '750px' }}>
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">Painel de Presenças</h3>
        </div>
        <ul className="list-group list-group-flush">
          {treinos.map(t => (
            <li key={t.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{t.dia.split('-').reverse().join('/')}</strong> às <strong>{t.hora}</strong>
                  <span className="ms-3 badge bg-secondary">Vagas: {t.vagas}</span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => viewPresencas(t.id)}
                >
                  Ver Detalhes
                </button>
              </div>
              {selected === t.id && (
                <div className="row mt-3">
                  <div className="col-md-6">
                    <h5 className="text-success">Confirmados</h5>
                    {loading && <div className="spinner-border text-success" role="status"><span className="visually-hidden">Carregando...</span></div>}
                    <ul className="list-group">
                      {(presencas[t.id] || []).length === 0
                        ? <li className="list-group-item text-muted">Nenhuma presença.</li>
                        : presencas[t.id].map(p => (
                          <li key={p._id} className="list-group-item d-flex justify-content-between align-items-center">
                            {p.nome || p.email}
                            <button className="btn btn-danger btn-sm" onClick={() => removePresenca(p._id, t.id)}>Remover</button>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h5 className="text-danger">Não Confirmados</h5>
                    <ul className="list-group">
                      {alunos
                        .filter(a => {
                          const semana = new Date(t.dia).toLocaleDateString('pt-BR', { weekday: 'long' });
                          const permitido = a.diasTreino ? a.diasTreino.toLowerCase().includes(semana.toLowerCase()) : true;
                          const jaConfirmado = (presencas[t.id] || []).some(p => p.email.toLowerCase() === a.email.toLowerCase());
                          return permitido && !jaConfirmado;
                        })
                        .map((a,i) => (
                          <li key={i} className="list-group-item">{a.nome || a.email}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          ))}
          {treinos.length === 0 && <li className="list-group-item text-center text-muted">Nenhum treino cadastrado.</li>}
        </ul>
      </div>
    </div>
  );
}