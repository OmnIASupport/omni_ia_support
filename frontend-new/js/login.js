/* =========================================================
   Omni IA Support — Login


   - POST /login/
   - A senha é verificada no backend.
   - Lembra somente o e-mail, se solicitado.
   - Guarda o nome para apresentação no cabeçalho.
   - Registra a data e hora do último acesso.
   - Redireciona para o index.html da raiz.


   Guarda o token de acesso para as requisições autenticadas.
Implementação de armazenamento destinada ao teste local.
   ========================================================= */


   (() => {
    "use strict";


    const API_URL = "http://127.0.0.1:8000/login/";
    const API_REGISTRAR_ACESSO =
        "http://127.0.0.1:8000/usuarios/me/registrar-acesso";
    const CHAVE_EMAIL = "omni:email";
    const CHAVE_PERFIL = "omni:perfil-interface";
    const CHAVE_TOKEN = "omni:token_acesso";


    const $ = (seletor) => document.querySelector(seletor);


    const form = $("#form-login");
    if (!form) return;


    const email = $("#email");
    const senha = $("#senha");
    const lembrar = $("#lembrar");
    const toggleSenha = $("#toggle-senha");
    const btnEntrar = $("#btn-entrar");
    const erroGeral = $("#erro-geral");
    const linkEsqueci = $("#esqueci");


    const obrigatorios = [
        email,
        senha,
        lembrar,
        toggleSenha,
        btnEntrar,
        erroGeral,
    ];


    if (obrigatorios.some((elemento) => !elemento)) {
        console.error(
            "Login: faltam elementos no HTML. Confira os IDs."
        );
        return;
    }


    const textoBtn = btnEntrar.querySelector(".btn-texto");


    if (!textoBtn) {
        console.error("Login: falta .btn-texto no botão.");
        return;
    }


    let enviando = false;
    let redirecionando = false;


    // ---------- Mensagens ----------
    function mostrarErro(campo, mensagem) {
        const wrapper = campo.closest(".campo-input");
        const erro = document.getElementById(`erro-${campo.id}`);


        wrapper?.classList.add("invalido");


        if (erro) {
            erro.textContent = mensagem;
            erro.hidden = false;
        }


        campo.setAttribute("aria-invalid", "true");
    }


    function limparErro(campo) {
        const wrapper = campo.closest(".campo-input");
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


    // ---------- Validação ----------
    function validarEmail(valor) {
        const texto = valor.trim();


        if (!texto) {
            return "Informe seu e-mail.";
        }


        if (texto.length > 255) {
            return "O e-mail deve ter até 255 caracteres.";
        }


        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto)) {
            return "Digite um e-mail completo, como [nome@gmail.com](mailto:nome@gmail.com).";
        }


        return null;
    }


    function validarSenha(valor) {
        if (!valor) {
            return "Informe sua senha.";
        }


        // A política de criação da senha fica no cadastro.
        return null;
    }


    function validarFormulario() {
        limparErroGeral();


        let valido = true;


        const verificacoes = [
            [email, validarEmail(email.value)],
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


        if (!valido) {
            form.querySelector('[aria-invalid="true"]')?.focus();
        }


        return valido;
    }


    // ---------- Lembrar somente o e-mail ----------
    function carregarEmail() {
        try {
            const salvo = localStorage.getItem(CHAVE_EMAIL);


            if (salvo) {
                email.value = salvo;
                lembrar.checked = true;
            }
        } catch {
            // O login continua com armazenamento indisponível.
        }
    }


    function atualizarEmailLembrado(valor) {
        try {
            if (lembrar.checked) {
                localStorage.setItem(CHAVE_EMAIL, valor);
            } else {
                localStorage.removeItem(CHAVE_EMAIL);
            }
        } catch {
            // Não impede o login.
        }
    }


    lembrar.addEventListener("change", () => {
        if (!lembrar.checked) {
            try {
                localStorage.removeItem(CHAVE_EMAIL);
            } catch {
                // Armazenamento indisponível.
            }
        }
    });


    // ---------- Nome para apresentação ----------
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
            console.warn(
                "Não foi possível guardar o nome para o cabeçalho."
            );
        }
    }


    // ---------- Mostrar / ocultar senha ----------
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


    [email, senha].forEach((campo) => {
        campo.addEventListener("input", () => {
            limparErro(campo);
            limparErroGeral();
        });
    });


    // ---------- Botão ----------
    function atualizarBotao(ocupado) {
        btnEntrar.disabled = ocupado;
        btnEntrar.classList.toggle("carregando", ocupado);
        form.setAttribute("aria-busy", String(ocupado));


        textoBtn.textContent = ocupado ? "Entrando..." : "Entrar";
    }


    // ---------- API ----------
    async function verificarCredenciais(dados) {
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
                "Não foi possível acessar a API. Confira se a " +
                "FastAPI está iniciada e se o CORS permite esta página."
            );
        }


        const usuario = await resposta.json().catch(() => null);


        if (!resposta.ok) {
            if (resposta.status === 401) {
                throw new Error("E-mail ou senha inválidos.");
            }


            if (resposta.status === 404) {
                throw new Error(
                    "A rota POST /login/ não foi encontrada no backend."
                );
            }


            if (resposta.status === 422) {
                throw new Error(
                    "Confira o modelo de login da API. Ele deve " +
                    "receber email_usuario e senha_usuario."
                );
            }


            throw new Error(
                typeof usuario?.detail === "string"
                    ? usuario.detail
                    : `Não foi possível entrar. HTTP ${resposta.status}.`
            );
        }


        if (
            !usuario ||
            usuario.id_usuario == null ||
            typeof usuario.access_token !== "string" ||
            !usuario.access_token.trim() ||
            usuario.token_type?.toLowerCase() !== "bearer"
        ) {
            throw new Error(
                "A API retornou uma resposta de login incompleta. " +
                "Confira se o backend está retornando access_token " +
                "e token_type."
            );
        }
        
        return usuario;
    }
    // ---------- Credencial para integração local ----------
function guardarToken(usuario) {
    try {
        localStorage.setItem(
            CHAVE_TOKEN,
            usuario.access_token
        );
    } catch {
        throw new Error(
            "Não foi possível guardar a credencial de acesso. " +
            "Confira se o navegador permite armazenamento " +
            "para este site."
        );
    }
}


// ---------- Registro do último acesso ----------
async function registrarAcesso(usuario) {
    try {
        await fetch(API_REGISTRAR_ACESSO, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${usuario.access_token}`,
            },

            body: JSON.stringify({}),
        });
    } catch {
        // O login continua mesmo se o registro falhar.
    }
}


    // ---------- Envio ----------
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();


        if (enviando || redirecionando) return;
        if (!validarFormulario()) return;


        enviando = true;
        atualizarBotao(true);


        const emailInformado = email.value.trim().toLowerCase();


        try {
            const usuario = await verificarCredenciais({
                email_usuario: emailInformado,
                senha_usuario: senha.value,
            });
            
            // Guarda a credencial antes de abrir a página inicial.
            guardarToken(usuario);
            
            // Guarda somente o nome para apresentação.
            guardarNome(usuario);


            // Registra a data e hora do último acesso no banco.
            await registrarAcesso(usuario);


            atualizarEmailLembrado(emailInformado);


            senha.value = "";


            redirecionando = true;
            textoBtn.textContent = "Abrindo página inicial...";


            window.location.href = "../../index.html";
        } catch (erro) {
            mostrarErroGeral(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível entrar."
            );
        } finally {
            enviando = false;


            if (!redirecionando) {
                atualizarBotao(false);
            }
        }
    });


    // ---------- Recuperação ainda não implementada ----------
    linkEsqueci?.addEventListener("click", (evento) => {
        evento.preventDefault();


        mostrarErroGeral(
            "A recuperação de senha ainda não está disponível."
        );
    });


    carregarEmail();
})();