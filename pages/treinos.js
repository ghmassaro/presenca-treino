import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, getDocs, addDoc, query, orderBy, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

// Função dia da semana + data
function diaSemanaData(dateString) {
  if (!dateString) return "";
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const [year, month, day] = dateString.split("-");
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return `${dias[d.getDay()]} • ${("0"+day).slice(-2)}/${("0"+month).slice(-2)}`;
}

export default function Treinos() {
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

  // Divide os treinos
  function isFuture(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const treinoDate = new Date(dateStr + "T00:00:00");
    today.setHours(0,0,0,0);
    treinoDate.setHours(0,0,0,0);
    return treinoDate >= today;
  }
  const proximosTreinos = treinos.filter(t => isFuture(t.dia));
  const realizadosTreinos = treinos.filter(t => !isFuture(t.dia));

  return (
    <div className="container" style={{ minHeight: "100vh", marginTop: 38 }}>
      <div className="card" style={{ maxWidth: 540, width: "100%", margin: "0 auto", padding: "32px 18px" }}>
        <h1 style={{
          fontSize: "1.7rem",
          color: "#377f38",
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 30,
          letterSpacing: "1px"
        }}>Próximos Treinos</h1>
        <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
          {proximosTreinos.map((t) => (
            <li key={t.id} style={{
              background: "#eaf7ef",
              borderRadius: 13,
              padding: 16,
              marginBottom: 13,
              display: "flex",
              flexDirection: "column",
              fontSize: 16,
              boxShadow: "0 2px 10px #0001"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <span>
                  <b style={{ color: "#2563eb" }}>{diaSemanaData(t.dia)}</b> &nbsp;
                  <span style={{ color: "#111" }}>às <b>{t.hora}</b></span>
                  <br />
                  <span style={{ fontSize: 14, color: "#347f38" }}>
                    Confirmados: <b>{t.confirmados}</b> / {t.vagas}
                  </span>
                </span>
                <button
                  className="button"
                  style={{
                    padding: "7px 18px",
                    background: presencas.includes(t.id)
                      ? "#29bf12"
                      : t.confirmados >= t.vagas
                        ? "#aaa"
                        : "#2563eb",
                    color: "#fff",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 7,
                    fontSize: 15,
                    minWidth: 130,
                    cursor: presencas.includes(t.id) || t.confirmados >= t.vagas ? "not-allowed" : "pointer",
                    opacity: presencas.includes(t.id) || t.confirmados >= t.vagas ? 0.7 : 1
                  }}
                  onClick={() =>
                    !presencas.includes(t.id) &&
                    t.confirmados < t.vagas &&
                    confirmarPresenca(t.id)
                  }
                  disabled={presencas.includes(t.id) || t.confirmados >= t.vagas}
                >
                  {presencas.includes(t.id)
                    ? "Presença Confirmada"
                    : t.confirmados >= t.vagas
                      ? "Lotado"
                      : "Confirmar"}
                </button>
              </div>
              <div style={{
                color: "#3557a3",
                fontSize: 15,
                background: "#f1f7ff",
                borderRadius: 7,
                padding: "7px 10px",
                marginTop: 2
              }}>
                <b>Metodologia:</b> <br />
                {t.metodologia}
              </div>
            </li>
          ))}
          {proximosTreinos.length === 0 && (
            <li style={{ color: "#aaa", textAlign: "center" }}>
              Nenhum treino futuro.
            </li>
          )}
        </ul>

        <h1 style={{
          fontSize: "1.17rem",
          margin: "34px 0 14px 0",
          color: "#ff7900",
          textAlign: "center",
          fontWeight: 600
        }}>Treinos Realizados</h1>
        <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
          {realizadosTreinos.map((t) => (
            <li key={t.id} style={{
              background: "#f9f9f9",
              borderRadius: 11,
              padding: 14,
              marginBottom: 10,
              display: "flex",
              flexDirection: "column",
              fontSize: 15,
              boxShadow: "0 1px 5px #0001"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <b style={{ color: "#376b3b" }}>{diaSemanaData(t.dia)}</b> &nbsp;
                  <span>às <b>{t.hora}</b></span>
                  <br />
                  <span style={{ fontSize: 13, color: "#888" }}>
                    Confirmados: <b>{t.confirmados}</b> / {t.vagas}
                  </span>
                </span>
                <span style={{
                  color: presencas.includes(t.id) ? "#2a9d5a" : "#d34545",
                  fontWeight: 700,
                  fontSize: 14
                }}>
                  {presencas.includes(t.id) ? "Compareceu" : "Não compareceu"}
                </span>
              </div>
              <div style={{
                color: "#3557a3",
                fontSize: 14,
                background: "#f1f7ff",
                borderRadius: 6,
                padding: "5px 10px",
                marginTop: 4
              }}>
                <b>Metodologia:</b> <br />
                {t.metodologia}
              </div>
            </li>
          ))}
          {realizadosTreinos.length === 0 && (
            <li style={{ color: "#aaa", textAlign: "center" }}>
              Nenhum treino realizado.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
