/* =========================================================
   Omni IA Support — Cadastro

   - POST /usuarios/
   - Valida os campos.
   - Envia senha_usuario para o backend.
   - Guarda somente o nome para apresentação no cabeçalho.
   - Redireciona para o index.html da raiz.

   Não cria uma sessão autenticada no navegador.
   ========================================================= */

   (() => {
    "use strict";

    const API_URL = "http://127.0.0.1:8000/usuarios/";
    const CHAVE_PERFIL = "omni:perfil-interface";

    const $ = (seletor) => document.querySelector(seletor);

    const form = $("#form-cadastro");
    if (!form) return;

    const nomeExib = $("#nome-exibicao");
    const nomeCompleto = $("#nome-completo");
    const email = $("#email");
    const telefone = $("#telefone");
    const senha = $("#senha");
    const termos = $("#termos");
    const toggleSenha = $("#toggle-senha");
    const btnCadastrar = $("#btn-cadastrar");
    const erroGeral = $("#erro-geral");
    const erroAcessibilidade = $("#erro-acessibilidade");
    const erroTermos = $("#erro-termos");

    const radios = form.querySelectorAll(
        'input[name="acessibilidade"]'
    );

    const obrigatorios = [
        nomeExib,
        nomeCompleto,
        email,
        telefone,
        senha,
        termos,
        toggleSenha,
        btnCadastrar,
        erroGeral,
        erroAcessibilidade,
        erroTermos,
    ];

    if (
        obrigatorios.some((elemento) => !elemento) ||
        radios.length === 0
    ) {
        console.error(
            "Cadastro: faltam elementos no HTML. Confira os IDs."
        );
        return;
    }

    const textoBtn = btnCadastrar.querySelector(".btn-texto");

    if (!textoBtn) {
        console.error("Cadastro: falta .btn-texto no botão.");
        return;
    }

    let enviando = false;
    let redirecionando = false;

    // ---------- Configuração ----------
    senha.disabled = false;
    senha.required = true;
    senha.minLength = 6;
    senha.maxLength = 128;

    const blocoSenha = senha.closest(".campo");

    if (blocoSenha) {
        blocoSenha.hidden = false;
    }

    toggleSenha.disabled = false;

    nomeExib.maxLength = 150;
    nomeCompleto.maxLength = 250;
    email.maxLength = 255;

    textoBtn.textContent = "Criar conta";

    // ---------- Mensagens ----------
    function mostrarErro(campo, mensagem) {
        const wrapper =
            campo.closest(".campo-input") || campo.parentElement;

        const erro = document.getElementById(`erro-${campo.id}`);

        wrapper?.classList.add("invalido");

        if (erro) {
            erro.textContent = mensagem;
            erro.hidden = false;
        }

        campo.setAttribute("aria-invalid", "true");
    }

    function limparErro(campo) {
        const wrapper =
            campo.closest(".campo-input") || campo.parentElement;

        const erro = document.getElementById(`erro-${campo.id}`);

        wrapper?.classList.remove("invalido");

        if (erro) {
            erro.textContent = "";
            erro.hidden = true;
        }

        campo.removeAttribute("aria-invalid");
    }

    function mostrarErroGeral(mensagem) {
        erroGeral.textContent = mensagem;
        erroGeral.hidden = false;
    }

    function limparErroGeral() {
        erroGeral.textContent = "";
        erroGeral.hidden = true;
    }

    // ---------- Nomes ----------
    function validarNomeExibicao(valor) {
        const texto = valor.trim();

        if (!texto) {
            return "Informe como quer ser chamado.";
        }

        if (texto.length < 2) {
            return "O nome deve ter pelo menos 2 caracteres.";
        }

        if (texto.length > 150) {
            return "O nome de exibição deve ter até 150 caracteres.";
        }

        return null;
    }

    function validarNomeCompleto(valor) {
        const texto = valor.trim();

        if (!texto) return null;

        if (/\p{N}/u.test(texto)) {
            return "O nome completo não pode conter números.";
        }

        if (texto.length > 250) {
            return "O nome completo deve ter até 250 caracteres.";
        }

        if (texto.split(/\s+/).length < 2) {
            return "Informe nome e sobrenome.";
        }

        return null;
    }

    // ---------- E-mail ----------
    const ERROS_DOMINIO = {
        "gmial.com": "gmail.com",
        "gmai.com": "gmail.com",
        "gamil.com": "gmail.com",
        "gmail.con": "gmail.com",
        "hotmial.com": "hotmail.com",
        "hotmai.com": "hotmail.com",
        "hotmail.con": "hotmail.com",
        "outlok.com": "outlook.com",
        "outlook.con": "outlook.com",
        "yaho.com": "yahoo.com",
        "yahoo.con": "yahoo.com",
    };

    function validarEmail(valor) {
        const texto = valor.trim().toLowerCase();

        if (!texto) {
            return "Informe seu e-mail.";
        }

        if (texto.length > 255) {
            return "O e-mail deve ter até 255 caracteres.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto)) {
            return "Digite um e-mail completo, como nome@gmail.com.";
        }

        const dominio = texto.split("@")[1];
        const sugestao = ERROS_DOMINIO[dominio];

        if (sugestao) {
            return (
                `Confira o domínio @${dominio}. ` +
                `Você quis dizer @${sugestao}?`
            );
        }

        return null;
    }

    // ---------- Senha ----------
    function validarSenha(valor) {
        if (!valor) {
            return "Informe sua senha.";
        }

        if (valor.length < 6) {
            return "A senha deve ter pelo menos 6 caracteres.";
        }

        if (valor.length > 128) {
            return "A senha deve ter até 128 caracteres.";
        }

        return null;
    }

    // ---------- Telefone ----------
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

    const soDigitos = (valor) => valor.replace(/\D/g, "");

    function validarTelefone(valor) {
        const digitos = soDigitos(valor);

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

    function formatarTelefone(valor) {
        const d = soDigitos(valor).slice(0, 11);

        if (d.length <= 2) {
            return d ? `(${d}` : "";
        }

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

    // ---------- Validação geral ----------
    const nivelEscolhido = () =>
        form.querySelector('input[name="acessibilidade"]:checked');

    function validarFormulario() {
        limparErroGeral();

        let valido = true;

        const verificacoes = [
            [nomeExib, validarNomeExibicao(nomeExib.value)],
            [nomeCompleto, validarNomeCompleto(nomeCompleto.value)],
            [email, validarEmail(email.value)],
            [telefone, validarTelefone(telefone.value)],
            [senha, validarSenha(senha.value)],
        ];

        for (const [campo, erro] of verificacoes) {
            if (erro) {
                mostrarErro(campo, erro);
                valido = false;
            } else {
                limparErro(campo);
            }
        }

        const nivel = nivelEscolhido();

        const nivelValido =
            nivel &&
            ["surdo", "ouvinte", "ambos"].includes(nivel.value);

        erroAcessibilidade.textContent = nivelValido
            ? ""
            : "Escolha um nível de acessibilidade.";

        erroAcessibilidade.hidden = Boolean(nivelValido);

        if (!nivelValido) {
            valido = false;
        }

        erroTermos.textContent = termos.checked
            ? ""
            : "Você precisa aceitar os termos para continuar.";

        erroTermos.hidden = termos.checked;

        if (!termos.checked) {
            valido = false;
        }

        if (!valido) {
            const primeiro = form.querySelector(
                '[aria-invalid="true"]'
            );

            if (primeiro) {
                primeiro.focus();
            } else if (!nivelValido) {
                radios[0].focus();
            } else {
                termos.focus();
            }
        }

        return valido;
    }

    // ---------- Eventos ----------
    [nomeExib, nomeCompleto, email, telefone, senha].forEach(
        (campo) => {
            campo.addEventListener("input", () => {
                limparErro(campo);
                limparErroGeral();
            });
        }
    );

    nomeCompleto.addEventListener("input", () => {
        if (/\p{N}/u.test(nomeCompleto.value)) {
            nomeCompleto.value = nomeCompleto.value.replace(
                /\p{N}/gu,
                ""
            );

            mostrarErro(
                nomeCompleto,
                "Números não são permitidos no nome completo."
            );
        }
    });

    telefone.addEventListener("input", () => {
        telefone.value = formatarTelefone(telefone.value);
    });

    [
        [nomeCompleto, validarNomeCompleto],
        [email, validarEmail],
        [senha, validarSenha],
    ].forEach(([campo, validar]) => {
        campo.addEventListener("blur", () => {
            const erro = validar(campo.value);

            if (erro) {
                mostrarErro(campo, erro);
            } else {
                limparErro(campo);
            }
        });
    });

    radios.forEach((radio) => {
        radio.addEventListener("change", () => {
            erroAcessibilidade.textContent = "";
            erroAcessibilidade.hidden = true;
            limparErroGeral();
        });
    });

    termos.addEventListener("change", () => {
        if (termos.checked) {
            erroTermos.textContent = "";
            erroTermos.hidden = true;
        }

        limparErroGeral();
    });

    toggleSenha.addEventListener("click", () => {
        const mostrar = senha.type === "password";

        senha.type = mostrar ? "text" : "password";

        toggleSenha.setAttribute("aria-pressed", String(mostrar));
        toggleSenha.setAttribute(
            "aria-label",
            mostrar ? "Ocultar senha" : "Mostrar senha"
        );

        const icone = toggleSenha.querySelector("i");

        if (icone) {
            icone.className = mostrar
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye";
        }
    });

    // ---------- Botão ----------
    function atualizarBotao(ocupado) {
        btnCadastrar.disabled = ocupado;
        btnCadastrar.classList.toggle("carregando", ocupado);
        form.setAttribute("aria-busy", String(ocupado));

        textoBtn.textContent = ocupado
            ? "Criando conta..."
            : "Criar conta";
    }

    // ---------- API ----------
    function obterMensagemErro(dados, status) {
        if (Array.isArray(dados?.detail)) {
            return dados.detail.map((erro) => {
                const campo = (erro.loc || [])
                    .filter((parte) => parte !== "body")
                    .join(".");

                const mensagem = erro.msg || "Valor inválido.";

                return campo
                    ? `${campo}: ${mensagem}`
                    : mensagem;
            }).join(" | ");
        }

        if (typeof dados?.detail === "string") {
            return dados.detail;
        }

        return `Não foi possível criar a conta. HTTP ${status}.`;
    }

    async function cadastrarUsuario(dados) {
        let resposta;

        try {
            resposta = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(dados),
            });
        } catch {
            throw new Error(
                "Não foi possível acessar a API. Confira a FastAPI " +
                "e o CORS. Verifique se o cadastro foi concluído " +
                "antes de tentar novamente."
            );
        }

        const usuario = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(
                obterMensagemErro(usuario, resposta.status)
            );
        }

        if (!usuario || usuario.id_usuario == null) {
            throw new Error(
                "A API respondeu sem o ID do usuário. Confira " +
                "o backend antes de repetir o cadastro."
            );
        }

        return usuario;
    }

    // ---------- Dados apenas para apresentação ----------
    function guardarNome(usuario) {
        try {
            sessionStorage.removeItem(CHAVE_PERFIL);

            if (
                typeof usuario.nome_exibicao !== "string" ||
                !usuario.nome_exibicao.trim()
            ) {
                return;
            }

            sessionStorage.setItem(
                CHAVE_PERFIL,
                JSON.stringify({
                    nome_exibicao: usuario.nome_exibicao.trim(),
                })
            );
        } catch {
            // O cadastro continua mesmo se o armazenamento falhar.
            console.warn(
                "Não foi possível guardar o nome para o cabeçalho."
            );
        }
    }

    // ---------- Envio ----------
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (enviando || redirecionando) return;
        if (!validarFormulario()) return;

        enviando = true;
        atualizarBotao(true);

        const conteudo = {
            nome_exibicao: nomeExib.value.trim(),
            nome_completo: nomeCompleto.value.trim() || null,
            email_usuario: email.value.trim().toLowerCase(),
            telefone_usuario: soDigitos(telefone.value) || null,
            tipo_usuario: nivelEscolhido().value,
            status_usuario: "ativo",
            senha_usuario: senha.value,
        };

        try {
            const usuario = await cadastrarUsuario(conteudo);

            // NOVO: guarda o nome retornado pela API.
            guardarNome(usuario);

            senha.value = "";

            redirecionando = true;
            textoBtn.textContent = "Abrindo página inicial...";

            // cadastro.html fica em frontend-new/pages/.
            window.location.href = "../../index.html";
        } catch (erro) {
            // Não registra o objeto enviado nem a senha.
            mostrarErroGeral(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível cadastrar."
            );
        } finally {
            enviando = false;

            if (!redirecionando) {
                atualizarBotao(false);
            }
        }
    });
})();