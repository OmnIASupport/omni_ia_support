/* =========================================================
   Omni IA Support — Perfil do Usuário

   - Sem token: tela bloqueada, com aviso de Login/Cadastro.
   - Com token: GET /usuarios/me preenche a tela.
   - Salvar: PATCH /usuarios/me e, depois da confirmação,
     atualiza o nome e a inicial no cabeçalho.
   ========================================================= */

(() => {
    "use strict";

    const API_URL = "http://127.0.0.1:8000";
    const CHAVE_TOKEN = "omni:token_acesso";
    const CHAVE_PERFIL = "omni:perfil-interface";
    const EVENTO_PERFIL = "omni:perfil-atualizado";
    const NIVEIS_VALIDOS = ["surdo", "ouvinte", "ambos"];

    const $ = (id) => document.getElementById(id);

    const avatarGrande = $("perfil-avatar");
    const nomeDisplay = $("perfil-nome-display");
    const emailDisplay = $("perfil-email-display");
    const nivelBadge = $("perfil-nivel");

    const form = $("form-perfil");
    const inputNome = $("edit-nome");
    const inputEmail = $("edit-email");
    const inputTelefone = $("edit-telefone");
    const inputNivel = $("edit-nivel");
    const msgErro = $("erro-perfil");
    const msgSucesso = $("sucesso-perfil");
    const btnSalvar = $("btn-salvar-perfil");
    const btnEncerrarSessao = $("btn-encerrar-sessao");

    const obrigatorios = [
        avatarGrande,
        nomeDisplay,
        emailDisplay,
        nivelBadge,
        form,
        inputNome,
        inputEmail,
        inputTelefone,
        inputNivel,
        msgErro,
        msgSucesso,
        btnSalvar,
        btnEncerrarSessao,
    ];

    if (obrigatorios.some((elemento) => !elemento)) {
        console.error(
            "Perfil: faltam elementos no HTML. Confira os IDs."
        );

        return;
    }

    let tokenDaSessao = null;
    let usuarioAtual = null;
    let salvando = false;
    let temporizadorSucesso = null;

    // ---------- Utilitários ----------
    const obterToken = () => {
        try {
            return localStorage.getItem(CHAVE_TOKEN);
        } catch {
            return null;
        }
    };

    const inicial = (nome) =>
        Array.from(String(nome || "").trim())[0]
            ?.toLocaleUpperCase("pt-BR") || "?";

    const traduzirNivel = (valor) => {
        if (valor === "surdo") return "Surdo";
        if (valor === "ouvinte") return "Ouvinte";
        if (valor === "ambos") return "Ambos";

        return "Não informado";
    };

    const soDigitos = (valor) =>
        String(valor || "").replace(/\D/g, "");

    function formatarTelefone(valor) {
        const d = soDigitos(valor).slice(0, 11);

        if (d.length <= 2) return d ? `(${d}` : "";

        if (d.length <= 6) {
            return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        }

        if (d.length <= 10) {
            return (
                `(${d.slice(0, 2)}) ` +
                `${d.slice(2, 6)}-${d.slice(6)}`
            );
        }

        return (
            `(${d.slice(0, 2)}) ` +
            `${d.slice(2, 7)}-${d.slice(7)}`
        );
    }

    // ---------- Validação ----------
    const DDDS_VALIDOS = new Set([
        11, 12, 13, 14, 15, 16, 17, 18, 19,
        21, 22, 24, 27, 28,
        31, 32, 33, 34, 35, 37, 38,
        41, 42, 43, 44, 45, 46, 47, 48, 49,
        51, 53, 54, 55,
        61, 62, 63, 64, 65, 66, 67, 68, 69,
        71, 73, 74, 75, 77, 79,
        81, 82, 83, 84, 85, 86, 87, 88, 89,
        91, 92, 93, 94, 95, 96, 97, 98, 99,
    ]);

    function validarNome(nome) {
        if (!nome) return "O nome não pode ficar vazio.";

        if (nome.length < 2) {
            return "O nome deve ter pelo menos 2 caracteres.";
        }

        if (nome.length > 150) {
            return "O nome de exibição deve ter até 150 caracteres.";
        }

        return null;
    }

    function validarTelefone(digitos) {
        if (!digitos) return null;

        if (![10, 11].includes(digitos.length)) {
            return "Informe um telefone com DDD e 10 ou 11 dígitos.";
        }

        if (!DDDS_VALIDOS.has(Number(digitos.slice(0, 2)))) {
            return "DDD inválido.";
        }

        if (digitos.length === 11 && digitos[2] !== "9") {
            return "O celular deve começar com 9 após o DDD.";
        }

        if (
            digitos.length === 10 &&
            !"2345".includes(digitos[2])
        ) {
            return "Telefone fixo inválido.";
        }

        return null;
    }

    // ---------- Mensagens ----------
    function limparMensagens() {
        clearTimeout(temporizadorSucesso);

        msgErro.replaceChildren();
        msgErro.hidden = true;

        msgSucesso.textContent = "";
        msgSucesso.hidden = true;
    }

    function mostrarErro(texto) {
        clearTimeout(temporizadorSucesso);

        msgSucesso.hidden = true;
        msgErro.replaceChildren();
        msgErro.textContent = texto;
        msgErro.hidden = false;
    }

    function mostrarSucesso(texto) {
        clearTimeout(temporizadorSucesso);

        msgErro.replaceChildren();
        msgErro.hidden = true;

        msgSucesso.textContent = texto;
        msgSucesso.hidden = false;

        temporizadorSucesso = setTimeout(() => {
            msgSucesso.hidden = true;
        }, 4000);
    }

    function mostrarAvisoLogin(prefixo = "") {
        clearTimeout(temporizadorSucesso);

        msgSucesso.hidden = true;
        msgErro.replaceChildren();

        const icone = document.createElement("i");
        icone.className = "fa-solid fa-lock";
        icone.setAttribute("aria-hidden", "true");

        const login = document.createElement("a");
        login.href = "login.html?redirect=perfil.html";
        login.textContent = "Login";

        const cadastro = document.createElement("a");
        cadastro.href = "cadastro.html";
        cadastro.textContent = "Cadastro";

        msgErro.append(
            icone,
            document.createTextNode(
                `${prefixo}Você precisa fazer `
            ),
            login,
            document.createTextNode(" ou "),
            cadastro,
            document.createTextNode(
                " para desbloquear esta página e editar seus dados."
            )
        );

        msgErro.hidden = false;
    }

    // ---------- Cabeçalho ----------
    function notificarCabecalho() {
        window.dispatchEvent(new CustomEvent(EVENTO_PERFIL));
    }

    function guardarNomeCabecalho(nome) {
        try {
            sessionStorage.setItem(
                CHAVE_PERFIL,
                JSON.stringify({ nome_exibicao: nome })
            );
        } catch {
            console.warn(
                "Não foi possível guardar o nome para o cabeçalho."
            );
        }

        notificarCabecalho();
    }

    function limparSessaoLocal() {
        try {
            localStorage.removeItem(CHAVE_TOKEN);
        } catch {
            // Verificado por quem chama.
        }

        try {
            sessionStorage.removeItem(CHAVE_PERFIL);
        } catch {
            // O nome é apenas apresentação.
        }

        tokenDaSessao = null;

        notificarCabecalho();
    }

    // ---------- Estado da tela ----------
    function definirEdicao(habilitada) {
        [inputNome, inputTelefone, inputNivel].forEach(
            (campo) => {
                campo.disabled = !habilitada;
            }
        );

        inputEmail.readOnly = true;

        btnSalvar.style.display = habilitada ? "" : "none";
    }

    function bloquearAcesso(prefixo = "") {
        usuarioAtual = null;

        definirEdicao(false);

        inputNome.value = "";
        inputEmail.value = "";
        inputTelefone.value = "";
        inputNivel.selectedIndex = -1;

        inputNome.placeholder = "Faça login para editar";
        inputTelefone.placeholder = "Faça login para editar";

        avatarGrande.textContent = "?";
        nomeDisplay.textContent = "Visitante";
        emailDisplay.textContent = "—";
        nivelBadge.textContent = "Nível: —";

        mostrarAvisoLogin(prefixo);
    }

    function preencherTela(usuario) {
        const nome = usuario.nome_exibicao;

        usuarioAtual = {
            nome_exibicao: nome,
            telefone_usuario: usuario.telefone_usuario ?? null,
            tipo_usuario: usuario.tipo_usuario,
        };

        avatarGrande.textContent = inicial(nome);
        nomeDisplay.textContent = nome;

        emailDisplay.textContent =
            usuario.email_usuario || "Não informado";

        nivelBadge.textContent =
            `Nível: ${traduzirNivel(usuario.tipo_usuario)}`;

        inputNome.value = nome;
        inputEmail.value = usuario.email_usuario || "";
        inputTelefone.value = formatarTelefone(
            usuario.telefone_usuario
        );

        inputNome.placeholder = "Seu nome";
        inputTelefone.placeholder = "(11) 99999-9999";

        const nivelEditavel = NIVEIS_VALIDOS.includes(
            usuario.tipo_usuario
        );

        inputNivel.value = nivelEditavel
            ? usuario.tipo_usuario
            : "";

        definirEdicao(true);

        inputNivel.disabled = !nivelEditavel;
    }

    // ---------- API ----------
    function mensagemDaApi(dados, status) {
        if (Array.isArray(dados?.detail)) {
            return dados.detail
                .map((erro) =>
                    String(erro.msg || "Valor inválido.")
                        .replace(/^Value error,\s*/, "")
                )
                .join(" | ");
        }

        if (typeof dados?.detail === "string") {
            return dados.detail;
        }

        return `Não foi possível concluir a operação. HTTP ${status}.`;
    }

    function erroDeSessao() {
        const erro = new Error(
            "A sessão mudou. Recarregue a página."
        );

        erro.status = 401;

        return erro;
    }

    async function requisicao(caminho, opcoes = {}) {
        const token = tokenDaSessao;

        if (!token || obterToken() !== token) {
            throw erroDeSessao();
        }

        let resposta;

        try {
            resposta = await fetch(API_URL + caminho, {
                ...opcoes,

                headers: {
                    Accept: "application/json",

                    ...(opcoes.body
                        ? { "Content-Type": "application/json" }
                        : {}),

                    Authorization: `Bearer ${token}`,
                },

                cache: "no-store",
            });
        } catch {
            throw new Error(
                "Não foi possível comunicar com o servidor."
            );
        }

        // Ignora a resposta se a sessão mudou durante o envio.
        if (obterToken() !== token) {
            throw erroDeSessao();
        }

        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            const erro = new Error(
                mensagemDaApi(dados, resposta.status)
            );

            erro.status = resposta.status;

            throw erro;
        }

        if (!dados) {
            throw new Error(
                "O servidor retornou uma resposta inesperada."
            );
        }

        return dados;
    }

    // ---------- Carregamento inicial ----------
    async function carregarDados() {
        tokenDaSessao = obterToken();

        if (!tokenDaSessao) {
            // Sem token, o cabeçalho também volta a visitante.
            limparSessaoLocal();
            bloquearAcesso();

            return;
        }

        definirEdicao(false);

        try {
            const usuario = await requisicao("/usuarios/me");

            preencherTela(usuario);
            guardarNomeCabecalho(usuario.nome_exibicao);
        } catch (erro) {
            if (erro.status === 401) {
                limparSessaoLocal();
                bloquearAcesso("Sua sessão expirou. ");

                return;
            }

            definirEdicao(false);

            mostrarErro(
                `${erro.message} Recarregue a página para tentar novamente.`
            );
        }
    }

    // ---------- Salvar ----------
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (salvando) return;

        if (!usuarioAtual || !tokenDaSessao) {
            bloquearAcesso();

            return;
        }

        limparMensagens();

        const nome = inputNome.value.trim();
        const telefone = soDigitos(inputTelefone.value);

        const erroNome = validarNome(nome);

        if (erroNome) {
            mostrarErro(erroNome);
            inputNome.focus();

            return;
        }

        const erroTelefone = validarTelefone(telefone);

        if (erroTelefone) {
            mostrarErro(erroTelefone);
            inputTelefone.focus();

            return;
        }

        const alteracoes = {};

        if (nome !== usuarioAtual.nome_exibicao) {
            alteracoes.nome_exibicao = nome;
        }

        const telefoneAtual =
            soDigitos(usuarioAtual.telefone_usuario) || null;

        if ((telefone || null) !== telefoneAtual) {
            alteracoes.telefone_usuario = telefone || null;
        }

        if (!inputNivel.disabled) {
            if (!NIVEIS_VALIDOS.includes(inputNivel.value)) {
                mostrarErro("Escolha um nível de acessibilidade.");
                inputNivel.focus();

                return;
            }

            if (inputNivel.value !== usuarioAtual.tipo_usuario) {
                alteracoes.tipo_usuario = inputNivel.value;
            }
        }

        if (!Object.keys(alteracoes).length) {
            mostrarSucesso("Nenhuma alteração para salvar.");

            return;
        }

        salvando = true;
        btnSalvar.disabled = true;

        try {
            const atualizado = await requisicao(
                "/usuarios/me",
                {
                    method: "PATCH",
                    body: JSON.stringify(alteracoes),
                }
            );

            preencherTela(atualizado);

            // Só atualiza o ícone depois da confirmação do banco.
            guardarNomeCabecalho(atualizado.nome_exibicao);

            mostrarSucesso("Dados atualizados com sucesso!");
        } catch (erro) {
            if (erro.status === 401) {
                limparSessaoLocal();
                bloquearAcesso("Sua sessão expirou. ");

                return;
            }

            mostrarErro(
                `${erro.message} Suas alterações não foram confirmadas.`
            );
        } finally {
            salvando = false;
            btnSalvar.disabled = false;
        }
    });

    // ---------- Campos ----------
    inputTelefone.addEventListener("input", () => {
        inputTelefone.value = formatarTelefone(
            inputTelefone.value
        );
    });

    [inputNome, inputTelefone, inputNivel].forEach((campo) => {
        campo.addEventListener("input", () => {
            if (!msgErro.hidden && usuarioAtual) {
                limparMensagens();
            }
        });
    });

    // ---------- Encerrar sessão ----------
    btnEncerrarSessao.addEventListener("click", () => {
        limparSessaoLocal();

        if (obterToken() !== null) {
            mostrarErro(
                "Não foi possível encerrar a sessão. " +
                "Confira as permissões de armazenamento do navegador."
            );

            return;
        }

        window.location.href = "../../index.html";
    });

    carregarDados();
})();