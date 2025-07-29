import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";

const ADMIN_EMAIL = "gustavohmassaro@gmail.com";

function formatDateBR(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

export default function Admin() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // --- Estados dos treinos ---
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState("");
  const [vagas, setVagas] = useState(6);
  const [metodologia, setMetodologia] = useState("");
  const [msg, setMsg] = useState("");
  const [treinos, setTreinos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editDia, setEditDia] = useState("");
  const [editHora, setEditHora] = useState("");
  const [editVagas, setEditVagas] = useState(6);
  const [editMetodologia, setEditMetodologia] = useState("");

  useEffect(() => {
    async function fetchTreinos() {
      const q = query(collection(db, "treinos"), orderBy("dia"));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTreinos(lista);
    }
    fetchTreinos();
  }, [msg]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await addDoc(collection(db, "treinos"), {
        dia,
        hora,
        vagas: Number(vagas),
        metodologia,
      });
      setMsg("Treino cadastrado com sucesso!");
      setDia("");
      setHora("");
      setVagas(6);
      setMetodologia("");
      setTimeout(() => setMsg(""), 1800);
    } catch (e) {
      setMsg("Erro ao cadastrar treino!");
    }
  }

  async function removerTreino(id) {
    if (!window.confirm("Tem certeza que deseja remover este treino?")) return;
    await deleteDoc(doc(db, "treinos", id));
    setMsg("Treino removido!");
    setTimeout(() => setMsg(""), 1200);
  }

  function startEdit(t) {
    setEditId(t.id);
    setEditDia(t.dia);
    setEditHora(t.hora);
    setEditVagas(t.vagas);
    setEditMetodologia(t.metodologia || "");
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    await updateDoc(doc(db, "treinos", editId), {
      dia: editDia,
      hora: editHora,
      vagas: Number(editVagas),
      metodologia: editMetodologia,
    });
    setMsg("Treino editado!");
    setEditId(null);
    setTimeout(() => setMsg(""), 1300);
  }

  if (loading || !user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 540, width: "100%" }}>
        <h1>Painel do Professor</h1>
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <input
            type="date"
            value={dia}
            onChange={e => setDia(e.target.value)}
            required
          />
          <input
            type="time"
            value={hora}
            onChange={e => setHora(e.target.value)}
            required
          />
          <input
            type="number"
            value={vagas}
            onChange={e => setVagas(Math.max(1, parseInt(e.target.value) || 1))}
            placeholder="Vagas"
            min={1}
            required
          />
          <textarea
            value={metodologia}
            onChange={e => setMetodologia(e.target.value)}
            placeholder="Metodologia da semana, objetivos, fundamentos, etc..."
            style={{ minHeight: 56, resize: "vertical" }}
            required
          />
          <button type="submit" className="button success" style={{ width: "100%" }}>
            Adicionar Treino
          </button>
        </form>

        {msg && <div className="msg-success">{msg}</div>}

        <h2>Treinos Cadastrados</h2>
        <ul>
          {treinos.map((t) =>
            editId === t.id ? (
              <li key={t.id} className="card" style={{ background: "#f8fafb", marginBottom: 10 }}>
                <form onSubmit={salvarEdicao} className="flex" style={{ flexDirection: "column", gap: 8 }}>
                  <input
                    type="date"
                    value={editDia}
                    onChange={e => setEditDia(e.target.value)}
                    required
                  />
                  <input
                    type="time"
                    value={editHora}
                    onChange={e => setEditHora(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    value={editVagas}
                    onChange={e => setEditVagas(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    required
                  />
                  <textarea
                    value={editMetodologia}
                    onChange={e => setEditMetodologia(e.target.value)}
                    style={{ minHeight: 36, resize: "vertical" }}
                    required
                  />
                  <div className="flex" style={{ gap: 8 }}>
                    <button type="submit" className="button success">Salvar</button>
                    <button type="button" onClick={() => setEditId(null)} className="button danger">Cancelar</button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={t.id} className="card" style={{
                marginBottom: 10,
                display: "flex",
                flexDirection: "column",
                fontSize: 15
              }}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <span>
                    <b>{formatDateBR(t.dia)}</b> às <b>{t.hora}</b> — Vagas: <b>{t.vagas}</b>
                  </span>
                  <span>
                    <button
                      onClick={() => startEdit(t)}
                      className="button warning"
                      style={{ marginRight: 6 }}
                    >Editar</button>
                    <button
                      onClick={() => removerTreino(t.id)}
                      className="button danger"
                    >Remover</button>
                  </span>
                </div>
                <div style={{
                  color: "#3557a3",
                  fontSize: 14,
                  marginTop: 4,
                  background: "#eaf1ff",
                  borderRadius: 7,
                  padding: "7px 10px"
                }}>
                  <b>Metodologia:</b> <br />
                  {t.metodologia}
                </div>
              </li>
            )
          )}
          {treinos.length === 0 && <li style={{ color: "#aaa", textAlign: "center" }}>Nenhum treino cadastrado ainda.</li>}
        </ul>
      </div>
    </div>
  );
}
