# Guia: HTML, CSS e JavaScript profissionais e responsivos

Cada parte tem a regra, um exemplo curto e o erro mais comum. Os exemplos usam o seu projeto Omni IA.

---

## 1. Mentalidade profissional

1. **Separe responsabilidades.** HTML é estrutura e significado, CSS é aparência, JS é comportamento.
2. **Mobile-first.** Comece pela tela pequena e adicione regras para telas maiores.
3. **Nada fixo.** Evite `width: 1200px` e `height: 500px`. Prefira `%`, `rem`, `fr`, `clamp()`, `max-width`.
4. **Teste sempre.** Abra o DevTools (F12) e use o modo dispositivo (Ctrl+Shift+M).
5. **Valide.** Use o validador do W3C e o Lighthouse (aba do DevTools).

---

## 2. HTML

### 2.1 Esqueleto mínimo

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título da página</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <script src="script.js" defer></script>
</body>
</html>
```

- A tag `viewport` é obrigatória. Sem ela o celular finge ser desktop e nada responde.
- Use **uma** tag `viewport`, **um** `<h1>` por página e `lang` correto.
- CSS vai no `<head>` com `<link rel="stylesheet">`. JS vai com `<script src defer>`. Nunca carregue `.js` como `stylesheet`.

### 2.2 Tags semânticas

| Tag | Uso |
| --- | --- |
| `<header>` | Cabeçalho da página ou de uma seção |
| `<nav>` | Grupo de links de navegação |
| `<main>` | Conteúdo principal (um por página) |
| `<section>` / `<article>` | Bloco temático / conteúdo independente |
| `<aside>` | Conteúdo lateral |
| `<footer>` | Rodapé |
| `<button>` | Ação na página (abrir, enviar, alternar) |
| `<a href>` | Navegação para outra página ou âncora |

**Regra de ouro:** link navega, botão age. Nunca coloque `<button>` dentro de `<a>`.

Evite `<div>` quando existir uma tag com significado. Use `<div>` apenas para agrupar visualmente.

### 2.3 Imagens, formulários e links

```html
<img src="logo.png" alt="Logo da Omni IA" width="45" height="45" loading="lazy">
```

- `alt` sempre preenchido (use `alt=""` se a imagem for só decorativa).
- `width` e `height` evitam que a página "pule" ao carregar.

```html
<form>
  <label for="email">E-mail</label>
  <input type="email" id="email" name="email" required autocomplete="email">
  <button type="submit">Enviar</button>
</form>
```

- Todo `input` precisa de `label` ligado pelo `for`/`id`.
- Use o `type` certo (`email`, `tel`, `number`, `date`). O celular mostra o teclado adequado.

Em links, escreva `&amp;` no lugar de `&`. Use `href="#"` quando o destino ainda não existir (nunca `href=""`, que recarrega a página).

---

## 3. CSS: fundamentos

### 3.1 Reset básico (cole no começo de todo projeto)

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; line-height: 1.5; }
img, video { max-width: 100%; height: auto; display: block; }
```

`box-sizing: border-box` faz o `padding` e a `border` entrarem na largura. Sem isso, as contas de layout dão errado.

### 3.2 Unidades

| Unidade | Quando usar |
| --- | --- |
| `rem` | Fontes, espaçamentos (respeita a configuração do usuário) |
| `%` | Larguras relativas ao pai |
| `vw` / `vh` | Relativo à janela (use `dvh` em vez de `vh` no celular) |
| `fr` | Frações no Grid |
| `px` | Bordas, sombras, detalhes pequenos |
| `ch` | Largura de texto (`max-width: 65ch`) |

### 3.3 Variáveis CSS (design tokens)

```css
:root {
  --cor-primaria: #1458a7;
  --cor-texto: #272727;
  --raio: 6px;
  --espaco: 1rem;
}
.nav-btn:hover { color: var(--cor-primaria); border-radius: var(--raio); }
```

Mudou a cor da marca? Altere em um lugar só.

### 3.4 Tipografia fluida com `clamp()`

```css
h1 { font-size: clamp(1.5rem, 4vw + 1rem, 3rem); }
/* clamp(mínimo, ideal, máximo) */
```

### 3.5 Fontes próprias

```css
@font-face {
  font-family: "inter";
  src: url("Inter-VariableFont_opsz_wght.ttf") format("truetype");
  font-weight: 100 900;   /* obrigatório em fonte variável */
  font-display: swap;
}
```

Confira se o nome do arquivo é **exatamente** o da pasta (maiúsculas e vírgulas contam).

### 3.6 Especificidade e organização

- Use **classes** (`.nav-btn`), não IDs nem seletores longos.
- Evite `!important`.
- Um nome por responsabilidade. Padrão BEM ajuda: `.card`, `.card__titulo`, `.card--destaque`.
- Ordem sugerida do arquivo: variáveis → reset → base → componentes → utilitários → media queries.
- Não declare a mesma propriedade duas vezes no mesmo seletor (o primeiro valor é ignorado).

---

## 4. CSS: layout

### 4.1 Flexbox (uma dimensão: linha **ou** coluna)

```css
.barra {
  display: flex;
  align-items: center;       /* eixo cruzado */
  justify-content: space-between; /* eixo principal */
  gap: 1rem;
  flex-wrap: wrap;           /* quebra linha quando falta espaço */
}
```

Ideal para: menus, barras, botões lado a lado, centralizar coisas.

Para texto alinhado à esquerda dentro de uma coluna flex: `align-items: flex-start` (não `text-align`, que só afeta o texto).

### 4.2 Grid (duas dimensões)

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
```

Essa linha sozinha cria um grid responsivo: 1 coluna no celular, 2 no tablet, 3 ou 4 no desktop, **sem media query**.

Cabeçalho de 3 colunas (como o seu):

```css
header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; }
```

### 4.3 Quando usar cada um

- Alinhar itens em **uma linha/coluna** → Flexbox.
- Montar a **página ou grade de cards** → Grid.
- Os dois juntos são normais: Grid na página, Flex dentro dos componentes.

### 4.4 Posicionamento

- `position: sticky; top: 0;` deixa o cabeçalho fixo ao rolar.
- `position: absolute` só quando realmente precisa tirar o elemento do fluxo (e o pai deve ter `position: relative`).
- Evite `float` para layout.

### 4.5 Centralizar (receitas)

```css
.centro { display: grid; place-items: center; }            /* centro absoluto */
.caixa  { max-width: 1100px; margin-inline: auto; padding-inline: 1rem; } /* container */
```

---

## 5. Responsividade

### 5.1 Checklist de tudo que faz um site responsivo

1. `<meta name="viewport" ...>` no HTML.
2. Larguras fluidas (`%`, `fr`, `max-width`), nunca `width` fixo grande.
3. Imagens com `max-width: 100%; height: auto`.
4. Layout com Flexbox/Grid (+ `flex-wrap` e `auto-fit`).
5. Fontes e espaços em `rem` / `clamp()`.
6. Media queries nos pontos onde **o layout quebra**.
7. Alvos de toque de pelo menos 44×44px.

### 5.2 Mobile-first com `min-width`

```css
/* base: celular */
.cards { display: grid; gap: 1rem; grid-template-columns: 1fr; }

/* tablet */
@media (min-width: 768px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}

/* desktop */
@media (min-width: 1100px) {
  .cards { grid-template-columns: repeat(4, 1fr); }
}
```

Pontos de partida comuns (ajuste ao seu conteúdo): **480px**, **768px**, **1024px**, **1280px**. Melhor ainda: redimensione a janela e crie um ponto onde o design começa a ficar ruim.

(Se começar pelo desktop, use `max-width`, como fizemos no cabeçalho. Funciona, mas não misture os dois estilos no mesmo arquivo.)

### 5.3 Outras media queries úteis

```css
@media (prefers-color-scheme: dark)   { /* tema escuro */ }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
@media (hover: none) { /* telas de toque: não dependa de :hover */ }
@media print { /* versão para impressão */ }
```

### 5.4 Imagens responsivas

```html
<img src="foto-800.jpg"
     srcset="foto-400.jpg 400w, foto-800.jpg 800w, foto-1600.jpg 1600w"
     sizes="(max-width: 600px) 100vw, 50vw"
     alt="Descrição">
```

### 5.5 Container queries (moderno)

O componente responde ao tamanho do **pai**, não da janela:

```css
.painel { container-type: inline-size; }
@container (min-width: 500px) {
  .card { display: flex; }
}
```

### 5.6 Armadilhas comuns

- Rolagem horizontal: quase sempre é algo com `width` fixo ou `100vw` + padding. Procure no DevTools qual elemento passa da tela.
- Tabelas largas: envolva em `<div style="overflow-x:auto">`.
- Texto muito longo quebrando layout: `overflow-wrap: anywhere;` e `min-width: 0` em itens flex/grid.
- Altura fixa em caixas com texto: use `min-height`.

---

## 6. JavaScript

### 6.1 Fundamentos modernos

```js
const nome = "João";          // const por padrão
let contador = 0;             // let só se for mudar
const dobro = (n) => n * 2;   // arrow function
console.log(`Olá, ${nome}`);  // template string
```

Não use `var`. Use `===` em vez de `==`.

### 6.2 DOM: selecionar e alterar

```js
const botao = document.querySelector(".nav-btn");
const itens = document.querySelectorAll(".nav-btn");

botao.classList.add("ativo");
botao.classList.toggle("ativo");
botao.textContent = "Novo texto";       // seguro
// evite innerHTML com dado do usuário (risco de XSS)
```

Para mudar a aparência, **troque classes** e deixe o visual no CSS. Evite `elemento.style.color = ...` espalhado.

### 6.3 Eventos

```js
botao.addEventListener("click", (evento) => {
  evento.preventDefault();   // impede o comportamento padrão (ex.: enviar form)
  alert("Clicou!");
});
```

Delegação de eventos (um listener para vários itens):

```js
document.querySelector("nav").addEventListener("click", (e) => {
  const link = e.target.closest(".nav-btn");
  if (!link) return;
  // ...
});
```

### 6.4 Exemplo prático: menu hambúrguer para celular

HTML:

```html
<button class="menu-toggle" aria-expanded="false" aria-controls="menu">Menu</button>
<nav id="menu" class="container">...</nav>
```

CSS:

```css
@media (max-width: 860px) {
  nav.container { display: none; }
  nav.container.aberto { display: flex; }
}
```

JS:

```js
const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#menu");

toggle.addEventListener("click", () => {
  const aberto = menu.classList.toggle("aberto");
  toggle.setAttribute("aria-expanded", aberto);
});
```

### 6.4b Esperar o DOM

Com `<script defer>` o código só roda depois do HTML carregar, então não precisa de `DOMContentLoaded`.

### 6.5 Assíncrono e consumo da API (seu FastAPI)

```js
async function carregarUsuarios() {
  try {
    const resposta = await fetch("http://127.0.0.1:8000/usuarios");
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    const dados = await resposta.json();
    console.log(dados);
  } catch (erro) {
    console.error("Falha ao carregar:", erro);
    // mostre uma mensagem clara na tela
  }
}
carregarUsuarios();
```

Envio de dados (POST):

```js
await fetch("/mensagens", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ texto: "Olá" }),
});
```

### 6.6 Armazenamento no navegador

```js
localStorage.setItem("tema", "escuro");
const tema = localStorage.getItem("tema");
// objetos: JSON.stringify(obj) / JSON.parse(texto)
```

Nunca guarde senhas ou dados sensíveis aqui.

### 6.7 Módulos e organização

```html
<script type="module" src="main.js"></script>
```

```js
// utils.js
export function formatarData(d) { return d.toLocaleDateString("pt-BR"); }
// main.js
import { formatarData } from "./utils.js";
```

Uma função faz **uma** coisa, com nome que diz o que ela faz (`abrirMenu`, não `fn1`).

### 6.7b Boas práticas

- Valide a entrada do usuário no front **e** no back-end.
- Trate erros (`try/catch`) e mostre feedback na tela.
- Evite variáveis globais.
- Não repita código: extraia funções.
- Comente o **porquê**, não o óbvio.

---

## 7. Acessibilidade (essencial no Omni IA)

O seu projeto é de acessibilidade, então isso é requisito, não extra.

1. **Contraste** de texto de no mínimo 4,5:1 (confira no DevTools ou em contrast-checker).
2. **Teclado:** tudo precisa funcionar com Tab, Enter e Esc. Nunca remova o `outline` sem substituir:

   ```css
   :focus-visible { outline: 3px solid #1458a7; outline-offset: 2px; }
   ```
3. **Semântica antes de ARIA.** Use `<button>`, `<nav>`, `<main>` antes de recorrer a `role=`.
4. **ARIA onde precisa:** `aria-label`, `aria-expanded`, `aria-current="page"`, `aria-live="polite"` para mensagens do chat que aparecem sozinhas.
5. **Não dependa só de cor** para informar (adicione ícone ou texto).
6. **Legendas e texto alternativo** em vídeo, áudio e imagens. Para Libras, ofereça o vídeo de intérprete e a transcrição.
7. **Fonte ajustável:** use `rem` para o usuário poder aumentar o texto.
8. **Respeite** `prefers-reduced-motion`.

---

## 8. Estrutura de projeto

```
omni_ia_support/
├── index.html
├── dashboard.html
├── chat.html
├── traduzir.html
├── css/
│   ├── base.css        (reset, variáveis, tipografia)
│   ├── layout.css      (header, grid)
│   └── components.css  (botões, cards, user-pill)
├── js/
│   ├── main.js
│   └── api.js          (chamadas ao FastAPI)
├── img/
├── fonts/
└── backend/ (main.py, models.py, ...)
```

- Nomes de arquivo em minúsculas, sem espaços e sem acentos.
- Caminhos relativos corretos (`css/style.css`, não `C:\...`).
- Use **Git** desde o começo: commits pequenos com mensagem clara.

---

## 9. Ferramentas e depuração

| Ferramenta | Para quê |
| --- | --- |
| DevTools → Elements | Inspecionar e testar CSS ao vivo |
| DevTools → Console | Erros de JS |
| DevTools → Network | Arquivos não encontrados (404), chamadas da API |
| Modo dispositivo | Simular celular e tablet |
| Lighthouse | Nota de desempenho e acessibilidade |
| VS Code + Live Server | Recarrega a página ao salvar |
| Prettier / ESLint | Formatam e apontam erros no código |
| caniuse.com / MDN | Compatibilidade e documentação confiável |

**Roteiro quando algo não funciona:**

1. Abra o Console e o Network. Veja se há erro vermelho ou 404.
2. Inspecione o elemento: qual regra CSS está valendo e qual está riscada?
3. Isole o problema em um arquivo pequeno.
4. Leia a mensagem de erro inteira, ela quase sempre diz a linha.

---

## 10. Checklist antes de entregar

- [ ] `lang` e `viewport` definidos, `<title>` preenchido
- [ ] HTML validado, sem tags soltas ou `<div>` abertas
- [ ] Um `<h1>`; títulos em ordem (h1 → h2 → h3)
- [ ] Todas as imagens com `alt`; todos os inputs com `label`
- [ ] Nenhum `<button>` dentro de `<a>`
- [ ] Testado em 360px, 768px, 1024px e 1440px
- [ ] Sem rolagem horizontal
- [ ] Navegação completa só com teclado, com foco visível
- [ ] Contraste suficiente
- [ ] Console sem erros; Network sem 404
- [ ] Lighthouse com acessibilidade acima de 90
- [ ] Sem `console.log`, comentários de teste ou código morto

---

## 11. Roteiro de estudo

1. **HTML semântico e formulários** (1–2 semanas).
2. **CSS:** box model, Flexbox, Grid, media queries (3–4 semanas). Pratique reproduzindo sites reais.
3. **JavaScript básico:** variáveis, funções, arrays, objetos, DOM, eventos (4 semanas).
4. **JavaScript intermediário:** `fetch`, async/await, módulos, JSON (3 semanas).
5. **Projeto integrado:** conectar o front ao FastAPI do Omni IA.
6. **Depois:** Git/GitHub, acessibilidade a fundo, um framework (React ou Vue) e TypeScript.

**Fontes confiáveis:** MDN Web Docs (developer.mozilla.org, em português), web.dev, CSS-Tricks (guias de Flexbox e Grid), Flexbox Froggy e Grid Garden (jogos para praticar), WCAG (w3.org/WAI) para acessibilidade.

---

### Resumo em 10 regras

1. Semântica primeiro. 2. Mobile-first. 3. Unidades relativas. 4. Flex para linha, Grid para página. 5. Variáveis CSS. 6. Classes, não IDs. 7. JS troca classes, CSS cuida do visual. 8. Trate erros em tudo que é assíncrono. 9. Acessibilidade desde o início. 10. Teste em telas reais, não só na sua.