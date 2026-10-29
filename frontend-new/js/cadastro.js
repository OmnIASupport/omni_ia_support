/* =========================================================
   Omni IA Support — Cadastro de perfil
   Frontend → FastAPI → Supabase
   ========================================================= */

   (() => {
    "use strict";

    // ALTERADO: mantivemos o mesmo endpoint do backend.
    // O cadastro agora envia senha_usuario para POST /usuarios/.
    const API_URL = "http://127.0.0.1:8000/usuarios/";

    const $ = (seletor) => document.querySelector(seletor);

    // ---------- Elementos ----------
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

    const opcoesAcessibilidade = form.querySelectorAll(
        'input[name="acessibilidade"]'
    );

    // ALTERADO: senha e toggleSenha agora são obrigatórios
    // no JavaScript, porque o campo voltou a ser utilizado.
    const elementosObrigatorios = [
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
        elementosObrigatorios.some((elemento) => !elemento) ||
        opcoesAcessibilidade.length === 0
    ) {
        console.error(
            "Cadastro: existem elementos ausentes no HTML. Confira os IDs."
        );

        return;
    }

    const textoBtn = btnCadastrar.querySelector(".btn-texto");

    if (!textoBtn) {
        console.error(
            "Cadastro: o botão precisa conter um elemento .btn-texto."
        );

        return;
    }

    let enviando = false;

    // ---------- Configuração inicial ----------

    // ALTERADO: removemos o bloqueio antigo da senha.
    // Antes o código fazia:
    // senha.required = false;
    // senha.disabled = true;
    // senha.value = "";
    // blocoSenha.hidden = true;
    // toggleSenha.disabled = true;

    // Agora o campo de senha fica ativo e obrigatório.
    senha.disabled = false;
    senha.required = true;

    // ALTERADO: regras de senha definidas também no JavaScript.
    senha.minLength = 6;
    senha.maxLength = 128;

    const blocoSenha = senha.closest(".campo");

    // ALTERADO: garante que o bloco da senha permaneça visível.
    if (blocoSenha) {
        blocoSenha.hidden = false;
    }

    // ALTERADO: botão de mostrar/ocultar senha reativado.
    toggleSenha.disabled = false;

    // ALTERADO: limites alinhados ao backend.
    nomeExib.maxLength = 150;
    nomeCompleto.maxLength = 250;
    email.maxLength = 255;

    textoBtn.textContent = "Criar conta";

    // ---------- Mensagem de sucesso ----------
    const mensagemSucesso = document.createElement("p");

    mensagemSucesso.id = "sucesso-cadastro";
    mensagemSucesso.className = "mensagem-sucesso";
    mensagemSucesso.setAttribute("role", "status");
    mensagemSucesso.setAttribute("aria-live", "polite");
    mensagemSucesso.hidden = true;

    erroGeral.insertAdjacentElement("afterend", mensagemSucesso);

    // ---------- Utilidades de erro ----------
    const mostrarErro = (campo, mensagem) => {
        const wrapper =
            campo.closest(".campo-input") || campo.parentElement;

        const erro = document.getElementById(`erro-${campo.id}`);

        if (wrapper) {
            wrapper.classList.add("invalido");
        }

        if (erro) {
            erro.textContent = mensagem;
            erro.hidden = false;
        }

        campo.setAttribute("aria-invalid", "true");
    };

    const limparErro = (campo) => {
        const wrapper =
            campo.closest(".campo-input") || campo.parentElement;

        const erro = document.getElementById(`erro-${campo.id}`);

        if (wrapper) {
            wrapper.classList.remove("invalido");
        }

        if (erro) {
            erro.textContent = "";
            erro.hidden = true;
        }

        campo.removeAttribute("aria-invalid");
    };

    const mostrarErroGeral = (mensagem) => {
        mensagemSucesso.hidden = true;

        erroGeral.textContent = mensagem;
        erroGeral.hidden = false;
    };

    const limparErroGeral = () => {
        erroGeral.textContent = "";
        erroGeral.hidden = true;
    };

    const limparSucesso = () => {
        mensagemSucesso.textContent = "";
        mensagemSucesso.hidden = true;
    };

    const limparMensagens = () => {
        limparErroGeral();
        limparSucesso();
    };

    // ALTERADO: agora também limpa o campo de senha,
    // restaura o tipo password e o ícone do botão.
    const limparFormulario = () => {
        form.reset();

        [
            nomeExib,
            nomeCompleto,
            email,
            telefone,
            senha,
        ].forEach(limparErro);

        erroAcessibilidade.textContent = "";
        erroAcessibilidade.hidden = true;

        erroTermos.textContent = "";
        erroTermos.hidden = true;

        senha.type = "password";
        toggleSenha.setAttribute("aria-pressed", "false");
        toggleSenha.setAttribute("aria-label", "Mostrar senha");

        const icone = toggleSenha.querySelector("i");

        if (icone) {
            icone.className = "fa-regular fa-eye";
        }

        limparMensagens();
    };

    // ---------- Nome de exibição ----------
    const validarNomeExib = (valor) => {
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
    };

    // ---------- Nome completo ----------

    // ALTERADO: agora proíbe números no nome completo.
    const validarNomeCompleto = (valor) => {
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
    };

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

    // ALTERADO: exige e-mail completo, com @ e domínio.
    // Também bloqueia domínios incorretos conhecidos.
    const validarEmail = (valor) => {
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
                `O domínio @${dominio} não é aceito neste cadastro. ` +
                `Confira se você quis dizer @${sugestao}.`
            );
        }

        return null;
    };

    // ---------- Senha ----------

    // ALTERADO: nova validação da senha.
    // Mínimo de 6 caracteres e máximo de 128.
    const validarSenha = (valor) => {
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
    };

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

    const validarTelefone = (valor) => {
        const digitos = soDigitos(valor);

        if (!digitos) return null;

        if (![10, 11].includes(digitos.length)) {
            return "Informe o telefone com DDD. Ex.: (11) 99999-9999";
        }

        if (!DDDS_VALIDOS.has(Number(digitos.slice(0, 2)))) {
            return "DDD inválido.";
        }

        if (digitos.length === 11 && digitos[2] !== "9") {
            return "Celular deve começar com 9 após o DDD.";
        }

        if (
            digitos.length === 10 &&
            !"2345".includes(digitos[2])
        ) {
            return "Telefone fixo inválido.";
        }

        return null;
    };

    const formatarTelefone = (valor) => {
        const digitos = soDigitos(valor).slice(0, 11);

        if (digitos.length <= 2) {
            return digitos ? `(${digitos}` : "";
        }

        if (digitos.length <= 6) {
            return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
        }

        if (digitos.length <= 10) {
            return (
                `(${digitos.slice(0, 2)}) ` +
                `${digitos.slice(2, 6)}-${digitos.slice(6)}`
            );
        }

        return (
            `(${digitos.slice(0, 2)}) ` +
            `${digitos.slice(2, 7)}-${digitos.slice(7)}`
        );
    };

    // ---------- Nível de acessibilidade ----------
    const nivelEscolhido = () =>
        form.querySelector('input[name="acessibilidade"]:checked');

    // ---------- Validação geral ----------
    const validarFormulario = () => {
        limparMensagens();

        let valido = true;

        const checar = (campo, erro) => {
            if (erro) {
                mostrarErro(campo, erro);
                valido = false;
            } else {
                limparErro(campo);
            }
        };

        checar(nomeExib, validarNomeExib(nomeExib.value));
        checar(
            nomeCompleto,
            validarNomeCompleto(nomeCompleto.value)
        );
        checar(email, validarEmail(email.value));
        checar(telefone, validarTelefone(telefone.value));

        // ALTERADO: senha agora entra na validação geral.
        checar(senha, validarSenha(senha.value));

        const nivel = nivelEscolhido();

        if (
            !nivel ||
            !["surdo", "ouvinte", "ambos"].includes(nivel.value)
        ) {
            erroAcessibilidade.textContent =
                "Escolha um nível de acessibilidade.";

            erroAcessibilidade.hidden = false;
            valido = false;
        } else {
            erroAcessibilidade.textContent = "";
            erroAcessibilidade.hidden = true;
        }

        if (!termos.checked) {
            erroTermos.textContent =
                "Você precisa aceitar os termos para continuar.";

            erroTermos.hidden = false;
            valido = false;
        } else {
            erroTermos.textContent = "";
            erroTermos.hidden = true;
        }

        if (!valido) {
            const primeiroInvalido = form.querySelector(
                '[aria-invalid="true"]'
            );

            if (primeiroInvalido) {
                primeiroInvalido.focus();
            } else if (!nivel) {
                opcoesAcessibilidade[0]?.focus();
            } else if (!termos.checked) {
                termos.focus();
            }
        }

        return valido;
    };

    // ---------- Eventos dos campos ----------

    // ALTERADO: senha também limpa erros ao ser editada.
    [
        nomeExib,
        nomeCompleto,
        email,
        telefone,
        senha,
    ].forEach((campo) => {
        campo.addEventListener("input", () => {
            limparErro(campo);
            limparMensagens();
        });
    });

    // ALTERADO: remove números digitados ou colados
    // no nome completo e mostra aviso ao usuário.
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

    // ALTERADO: valida email e senha também ao sair do campo.
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

    opcoesAcessibilidade.forEach((radio) => {
        radio.addEventListener("change", () => {
            erroAcessibilidade.textContent = "";
            erroAcessibilidade.hidden = true;

            limparMensagens();
        });
    });

    termos.addEventListener("change", () => {
        if (termos.checked) {
            erroTermos.textContent = "";
            erroTermos.hidden = true;
        }

        limparSucesso();
    });

    // ---------- Mostrar / ocultar senha ----------

    // ALTERADO: função reativada.
    // Antes o botão estava desabilitado.
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

    // ---------- Estado do botão ----------
    const atualizarBotao = (ocupado) => {
        btnCadastrar.disabled = ocupado;

        btnCadastrar.classList.toggle("carregando", ocupado);

        form.setAttribute("aria-busy", String(ocupado));

        textoBtn.textContent = ocupado
            ? "Criando conta..."
            : "Criar conta";
    };

    // ---------- Erros da API ----------
    const obterMensagemErro = (dados, status) => {
        if (Array.isArray(dados?.detail)) {
            return dados.detail
                .map((erro) => {
                    const campo = (erro.loc || [])
                        .filter((parte) => parte !== "body")
                        .join(".");

                    const descricao =
                        erro.msg || "Valor inválido.";

                    return campo
                        ? `${campo}: ${descricao}`
                        : descricao;
                })
                .join(" | ");
        }

        if (typeof dados?.detail === "string") {
            return dados.detail;
        }

        return (
            "Não foi possível criar a conta. " +
            `Código HTTP ${status}.`
        );
    };

    // ---------- Envio ----------

    // ALTERADO: função dedicada ao POST /usuarios/.
    // Envia senha_usuario, mas nunca registra a senha no console.
    const cadastrarUsuario = async (dados) => {
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
                "Não foi possível acessar a API. Confira se a FastAPI " +
                "está iniciada, a URL e o CORS. Antes de tentar novamente, " +
                "verifique se o cadastro foi concluído."
            );
        }

        let conteudo = null;

        try {
            conteudo = await resposta.json();
        } catch {
            // A resposta pode não conter JSON válido.
        }

        if (!resposta.ok) {
            throw new Error(
                obterMensagemErro(conteudo, resposta.status)
            );
        }

        if (!conteudo || conteudo.id_usuario == null) {
            throw new Error(
                "A API respondeu sem o ID do usuário. Confira o backend " +
                "antes de repetir o cadastro."
            );
        }

        return conteudo;
    };

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (enviando) return;

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

            // ALTERADO: agora o frontend envia a senha
            // com o mesmo nome usado no backend e no Supabase.
            senha_usuario: senha.value,
        };

        try {
            const usuario = await cadastrarUsuario(conteudo);

            limparFormulario();

            mensagemSucesso.textContent =
                `Conta criada com sucesso! ID: ${usuario.id_usuario}.`;

            mensagemSucesso.hidden = false;
        } catch (erro) {
            // ALTERADO: não registramos o objeto completo,
            // porque ele contém a senha em texto puro.
            console.error("Falha no cadastro:", erro.message);

            mostrarErroGeral(erro.message);
        } finally {
            enviando = false;
            atualizarBotao(false);
        }
    });
})();