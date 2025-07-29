import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, getDocs, addDoc, query, orderBy, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

// Função de formatação para data brasileira
function formatDateBR(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}
function isFuture(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const treinoDate = new Date(dateStr + "T00:00:00");
  today.setHours(0,0,0,0);
  treinoDate.setHours(0,0,0,0);
  return treinoDate >= today;
}

export default function Index() {
  const [treinos, setTreinos] = useState([]);
  const [presencas, setPresencas] = useState([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    async function fetchTreinos() {
      const q = query(collection(db, "treinos"), orderBy("dia"));
      const snapshot = await getDocs(q);
      const lista = [];
      for (const doc of snapshot.docs) {
        const treino = { id: doc.id, ...doc.data() };
        // Conta confirmados
        const q2 = query(collection(db, "presencas"), where("treinoId", "==", treino.id));
        const presencasSnap = await getDocs(q2);
        treino.confirmados = presencasSnap.size;
        lista.push(treino);
      }
      setTreinos(lista);
    }
    fetchTreinos();
  }, []);

  useEffect(() => {
    async function fetchPresencas() {
      if (!user) return;
      const q = query(collection(db, "presencas"), where("email", "==", user.email));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => doc.data().treinoId);
      setPresencas(lista);
    }
    fetchPresencas();
  }, [user]);

  async function confirmarPresenca(treinoId) {
    if (!user) return;
    const q = query(collection(db, "presencas"), where("treinoId", "==", treinoId));
    const snapshot = await getDocs(q);

    const treino = treinos.find(t => t.id === treinoId);
    if (!treino) return;
    if (snapshot.size >= treino.vagas) {
      alert("Todas as vagas para esse treino já foram preenchidas!");
      return;
    }

    if (!presencas.includes(treinoId)) {
      await addDoc(collection(db, "presencas"), {
        treinoId,
        email: user.email,
        nome: user.displayName || "",
        confirmadoEm: new Date()
      });
      setPresencas([...presencas, treinoId]);
      setTreinos(prev =>
        prev.map(t =>
          t.id === treinoId
            ? { ...t, confirmados: t.confirmados + 1 }
            : t
        )
      );
    }
  }

  const proximosTreinos = treinos.filter(t => isFuture(t.dia));
  const realizadosTreinos = treinos.filter(t => !isFuture(t.dia));

  return (
    <div className="container">
      <div style={{ maxWidth: 560, margin: "36px auto" }}>
        <h1 style={{
          textAlign: "center",
          color: "#2773ba",
          marginBottom: 28,
          fontFamily: "'Montserrat', Arial, sans-serif",
          fontWeight: 700
        }}>Próximos Treinos</h1>
        <ul style={{padding: 0}}>
          {proximosTreinos.map((t) => (
            <li key={t.id} className="card" style={{
              background: "#f5faff",
              borderRadius: 14,
              padding: "18px 16px",
              marginBottom: 18,
              display: "flex",
              flexDirection: "column",
              fontSize: 16,
              boxShadow: "0 4px 16px #0001",
              border: "1px solid #e4f0fb"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 18
              }}>
                <span>
                  <b style={{ color: "#237b38", fontSize: 18 }}>{formatDateBR(t.dia)}</b> às <b>{t.hora}</b> <br />
                  <span style={{ fontSize: 15, color: "#236d35" }}>
                    Confirmados: <b>{t.confirmados}</b> / {t.vagas}
                  </span>
                </span>
                <button
                  className="button success"
                  disabled={presencas.includes(t.id) || t.confirmados >= t.vagas}
                  onClick={() =>
                    !presencas.includes(t.id) &&
                    t.confirmados < t.vagas &&
                    confirmarPresenca(t.id)
                  }
                  style={{
                    minWidth: 120,
                    padding: "10px 20px",
                    background: presencas.includes(t.id)
                      ? "#d4ffe7"
                      : t.confirmados >= t.vagas
                        ? "#e9e9ec"
                        : "#22bb55",
                    color: presencas.includes(t.id)
                      ? "#18a661"
                      : t.confirmados >= t.vagas
                        ? "#aaa"
                        : "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 15,
                    boxShadow: "0 2px 6px #c6ecd5",
                    cursor: presencas.includes(t.id) || t.confirmados >= t.vagas ? "not-allowed" : "pointer",
                    opacity: presencas.includes(t.id) || t.confirmados >= t.vagas ? 0.9 : 1,
                    transition: "background .18s"
                  }}
                >
                  {presencas.includes(t.id)
                    ? "Presença Confirmada"
                    : t.confirmados >= t.vagas
                      ? "Lotado"
                      : "Confirmar"}
                </button>
              </div>
              <div style={{
                color: "#245d91",
                fontSize: 15,
                marginTop: 10,
                background: "#f0f4fc",
                borderRadius: 7,
                padding: "8px 12px"
              }}>
                <b>Metodologia:</b> <br />
                {t.metodologia}
              </div>
            </li>
          ))}
          {proximosTreinos.length === 0 && (
            <li style={{ color: "#aaa", textAlign: "center", marginTop: 22 }}>
              Nenhum treino futuro.
            </li>
          )}
        </ul>

        <h1 style={{
          fontSize: "1.15rem",
          marginTop: 36,
          color: "#f08a4b",
          textAlign: "center",
          fontWeight: 700
        }}>Treinos Realizados</h1>
        <ul style={{padding: 0}}>
          {realizadosTreinos.map((t) => (
            <li key={t.id} className="card" style={{
              background: "#f7f7fa",
              padding: "17px 10px",
              marginBottom: 13,
              fontSize: 15,
              opacity: .93
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10
              }}>
                <span>
                  <b style={{ color: "#a6833a" }}>{formatDateBR(t.dia)}</b> às <b>{t.hora}</b>
                  <br />
                  Confirmados: <b>{t.confirmados}</b> / {t.vagas}
                </span>
                <span style={{
                  color: presencas.includes(t.id) ? "#22bb55" : "#d34545",
                  fontWeight: 600,
                  fontSize: 15,
                  marginRight: 10
                }}>
                  {presencas.includes(t.id) ? "Compareceu" : "Não compareceu"}
                </span>
              </div>
              <div style={{
                color: "#345",
                fontSize: 14,
                marginTop: 9,
                background: "#eaf1ff",
                borderRadius: 6,
                padding: "6px 10px"
              }}>
                <b>Metodologia:</b> <br />
                {t.metodologia}
              </div>
            </li>
          ))}
          {realizadosTreinos.length === 0 && (
            <li style={{ color: "#aaa", textAlign: "center", marginTop: 22 }}>
              Nenhum treino realizado.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
