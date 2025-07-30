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

  if (loading) return <div className="container mt-5">Carregando...</div>;
  if (!user) return <div className="container mt-5">Faça login para acessar!</div>;

  return (
    <div className="container py-4">
      <div className="card mx-auto" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <h3 className="text-center text-primary mb-3">Área de Pagamento</h3>
          {uploadMsg && <div className="alert alert-info text-center">{uploadMsg}</div>}

          {adminView ? (
            <>
              <h5 className="text-success mb-3">Pagamentos dos Alunos</h5>
              {alunos.map((al) => (
                <div className="card mb-3" key={al.id}>
                  <div className="card-body">
                    <h5 className="card-title">{al.nome} <small className="text-muted">({al.email})</small></h5>
                    <p><strong>Valor:</strong> R$ {al.valor || "80,00"}</p>
                    <p><strong>Aulas/mês:</strong> {al.vezes || "1x"}</p>
                    <p><strong>Vencimento:</strong> {formatDateBR(al.pagamento)}</p>
                    <p><strong>Chave PIX:</strong> {al.pix || "Sem chave"}</p>
                    <p>
                      <strong>Status:</strong> {" "}
                      <span className={`badge ${al.status === "Pago" ? "bg-success" : al.status === "Aguardando Confirmação" ? "bg-warning text-dark" : "bg-danger"}`}>{al.status || "Pendente"}</span>
                    </p>
                    {al.comprovante && <p><i>Comprovante:</i> {al.comprovante}</p>}
                    <div className="d-flex flex-wrap gap-2">
                      <select className="form-select w-auto" value={al.status || "Pendente"} onChange={e => handleStatus(al.id, e.target.value)}>
                        <option value="Pendente">Pendente</option>
                        <option value="Aguardando Confirmação">Aguardando Confirmação</option>
                        <option value="Pago">Pago</option>
                      </select>
                      <button className={`btn ${editId === al.id ? "btn-secondary" : "btn-primary"}`} onClick={() => editId === al.id ? setEditId(null) : startEdit(al)}>
                        {editId === al.id ? "Cancelar" : "Editar dados"}
                      </button>
                    </div>
                    {editId === al.id && (
                      <form className="mt-3" onSubmit={ev => { ev.preventDefault(); salvarEdicao(al.id); }}>
                        <div className="row g-2">
                          <div className="col">
                            <input className="form-control" type="text" placeholder="Valor (R$)" value={editFields.valor} onChange={e => setEditFields(f => ({ ...f, valor: e.target.value }))} />
                          </div>
                          <div className="col">
                            <input className="form-control" type="text" placeholder="Aulas/Mês" value={editFields.vezes} onChange={e => setEditFields(f => ({ ...f, vezes: e.target.value }))} />
                          </div>
                          <div className="col">
                            <input className="form-control" type="date" value={editFields.pagamento} onChange={e => setEditFields(f => ({ ...f, pagamento: e.target.value }))} />
                          </div>
                          <div className="col">
                            <input className="form-control" type="text" placeholder="PIX" value={editFields.pix} onChange={e => setEditFields(f => ({ ...f, pix: e.target.value }))} />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-success mt-3">Salvar</button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            dados && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title text-primary">Olá, {dados.nome}!</h5>
                  <p><strong>Valor:</strong> R$ {dados.valor || "80,00"}</p>
                  <p><strong>Aulas/mês:</strong> {dados.vezes || "1x"}</p>
                  <p><strong>Vencimento:</strong> {formatDateBR(dados.pagamento)}</p>
                  <p><strong>Chave PIX:</strong> {dados.pix || "Sem chave"}</p>
                  <p><strong>Status:</strong> <span className={`badge ${dados.status === "Pago" ? "bg-success" : dados.status === "Aguardando Confirmação" ? "bg-warning text-dark" : "bg-danger"}`}>{dados.status || "Pendente"}</span></p>
                  {dados.comprovante && <p><i>Comprovante:</i> {dados.comprovante}</p>}
                  <form onSubmit={handleUpload} className="mt-3">
                    <div className="mb-2">
                      <label className="form-label">Enviar comprovante:</label>
                      <input className="form-control" type="file" accept="image/*,application/pdf" onChange={e => setComprovante(e.target.files[0])} />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Enviar comprovante</button>
                  </form>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
