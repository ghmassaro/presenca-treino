import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/router';

// Formata data dd/mm/aaaa
function formatDateBR(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

// Define status de pagamento
function pagamentoStatus(pagamento) {
  if (!pagamento) return { texto: 'Não informado', cor: '#e55' };
  const hoje = new Date();
  const dataPag = new Date(pagamento + 'T00:00:00');
  return {
    texto: dataPag >= hoje ? 'Em dia' : 'Atrasado',
    cor: dataPag >= hoje ? 'var(--link-active-bg)' : '#e55'
  };
}

export default function Perfil() {
  const [user] = useAuthState(auth);
  const [aluno, setAluno] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchAluno() {
      if (!user) return;
      const q = query(collection(db, 'alunos'), where('email', '==', user.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAluno({ ...snap.docs[0].data(), _docId: snap.docs[0].id });
      }
    }
    fetchAluno();
  }, [user]);

  async function sair() {
    await auth.signOut();
    router.push('/login');
  }

  async function confirmarPagamento() {
    if (!aluno?._docId) return;
    const hoje = new Date().toISOString().slice(0,10);
    await updateDoc(doc(db, 'alunos', aluno._docId), { pagamento: hoje });
    setAluno(a => ({ ...a, pagamento: hoje }));
    alert('Pagamento confirmado!');
  }

  function copiarPix() {
    if (!aluno?.pix) return;
    navigator.clipboard.writeText(aluno.pix);
    alert('PIX copiado!');
  }

  if (!user) {
    return (
      <div className="container py-4">
        <div className="card mx-auto p-4 text-center" style={{ maxWidth: '400px' }}>
          Faça login para ver seu perfil.
        </div>
      </div>
    );
  }

  const status = pagamentoStatus(aluno?.pagamento);

  return (
    <div className="container py-4">
      <div className="card mx-auto p-4" style={{ maxWidth: '450px', width: '100%' }}>

        {/* Título */}
        <h1
          className="text-center mb-4"
          style={{ color: 'var(--link-color)' }}
        >
          Meu Perfil
        </h1>

        {/* Avatar */}
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="Avatar"
            className="d-block mx-auto rounded-circle mb-3"
            style={{
              width: 84,
              height: 84,
              objectFit: 'cover',
              border: '2px solid var(--link-active-bg)'
            }}
          />
        )}

        {/* Dados */}
        <div className="mb-3">
          <strong>Nome:</strong><br />
          {aluno?.nome || user.displayName}
        </div>
        <div className="mb-3">
          <strong>Email:</strong><br />
          {aluno?.email || user.email}
        </div>

        {/* Pagamento */}
        <div className="mb-3 p-3 rounded" style={{ background: '#f0f4fc' }}>
          <strong>Próximo Pagamento:</strong><br />
          {aluno?.pagamento
            ? formatDateBR(aluno.pagamento)
            : <span style={{ color: '#e55' }}>Não informado</span>
          }
          <br />
          <span style={{ color: status.cor, fontWeight: 'bold' }}>
            {status.texto}
          </span>
        </div>

        {/* PIX e Ações */}
        {aluno?.pix && (
          <div className="mb-3 text-center">
            <strong>PIX:</strong><br />
            <span style={{ color: 'var(--link-active-bg)' }}>{aluno.pix}</span>
            <br />
            <button
              className="btn btn-secondary me-2 mt-2"
              onClick={copiarPix}
            >
              Copiar PIX
            </button>
            <button
              className="btn btn-primary mt-2"
              onClick={confirmarPagamento}
            >
              Confirmar Pagamento
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          className="btn btn-danger w-100 mt-3"
          onClick={sair}
        >
          Sair
        </button>
      </div>
    </div>
  );
}