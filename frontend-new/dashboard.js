/* Omni IA Support — Auth do Dashboard
   Mantém compatibilidade com as chaves usadas pelo login.js e pela Home. */
(() => {
  "use strict";

  const CHAVE_USUARIO = "omni:usuario";
  const CHAVE_SESSAO = "omni:sessao";

  const pill = document.getElementById("user-pill");
  const perfilBox = document.getElementById("user-perfil-logado");
  const elNome = document.getElementById("user-nome");
  const elPapel = document.getElementById("user-papel");
  const elIniciais = document.getElementById("avatar-iniciais");
  const btnSair = document.getElementById("btn-sair");
  const saudacaoNome = document.getElementById("saudacao-nome");

  function lerSessao() {
    try {
      const raw = localStorage.getItem(CHAVE_USUARIO) ||
                  sessionStorage.getItem(CHAVE_SESSAO);
      return raw ? JSON.parse(raw) : null;
    } catch (erro) {
      console.warn("Não foi possível ler a sessão do usuário.", erro);
      return null;
    }
  }

  function calcularIniciais(nome) {
    if (typeof nome !== "string" || !nome.trim()) return "?";
    return nome.trim().split(/\s+/).slice(0, 2)
      .map(parte => parte.charAt(0)).join("").toUpperCase();
  }

  const usuario = lerSessao();

  if (pill) {
    if (usuario) {
      pill.dataset.logado = "true";
      if (perfilBox) perfilBox.hidden = false;

      const nome = usuario.nome || "Usuário";
      if (elNome) elNome.textContent = nome;
      if (elPapel) elPapel.textContent = usuario.papel || "Conta ativa";
      if (elIniciais) elIniciais.textContent = usuario.iniciais || calcularIniciais(nome);
      if (saudacaoNome) saudacaoNome.textContent = nome.trim().split(/\s+/)[0];
    } else {
      pill.dataset.logado = "false";
      if (perfilBox) perfilBox.hidden = true;
      if (saudacaoNome) saudacaoNome.textContent = "aqui";
    }
  }

  btnSair?.addEventListener("click", evento => {
    evento.preventDefault();
    evento.stopPropagation();
    localStorage.removeItem(CHAVE_USUARIO);
    sessionStorage.removeItem(CHAVE_SESSAO);
    window.location.href = "index.html";
  });

  // Os dois contadores são placeholders até a integração com o backend.
  const totalTraducoes = document.getElementById("total-traducoes");
  const totalConversas = document.getElementById("total-conversas");
  const ultimoAcesso = document.getElementById("ultimo-acesso");
  const dataAcesso = document.getElementById("data-acesso");
  const agora = new Date();

  if (totalTraducoes) totalTraducoes.textContent = "0";
  if (totalConversas) totalConversas.textContent = "0";

  if (ultimoAcesso) {
    ultimoAcesso.textContent = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit", minute: "2-digit"
    }).format(agora);
  }
  if (dataAcesso) {
    dataAcesso.textContent = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric"
    }).format(agora);
  }
})();