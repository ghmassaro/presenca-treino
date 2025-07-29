import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const ADMIN_EMAIL = "gustavohmassaro@gmail.com";

function formatDateBR(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

export default function Pagamento() {
  const [user, loading] = useAuthState(auth);
  const [dados, setDados] = useState(null);
  const [comprovante, setComprovante] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [adminView, setAdminView] = useState(false);
  const [alunoId, setAlunoId] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editFields, setEditFields] = useState({});

  useEffect(() => {
    if (!loading && user) {
      setAdminView(user.email === ADMIN_EMAIL);
      buscarDados(user);
      if (user.email === ADMIN_EMAIL) fetchAlunos();
    }
  }, [user, loading]);

  async function buscarDados(userObj) {
    if (!userObj) return;
    const q = query(collection(db, "alunos"), where("email", "==", userObj.email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const aluno = snap.docs[0].data();
      setAlunoId(snap.docs[0].id);
      setDados(aluno);
    }
  }

  async function fetchAlunos() {
    const snap = await getDocs(collection(db, "alunos"));
    setAlunos(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!comprovante) return;
    await updateDoc(doc(db, "alunos", alunoId), {
      comprovante: comprovante.name || "Enviado",
      status: "Aguardando Confirmação"
    });
    setUploadMsg("Comprovante enviado!");
    buscarDados(user);
    setTimeout(() => setUploadMsg(""), 1500);
  }

  async function handleStatus(id, novoStatus) {
    await updateDoc(doc(db, "alunos", id), { status: novoStatus });
    fetchAlunos();
    setUploadMsg("Status atualizado!");
    setTimeout(() => setUploadMsg(""), 1000);
  }

  function startEdit(al) {
    setEditId(al.id);
    setEditFields({
      valor: al.valor || "",
      vezes: al.vezes || "",
      pagamento: al.pagamento || "",
      pix: al.pix || "",
    });
  }

  async function salvarEdicao(id) {
    await updateDoc(doc(db, "alunos", id), editFields);
    setEditId(null);
    fetchAlunos();
    setUploadMsg("Dados alterados!");
    setTimeout(() => setUploadMsg(""), 1200);
  }

  if (loading) return <div className="container card" style={{ padding: 30 }}>Carregando...</div>;
  if (!user) return <div className="container card" style={{ padding: 30 }}>Faça login para acessar!</div>;

  return (
    <div className="container" style={{ minHeight: "100vh", paddingTop: 32 }}>
      <div className="card" style={{ maxWidth: 530, margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", color: "#2563eb", fontWeight: "bold", letterSpacing: ".05em", fontSize: 22, marginBottom: 20 }}>Área de Pagamento</h1>
        {uploadMsg && <div style={{ color: "#2563eb", margin: 12, textAlign: "center" }}>{uploadMsg}</div>}

        {adminView ? (
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: "24px 0 16px 0", color: "#377f38" }}>Pagamentos dos Alunos</h2>
            {alunos.map((al) => (
              <div key={al.id} className="card" style={{ background: "#f7f9fc", marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#255" }}>
                  {al.nome}
                  <span style={{ fontWeight: 400, fontSize: 13, color: "#888" }}> &nbsp;({al.email})</span>
                </div>
                <div style={{ margin: "7px 0", fontSize: 17 }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Valor:</span> <span style={{ color: "#111", fontSize: 21, fontWeight: 700 }}>R$ {al.valor || "80,00"}</span>
                </div>
                <div style={{ margin: "7px 0" }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Aulas/mês:</span> {al.vezes || "1x"}
                </div>
                <div style={{ margin: "7px 0" }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Vencimento:</span> {formatDateBR(al.pagamento)}
                </div>
                <div style={{ margin: "7px 0" }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Chave PIX:</span> <span style={{ fontFamily: "monospace", fontSize: 16, color: "#27499f" }}>{al.pix || "Sem chave"}</span>
                </div>
                <div style={{ margin: "7px 0" }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Status:</span>
                  <span style={{
                    fontWeight: 600,
                    padding: "2px 16px",
                    borderRadius: 15,
                    color: al.status === "Pago" ? "#138a13" : (al.status === "Aguardando Confirmação" ? "#b78100" : "#b53c00"),
                    background: al.status === "Pago"
                      ? "#c9f8d6"
                      : al.status === "Aguardando Confirmação"
                        ? "#fef5cc"
                        : "#ffe5e2",
                    marginLeft: 8
                  }}>
                    {al.status || "Pendente"}
                  </span>
                </div>
                {al.comprovante && <div style={{ fontSize: 13, color: "#377f38", marginBottom: 5 }}>Comprovante: <i>{al.comprovante}</i></div>}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <select value={al.status || "Pendente"} onChange={e => handleStatus(al.id, e.target.value)}>
                    <option value="Pendente">Pendente</option>
                    <option value="Aguardando Confirmação">Aguardando Confirmação</option>
                    <option value="Pago">Pago</option>
                  </select>
                  <button
                    onClick={() => editId === al.id ? setEditId(null) : startEdit(al)}
                    style={{
                      background: editId === al.id ? "#bbb" : "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      padding: "5px 13px",
                      cursor: "pointer"
                    }}>
                    {editId === al.id ? "Cancelar" : "Editar dados"}
                  </button>
                </div>
                {editId === al.id && (
                  <form
                    onSubmit={ev => {
                      ev.preventDefault();
                      salvarEdicao(al.id);
                    }}
                    style={{
                      marginTop: 14,
                      background: "#eaf1ff",
                      borderRadius: 9,
                      padding: 9,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8
                    }}
                  >
                    <label>Valor (R$):<input
                      type="text"
                      value={editFields.valor}
                      onChange={e => setEditFields(f => ({ ...f, valor: e.target.value }))}
                      style={{ padding: 7, borderRadius: 6, border: "1px solid #ddd", fontSize: 15, width: 120, marginLeft: 5 }}
                    /></label>
                    <label>Aulas/Mês:<input
                      type="text"
                      value={editFields.vezes}
                      onChange={e => setEditFields(f => ({ ...f, vezes: e.target.value }))}
                      style={{ padding: 7, borderRadius: 6, border: "1px solid #ddd", fontSize: 15, width: 120, marginLeft: 5 }}
                    /></label>
                    <label>Vencimento:<input
                      type="date"
                      value={editFields.pagamento}
                      onChange={e => setEditFields(f => ({ ...f, pagamento: e.target.value }))}
                      style={{ padding: 7, borderRadius: 6, border: "1px solid #ddd", fontSize: 15, width: 120, marginLeft: 5 }}
                    /></label>
                    <label>Chave PIX:<input
                      type="text"
                      value={editFields.pix}
                      onChange={e => setEditFields(f => ({ ...f, pix: e.target.value }))}
                      style={{ padding: 7, borderRadius: 6, border: "1px solid #ddd", fontSize: 15, width: 120, marginLeft: 5 }}
                    /></label>
                    <button
                      type="submit"
                      style={{
                        fontSize: 15,
                        padding: "7px 18px",
                        borderRadius: 6,
                        background: "#377f38",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        marginTop: 4
                      }}>
                      Salvar
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            {dados && (
              <div className="card" style={{ background: "#f7f9fc", maxWidth: 450, margin: "0 auto" }}>
                <div style={{ fontWeight: 700, fontSize: 19, color: "#2563eb", marginBottom: 6 }}>
                  Olá, {dados.nome}!
                </div>
                <div style={{ margin: "7px 0", fontSize: 17 }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Valor:</span> <span style={{ color: "#111", fontSize: 21, fontWeight: 700 }}>R$ {dados.valor || "80,00"}</span>
                </div>
                <div style={{ margin: "7px 0" }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Aulas/mês:</span> {dados.vezes || "1x"}
                </div>
                <div style={{ margin: "7px 0" }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Vencimento:</span> {formatDateBR(dados.pagamento)}
                </div>
                <div style={{ margin: "7px 0" }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Chave PIX:</span> <span style={{ fontFamily: "monospace", fontSize: 16, color: "#27499f" }}>{dados.pix || "Sem chave"}</span>
                </div>
                <div style={{ margin: "7px 0" }}>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Status:</span>
                  <span style={{
                    fontWeight: 600,
                    padding: "2px 16px",
                    borderRadius: 15,
                    color: dados.status === "Pago" ? "#138a13" : (dados.status === "Aguardando Confirmação" ? "#b78100" : "#b53c00"),
                    background: dados.status === "Pago"
                      ? "#c9f8d6"
                      : dados.status === "Aguardando Confirmação"
                        ? "#fef5cc"
                        : "#ffe5e2",
                    marginLeft: 8
                  }}>
                    {dados.status || "Pendente"}
                  </span>
                  {dados.status === "Pago" && <span style={{ marginLeft: 10, color: "green", fontWeight: 500 }}>✅ Pagamento Confirmado</span>}
                </div>
                {dados.comprovante && <div style={{ color: "#377f38", fontSize: 14 }}>Comprovante enviado: <i>{dados.comprovante}</i></div>}
                <form onSubmit={handleUpload} style={{ marginTop: 14 }}>
                  <label style={{ fontWeight: 500, color: "#444" }}>
                    Enviar comprovante:
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => setComprovante(e.target.files[0])}
                      style={{
                        display: "block", margin: "7px 0 0 0", fontSize: 15
                      }}
                    />
                  </label>
                  <button
                    className="button success"
                    style={{ width: 180, marginTop: 9, fontSize: 16, background: "#2563eb" }}
                  >Enviar comprovante</button>
                </form>
              </div>
            )}
            {!dados && <div style={{ margin: "40px 0", textAlign: "center" }}>Cadastro não encontrado.<br />Fale com o professor.</div>}
          </>
        )}
      </div>
    </div>
  );
}
