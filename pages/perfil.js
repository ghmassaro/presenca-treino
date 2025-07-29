import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/router";

function formatDateBR(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}
function pagamentoStatus(pagamento) {
  if (!pagamento) return { texto: "Não informado", cor: "#e55" };
  const hoje = new Date();
  const dataPag = new Date(pagamento + "T00:00:00");
  if (dataPag >= hoje) return { texto: "Em dia", cor: "#26a65b" };
  return { texto: "Atrasado", cor: "#e55" };
}

export default function Perfil() {
  const [user] = useAuthState(auth);
  const [aluno, setAluno] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function buscarAluno() {
      if (!user) return;
      const q = query(collection(db, "alunos"), where("email", "==", user.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAluno({ ...snap.docs[0].data(), _docId: snap.docs[0].id });
      }
    }
    buscarAluno();
  }, [user]);

  async function sair() {
    await auth.signOut();
    router.push("/login");
  }

  function copiarPix() {
    if (!aluno?.pix) return;
    navigator.clipboard.writeText(aluno.pix);
    alert("PIX copiado!");
  }

  async function confirmarPagamento() {
    if (!aluno?._docId) return;
    await updateDoc(doc(db, "alunos", aluno._docId), {
      pagamento: new Date().toISOString().slice(0, 10)
    });
    setAluno(a => ({ ...a, pagamento: new Date().toISOString().slice(0, 10) }));
    alert("Pagamento confirmado!");
  }

  if (!user)
    return (
      <div className="container">
        <div className="card" style={{textAlign:"center"}}>Faça login para ver seu perfil.</div>
      </div>
    );

  return (
    <div className="container" style={{ minHeight: "100vh", marginTop: 36 }}>
      <div className="card" style={{
        maxWidth: 410, width: "100%", margin: "0 auto",
        display: "flex", flexDirection: "column", alignItems: "center", padding: 32
      }}>
        <h1 style={{
          fontSize: "1.5rem",
          color: "#2563eb",
          fontWeight: "bold",
          marginBottom: 18
        }}>Meu Perfil</h1>

        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="Avatar"
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              marginBottom: 11,
              border: "2.5px solid #eaf1ff",
              objectFit: "cover",
              background: "#f5f7fa",
              boxShadow: "0 2px 12px #0002"
            }}
          />
        )}

        <div style={{
          marginBottom: 10, textAlign: "center", width: "100%"
        }}>
          <b style={{ color: "#333" }}>Nome:</b> <br /> {aluno?.nome || user.displayName}
        </div>
        <div style={{
          marginBottom: 12, textAlign: "center", width: "100%"
        }}>
          <b style={{ color: "#333" }}>Email:</b> <br /> {aluno?.email || user.email}
        </div>
        <div style={{
          margin: "14px 0",
          color: pagamentoStatus(aluno?.pagamento).cor,
          fontWeight: 600,
          fontSize: 16,
          background: "#eaf1ff",
          borderRadius: 9,
          padding: "11px 13px",
          width: "100%",
          textAlign: "center"
        }}>
          <b style={{ color: "#3557a3" }}>Próximo pagamento até:</b> <br />
          {aluno?.pagamento
            ? formatDateBR(aluno.pagamento)
            : <span style={{ color: "#e55" }}>Não informado</span>
          }
          <br />
          <span>
            Status:{" "}
            <span style={{ fontWeight: "bold", color: pagamentoStatus(aluno?.pagamento).cor }}>
              {pagamentoStatus(aluno?.pagamento).texto}
            </span>
          </span>
        </div>

        {aluno?.pix && (
          <div style={{
            margin: "0 0 20px 0",
            padding: "10px 12px",
            background: "#eaf7ef",
            borderRadius: 7,
            color: "#237b38",
            fontSize: 16,
            textAlign: "center",
            width: "100%"
          }}>
            <b>PIX para pagamento:</b><br />
            <span style={{
              wordBreak: "break-all",
              fontSize: 15,
              background: "#fff",
              borderRadius: 5,
              padding: "4px 9px",
              display: "inline-block",
              margin: "4px 0"
            }}>
              {aluno.pix}
            </span>
            <br />
            <button
              onClick={copiarPix}
              style={{
                background: "#23a85e",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                padding: "7px 16px",
                margin: "9px 3px 0 0",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer"
              }}
            >Copiar PIX</button>
            <button
              onClick={confirmarPagamento}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                padding: "7px 16px",
                margin: "9px 0 0 3px",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer"
              }}
            >Confirmar Pagamento</button>
          </div>
        )}

        <button
          className="login-btn"
          style={{
            background: "#e55",
            marginTop: 10,
            width: "100%",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: 1,
            border: "none",
            padding: "10px 0"
          }}
          onClick={sair}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
