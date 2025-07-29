import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  deleteDoc,
  doc
} from "firebase/firestore";

function formatDateBR(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

export default function Painel() {
  const [treinos, setTreinos] = useState([]);
  const [presencas, setPresencas] = useState({});
  const [alunos, setAlunos] = useState([]);
  const [treinoSelecionado, setTreinoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);

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
  }, []);

  useEffect(() => {
    async function fetchAlunos() {
      const q = query(collection(db, "alunos"), orderBy("nome"));
      const snapshot = await getDocs(q);
      setAlunos(snapshot.docs.map((doc) => doc.data()));
    }
    fetchAlunos();
  }, []);

  async function verPresencas(treinoId) {
    setLoading(true);
    const q = query(collection(db, "presencas"), where("treinoId", "==", treinoId));
    const snapshot = await getDocs(q);
    setPresencas({
      ...presencas,
      [treinoId]: snapshot.docs.map((doc) => ({ ...doc.data(), _id: doc.id })),
    });
    setTreinoSelecionado(treinoId);
    setLoading(false);
  }

  async function removerPresenca(docId, treinoId) {
    if (!window.confirm("Tem certeza que deseja remover esta presença?")) return;
    await deleteDoc(doc(db, "presencas", docId));
    verPresencas(treinoId);
  }

  return (
    <div className="container" style={{ minHeight: "100vh", marginTop: 36 }}>
      <div className="card" style={{ maxWidth: 700, width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.6rem", textAlign: "center", marginBottom: 24, color: "#2563eb", fontWeight: "bold" }}>
          Painel de Presenças
        </h1>
        <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
          {treinos.map((t) => (
            <li key={t.id} className="card" style={{
              background: "#f5f7fa",
              borderRadius: 12,
              padding: 18,
              marginBottom: 16,
              boxShadow: "0 1px 4px #0001"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <b>{formatDateBR(t.dia)}</b> às <b>{t.hora}</b> — Vagas: <b>{t.vagas}</b>
                </span>
                <button
                  className="button"
                  style={{
                    padding: "6px 20px",
                    fontSize: 15,
                    background: "#2563eb",
                    color: "#fff"
                  }}
                  onClick={() => verPresencas(t.id)}
                >
                  Ver Detalhes
                </button>
              </div>

              {treinoSelecionado === t.id && presencas[t.id] && (
                <div style={{
                  marginTop: 14,
                  background: "#fff",
                  borderRadius: 8,
                  padding: "16px 18px",
                  display: "flex",
                  gap: "32px",
                  flexWrap: "wrap",
                  boxShadow: "0 1px 6px #0001"
                }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <b style={{ color: "#23a85e" }}>✔ Confirmados:</b>
                    <ul style={{ margin: "10px 0", padding: 0 }}>
                      {presencas[t.id].length === 0 && (
                        <li style={{ color: "#aaa" }}>Ninguém confirmou ainda.</li>
                      )}
                      {presencas[t.id].map((p, idx) => (
                        <li key={idx} style={{
                          color: "#2a2",
                          fontWeight: 500,
                          padding: "3px 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom: "1px solid #e8ecf3"
                        }}>
                          <span>{p.nome ? p.nome : p.email}</span>
                          <button
                            style={{
                              marginLeft: 10,
                              background: "#e44",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              padding: "2px 12px",
                              cursor: "pointer",
                              fontSize: 13,
                              transition: ".15s"
                            }}
                            onClick={() => removerPresenca(p._id, t.id)}
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <b style={{ color: "#d34545" }}>✘ Não confirmados:</b>
                    <ul style={{ margin: "10px 0", padding: 0 }}>
                      {alunos
                        .filter(a =>
                          !presencas[t.id].some(p =>
                            (p.email || "").toLowerCase() === (a.email || "").toLowerCase()
                          )
                        )
                        .map((a, idx) => (
                          <li key={idx} style={{
                            color: "#b33",
                            fontWeight: 500,
                            padding: "3px 0"
                          }}>
                            {a.nome ? a.nome : a.email}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
              {loading && treinoSelecionado === t.id && (
                <div style={{ textAlign: "center", color: "#888", marginTop: 10 }}>Carregando...</div>
              )}
            </li>
          ))}
          {treinos.length === 0 && (
            <li style={{ color: "#aaa", textAlign: "center" }}>
              Nenhum treino cadastrado ainda.
            </li>
          )}
        </ul>
      </div>
      <style jsx>{`
        @media (max-width: 700px) {
          .card {
            padding: 10px 3vw;
          }
        }
        @media (max-width: 500px) {
          .card {
            padding: 5px 2vw;
          }
        }
      `}</style>
    </div>
  );
}
