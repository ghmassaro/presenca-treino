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

const ADMIN_EMAIL = "gustavohmassaro@gmail.com"; // <<-- seu email

function formatDateBR(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
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
  const [pix, setPix] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPagamento, setEditPagamento] = useState("");
  const [editPix, setEditPix] = useState("");

  useEffect(() => {
    async function fetchAlunos() {
      const q = query(collection(db, "alunos"), orderBy("nome"));
      const snap = await getDocs(q);
      setAlunos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchAlunos();
  }, [msg]);

  async function cadastrarAluno(e) {
    e.preventDefault();
    try {
      await addDoc(collection(db, "alunos"), {
        nome,
        email,
        pagamento,
        pix,
      });
      setNome(""); setEmail(""); setPagamento(""); setPix("");
      setMsg("Aluno cadastrado!");
      setTimeout(() => setMsg(""), 1500);
    } catch (e) {
      setMsg("Erro ao cadastrar aluno.");
    }
  }

  async function removerAluno(id) {
    await deleteDoc(doc(db, "alunos", id));
    setMsg("Aluno removido!");
    setTimeout(() => setMsg(""), 1000);
  }

  function startEdit(a) {
    setEditId(a.id);
    setEditNome(a.nome);
    setEditEmail(a.email);
    setEditPagamento(a.pagamento || "");
    setEditPix(a.pix || "");
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    await updateDoc(doc(db, "alunos", editId), {
      nome: editNome,
      email: editEmail,
      pagamento: editPagamento,
      pix: editPix,
    });
    setEditId(null);
    setMsg("Aluno editado!");
    setTimeout(() => setMsg(""), 1300);
  }

  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="container">
      <div className="card">
        <h1>Cadastro de Alunos</h1>
        <form onSubmit={cadastrarAluno} style={{ marginBottom: 20 }}>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome do aluno"
            required
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email do aluno"
            required
            type="email"
          />
          <input
            type="date"
            value={pagamento}
            onChange={e => setPagamento(e.target.value)}
            required
          />
          <input
            value={pix}
            onChange={e => setPix(e.target.value)}
            placeholder="Telefone"
          />
          <button className="button" style={{ width: "100%" }}>Cadastrar</button>
        </form>

        {msg && <div className="msg-success">{msg}</div>}

        <h2>Lista de alunos</h2>
        <ul>
          {alunos.map(a =>
            editId === a.id ? (
              <li key={a.id} className="card" style={{ background: "#f8fafb" }}>
                <form onSubmit={salvarEdicao} className="flex" style={{ flexDirection: "column", gap: 8 }}>
                  <input
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    required
                  />
                  <input
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    required
                  />
                  <input
                    type="date"
                    value={editPagamento}
                    onChange={e => setEditPagamento(e.target.value)}
                    required
                  />
                  <input
                    value={editPix}
                    onChange={e => setEditPix(e.target.value)}
                    placeholder="Chave PIX"
                  />
                  <div className="flex">
                    <button type="submit" className="button secondary">Salvar</button>
                    <button type="button" onClick={() => setEditId(null)} className="button">Cancelar</button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={a.id} className="card" style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 15
              }}>
                <span>
                  <b>{a.nome}</b> <br />
                  <span style={{ color: "#888", fontSize: 13 }}>{a.email}</span>
                  <br />
                  <span style={{ color: "#377f38", fontSize: 13 }}>
                    {a.pagamento ? `Pagamento até: ${formatDateBR(a.pagamento)}` : "Sem data de pagamento"}
                  </span>
                  <br />
                  <span style={{ color: "#3557a3", fontSize: 13 }}>
                    {a.pix ? `PIX: ${a.pix}` : "Sem chave PIX"}
                  </span>
                </span>
                <div className="flex" style={{ gap: 6 }}>
                  <button
                    onClick={() => removerAluno(a.id)}
                    className="button danger"
                  >
                    Remover
                  </button>
                  <button
                    onClick={() => startEdit(a)}
                    className="button secondary"
                  >
                    Editar
                  </button>
                </div>
              </li>
            )
          )}
          {alunos.length === 0 && (
            <li style={{ color: "#aaa", textAlign: "center" }}>Nenhum aluno cadastrado ainda.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
