/* =========================================================
   Omni IA Support — Login
   - Validação client-side
   - Confere e-mail e senha nas contas criadas no cadastro
   - "Lembrar de mim" (localStorage) ou sessão temporária (sessionStorage)
   - Redireciona para index.html (ou ?redirect=arquivo.html)
   ========================================================= */

   (() => {
    "use strict";

    const CHAVE_USUARIO        = "omni:usuario";
    const CHAVE_LEMBRAR        = "omni:lembrar";
    const CHAVE_EMAIL_LEMBRADO = "omni:email";
    const CHAVE_SESSAO         = "omni:sessao";

    // Conta de teste (continua funcionando para demonstração)
    const CREDENCIAIS_DEMO = {
        email: "joao@omni.ia",
        senha: "omni123",
        nome: "João Silva",
        iniciais: "JS",
        papel: "Usuário Surdo",
    };

    const $ = (sel) => document.querySelector(sel);

    const form        = $("#form-login");
    const email       = $("#email");
    const senha       = $("#senha");
    const lembrar     = $("#lembrar");
    const toggleSenha = $("#toggle-senha");
    const btnEntrar   = $("#btn-entrar");
    const erroGeral   = $("#erro-geral");
    const linkEsqueci = $("#esqueci");

    if (!form) return;

    const textoBtn = btnEntrar.querySelector(".btn-texto");

    /* ---------- Erros ---------- */
    const mostrarErro = (campo, msg) => {
        const wrapper = campo.closest(".campo-input");
        const erro    = document.getElementById(`erro-${campo.id}`);
        if (wrapper) wrapper.classList.add("invalido");
        if (erro) { erro.textContent = msg; erro.hidden = false; }
        campo.setAttribute("aria-invalid", "true");
    };

    const limparErro = (campo) => {
        const wrapper = campo.closest(".campo-input");
        const erro    = document.getElementById(`erro-${campo.id}`);
        if (wrapper) wrapper.classList.remove("invalido");
        if (erro) { erro.textContent = ""; erro.hidden = true; }
        campo.removeAttribute("aria-invalid");
    };

    const mostrarErroGeral = (msg, tipo = "erro") => {
        erroGeral.textContent = msg;
        erroGeral.hidden = false;
        const ok = tipo === "ok";
        erroGeral.style.background = ok ? "var(--ok-bg)" : "var(--erro-bg)";
        erroGeral.style.color      = ok ? "var(--ok)"    : "var(--erro)";
        erroGeral.style.border     = ok ? "1px solid rgba(22, 163, 74, 0.25)"
                                        : "1px solid rgba(198, 40, 40, 0.25)";
    };

    const limparErroGeral = () => {
        erroGeral.textContent = "";
        erroGeral.hidden = true;
        erroGeral.style.cssText = "";
    };

    /* ---------- Validação ---------- */
    const validarEmail = (valor) => {
        const t = valor.trim();
        if (!t) return "Informe seu e-mail.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return "E-mail inválido.";
        return null;
    };

    const validarSenha = (valor) => {
        if (!valor) return "Informe sua senha.";
        if (valor.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
        return null;
    };

    const validarFormulario = () => {
        limparErroGeral();
        let ok = true;

        const eEmail = validarEmail(email.value);
        if (eEmail) { mostrarErro(email, eEmail); ok = false; } else limparErro(email);

        const eSenha = validarSenha(senha.value);
        if (eSenha) { mostrarErro(senha, eSenha); ok = false; } else limparErro(senha);

        return ok;
    };

    /* ---------- Sessão ---------- */
    const salvarSessao = (usuario, persistir) => {
        const payload = JSON.stringify(usuario);
        if (persistir) {
            localStorage.setItem(CHAVE_USUARIO, payload);
            sessionStorage.removeItem(CHAVE_SESSAO);
        } else {
            sessionStorage.setItem(CHAVE_SESSAO, payload);
            localStorage.removeItem(CHAVE_USUARIO);
        }
    };

    /* ---------- Redirecionamento ---------- */
    const redirecionar = () => {
        const destino = new URLSearchParams(window.location.search).get("redirect") || "index.html";
        // Só aceita arquivos .html da mesma pasta (bloqueia "//site.com", "../" etc.)
        const seguro = /^[\w-]+\.html(\?[^#\s]*)?$/.test(destino) ? destino : "index.html";
        window.location.href = seguro;
    };

    /* ---------- Lembrar de mim ---------- */
    const carregarEmailLembrado = () => {
        try {
            const ativo = localStorage.getItem(CHAVE_LEMBRAR) === "1";
            const salvo = localStorage.getItem(CHAVE_EMAIL_LEMBRADO);
            if (ativo && salvo) {
                email.value = salvo;
                lembrar.checked = true;
                senha.focus();
                return;
            }
        } catch (_) { /* ignora */ }
        email.focus();
    };

    /* ---------- Mostrar/ocultar senha ---------- */
    toggleSenha.addEventListener("click", () => {
        const visivel = senha.type === "text";
        senha.type = visivel ? "password" : "text";
        toggleSenha.setAttribute("aria-pressed", String(!visivel));
        toggleSenha.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
        toggleSenha.querySelector("i").className = visivel ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
        senha.focus();
    });

    [email, senha].forEach((campo) => {
        campo.addEventListener("input", () => {
            limparErro(campo);
            limparErroGeral();
        });
    });

    /* ---------- Envio ---------- */
    const liberarBotao = () => {
        btnEntrar.disabled = false;
        btnEntrar.classList.remove("carregando");
        textoBtn.textContent = "Entrar";
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        btnEntrar.disabled = true;
        btnEntrar.classList.add("carregando");
        textoBtn.textContent = "Entrando";

        await new Promise((r) => setTimeout(r, 600)); // simula rede

        const emailDigitado = email.value.trim().toLowerCase();
        const senhaDigitada = senha.value;

        // 1) Conta criada no cadastro
        let usuario = await OmniContas.verificar(emailDigitado, senhaDigitada);

        // 2) Conta de demonstração
        if (!usuario &&
            emailDigitado === CREDENCIAIS_DEMO.email &&
            senhaDigitada === CREDENCIAIS_DEMO.senha) {
            usuario = {
                nome: CREDENCIAIS_DEMO.nome,
                iniciais: CREDENCIAIS_DEMO.iniciais,
                papel: CREDENCIAIS_DEMO.papel,
                email: CREDENCIAIS_DEMO.email,
            };
        }

        if (!usuario) {
            mostrarErroGeral("E-mail ou senha incorretos. Tente novamente.");
            senha.value = "";
            senha.focus();
            return liberarBotao();
        }

        salvarSessao({ ...usuario, entrouEm: new Date().toISOString() }, lembrar.checked);

        try {
            if (lembrar.checked) {
                localStorage.setItem(CHAVE_LEMBRAR, "1");
                localStorage.setItem(CHAVE_EMAIL_LEMBRADO, emailDigitado);
            } else {
                localStorage.removeItem(CHAVE_LEMBRAR);
                localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
            }
        } catch (_) { /* ignora */ }

        textoBtn.textContent = "Tudo certo!";
        setTimeout(redirecionar, 350);
    });

    /* ---------- Esqueci a senha (simulação) ---------- */
    linkEsqueci?.addEventListener("click", (e) => {
        e.preventDefault();

        const valor = email.value.trim();
        if (validarEmail(valor)) {
            mostrarErro(email, "Informe um e-mail válido para recuperar a senha.");
            email.focus();
            return;
        }

        // Mensagem igual exista ou não a conta (não revela quem tem cadastro)
        mostrarErroGeral(
            `Se existir uma conta para ${valor}, enviaremos um link de recuperação.`,
            "ok"
        );
        setTimeout(limparErroGeral, 4000);
    });

    carregarEmailLembrado();
})();