import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";

function formatDateBR(dataStr) {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function MeusTreinos() {
  const [user] = useAuthState(auth);
  const [treinos, setTreinos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchTreinos() {
      setLoading(true);
      const q = query(collection(db, "treinos"), orderBy("dia", "desc"));
      const snapshot = await getDocs(q);
      const arr = [];
      snapshot.forEach(doc => {
        const t = doc.data();
        arr.push({ id: doc.id, ...t });
      });
      setTreinos(arr);
      setLoading(false);
    }
    fetchTreinos();
  }, [user]);

  // Separe por previstos/realizados (usando a data de hoje)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const previstos = treinos.filter(t => t.dia && new Date(t.dia) >= hoje);
  const realizados = treinos.filter(t => t.dia && new Date(t.dia) < hoje);

  if (!user) {
    return (
      <div className="container card" style={{ textAlign: "center", marginTop: 60 }}>
        <h2>Faça login para ver seus treinos.</h2>
        <Link href="/login" className="button success" style={{ marginTop: 18 }}>
          Ir para login
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 600, margin: "36px auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: 26 }}>Meus Treinos</h1>

        <section>
          <h2 style={{ color: "#22bb55" }}>Previstos</h2>
          {loading ? (
            <div>Carregando...</div>
          ) : previstos.length === 0 ? (
            <div style={{ color: "#888" }}>Nenhum treino previsto!</div>
          ) : (
            <ul>
              {previstos.map(t => (
                <li
                  key={t.id}
                  className="card"
                  style={{
                    background: "#c7f9cc",
                    marginBottom: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    fontSize: 15
                  }}
                >
                  <b style={{ color: "#117a43", fontSize: 17 }}>{t.dia && formatDateBR(t.dia)}</b>
                  <span>Horário: <b>{t.hora}</b></span>
                  <span>Vagas: <b>{t.vagas}</b></span>
                  {t.metodologia && (
                    <span style={{ marginTop: 7, fontSize: 14, color: "#347155" }}>
                      <b>Metodologia:</b> {t.metodologia}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 style={{ color: "#f08a4b" }}>Realizados</h2>
          {loading ? (
            <div>Carregando...</div>
          ) : realizados.length === 0 ? (
            <div style={{ color: "#888" }}>Nenhum treino realizado ainda.</div>
          ) : (
            <ul>
              {realizados.map(t => (
                <li
                  key={t.id}
                  className="card"
                  style={{
                    background: "#ffd6a5",
                    marginBottom: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    fontSize: 15
                  }}
                >
                  <b style={{ color: "#af6609", fontSize: 17 }}>{t.dia && formatDateBR(t.dia)}</b>
                  <span>Horário: <b>{t.hora}</b></span>
                  <span>Vagas: <b>{t.vagas}</b></span>
                  {t.metodologia && (
                    <span style={{ marginTop: 7, fontSize: 14, color: "#a56e00" }}>
                      <b>Metodologia:</b> {t.metodologia}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
