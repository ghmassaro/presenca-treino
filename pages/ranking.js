import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function Ranking() {
  const [alunos, setAlunos] = useState([]);

  useEffect(() => {
    async function fetchRanking() {
      const q = query(collection(db, 'alunos'), orderBy('pontuacao', 'desc'));
      const snap = await getDocs(q);
      setAlunos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
          {alunos.map(a => (
            <li
              key={a.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{a.nome}</span>
              <span className="badge bg-primary rounded-pill">{a.pontuacao || 0}</span>
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
