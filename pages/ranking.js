import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function Ranking() {
  const [alunos, setAlunos] = useState([]);
  const [max, setMax] = useState(1);

  useEffect(() => {
    async function fetchRanking() {
      const q = query(collection(db, 'alunos'), orderBy('pontuacao', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAlunos(data);
      const maior = Math.max(1, ...data.map(a => a.pontuacao || 0));
      setMax(maior);
    }
    fetchRanking();
  }, []);

  return (
    <div className="container py-4">
      <div className="mx-auto" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 className="text-center mb-4" style={{ color: 'var(--link-color)' }}>
          Ranking de Alunos
        </h1>
        <ol className="list-group list-group-numbered">
          {alunos.map((a, i) => (
            <li
              key={a.id}
              className="list-group-item"
            >
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  {i === 0 && '🥇 '}
                  {i === 1 && '🥈 '}
                  {i === 2 && '🥉 '}
                  {a.nome}
                </span>
                <span className="badge bg-primary rounded-pill">{a.pontuacao || 0}</span>
              </div>
              <div className="progress mt-2" style={{ height: '6px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${((a.pontuacao || 0) / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
          {alunos.length === 0 && (
            <li className="list-group-item text-center text-muted">
              Nenhum aluno cadastrado.
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}
