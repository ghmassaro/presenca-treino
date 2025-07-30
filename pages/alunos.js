import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";

const ADMIN_EMAIL = "gustavohmassaro@gmail.com";

// Formata data dd/mm/aaaa
function formatDateBR(date) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export default function Alunos() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPagamento, setEditPagamento] = useState("");
  const [editTelefone, setEditTelefone] = useState("");

  useEffect(() => {
    async function fetchAlunos() {
      const q = query(collection(db, "alunos"), orderBy("nome"));
      const snap = await getDocs(q);
      setAlunos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchAlunos();
  }, [msg]);

  async function cadastrarAluno(e) {
    e.preventDefault();
    await addDoc(collection(db, "alunos"), {
      nome,
      email,
      pagamento,
      telefone,
    });
    setMsg("Aluno cadastrado!");
    setNome(""); setEmail(""); setPagamento(""); setTelefone("");
    setTimeout(() => setMsg(""), 1500);
  }

  async function removerAluno(id) {
    await deleteDoc(doc(db, "alunos", id));
    setMsg("Aluno removido!");
    setTimeout(() => setMsg(""), 1200);
  }

  function startEdit(a) {
    setEditId(a.id);
    setEditNome(a.nome);
    setEditEmail(a.email);
    setEditPagamento(a.pagamento);
    setEditTelefone(a.telefone);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    await updateDoc(doc(db, "alunos", editId), {
      nome: editNome,
      email: editEmail,
      pagamento: editPagamento,
      telefone: editTelefone,
    });
    setMsg("Aluno editado!");
    setEditId(null);
    setTimeout(() => setMsg(""), 1300);
  }

  if (loading || !user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="container py-4">
      <div className="mx-auto" style={{ maxWidth: '600px', width: '100%' }}>
        {/* Título padronizado */}
        <h1 className="text-center mb-4" style={{ color: 'var(--link-color)' }}>
          Cadastro de Alunos
        </h1>

        <form onSubmit={cadastrarAluno} className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Nome do aluno"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <input
              type="email"
              className="form-control"
              placeholder="Email do aluno"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <input
              type="date"
              className="form-control"
              value={pagamento}
              onChange={e => setPagamento(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <input
              type="tel"
              className="form-control"
              placeholder="Telefone do aluno"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
            />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100">
              Cadastrar
            </button>
          </div>
        </form>

        {msg && <div className="alert alert-secondary text-center">{msg}</div>}

        {/* Lista */}
        <h5 className="text-center mb-3" style={{ color: 'var(--link-color)' }}>
          Lista de Alunos
        </h5>
        <ul className="list-group">
          {alunos.map(a => (
            <li key={a.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div>
                <strong style={{ color: 'var(--link-color)' }}>{a.nome}</strong><br />
                <small className="text-muted">{a.email}</small><br />
                <span style={{ color: 'var(--link-active-bg)' }}>
                  Pagamento até: {formatDateBR(a.pagamento)}
                </span><br />
                <span className="text-muted">
                  {a.telefone || 'Sem telefone'}
                </span>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => startEdit(a)}>
                  Editar
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => removerAluno(a.id)}>
                  Remover
                </button>
              </div>
            </li>
          ))}
          {alunos.length === 0 && (
            <li className="list-group-item text-center text-muted">
              Nenhum aluno cadastrado ainda.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}