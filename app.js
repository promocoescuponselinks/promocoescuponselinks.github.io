// O HTML já vem pronto (bom para o Google). Aqui só: busca, filtros, "há X h" e copiar cupom.
(function () {
  const $ = (s) => document.querySelector(s);
  const cards = [...document.querySelectorAll("#grade .card")];
  const q = $("#q"), filtros = $("#filtros"), contador = $("#contador"), vazio = $("#vazio");
  let filtro = "Todas";

  function tempo(iso) {
    const min = Math.round((Date.now() - new Date(iso)) / 60000);
    if (min < 60) return `há ${Math.max(min, 1)} min`;
    const h = Math.round(min / 60);
    return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
  }
  document.querySelectorAll("time[datetime]").forEach((t) => (t.textContent = tempo(t.getAttribute("datetime"))));

  function aplicar() {
    const termo = (q?.value || "").trim().toLowerCase();
    let n = 0;
    for (const c of cards) {
      const ok = (filtro === "Todas" || (filtro === "cupom" ? c.dataset.cupom === "1" : c.dataset.loja === filtro))
        && (!termo || c.dataset.busca.includes(termo));
      c.hidden = !ok; if (ok) n++;
    }
    if (contador) contador.textContent = `${n} oferta${n === 1 ? "" : "s"}`;
    if (vazio) vazio.hidden = n > 0;
  }
  q?.addEventListener("input", aplicar);

  // Ordenar: mais recentes / menor preço / maior preço / maior desconto (sem preço vai pro fim)
  const ordem = $("#ordem"), grade = $("#grade");
  function ordenar() {
    if (!ordem || !grade) return;
    const modo = ordem.value;
    const num = (c, k) => parseFloat(c.dataset[k]);
    const sorted = [...cards].sort((a, b) => {
      if (modo === "recentes") return num(a, "ordem") - num(b, "ordem");
      if (modo === "desconto") return (num(b, "desconto") || 0) - (num(a, "desconto") || 0);
      const pa = num(a, "preco"), pb = num(b, "preco");
      if (isNaN(pa) && isNaN(pb)) return 0;
      if (isNaN(pa)) return 1;
      if (isNaN(pb)) return -1;
      return modo === "barato" ? pa - pb : pb - pa;
    });
    for (const c of sorted) grade.appendChild(c);
    try { localStorage.setItem("ordem", modo); } catch {}
  }
  if (ordem) {
    try { const salvo = localStorage.getItem("ordem"); if (salvo) ordem.value = salvo; } catch {}
    ordem.addEventListener("change", ordenar);
    if (ordem.value !== "recentes") ordenar();
  }
  filtros?.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    filtro = b.dataset.filtro;
    filtros.querySelectorAll("button").forEach((x) => x.classList.toggle("ativo", x === b));
    aplicar();
  });
  if (location.hash === "#cupons" && filtros) filtros.querySelector('[data-filtro="cupom"]')?.click();

  // Copiar cupom
  const aviso = $("#aviso"); let t;
  function avisar(msg) { aviso.textContent = msg; aviso.hidden = false; clearTimeout(t); t = setTimeout(() => (aviso.hidden = true), 2600); }
  async function copiar(txt) {
    try { await navigator.clipboard.writeText(txt); return true; }
    catch { const a = document.createElement("textarea"); a.value = txt; document.body.append(a); a.select(); const ok = document.execCommand("copy"); a.remove(); return ok; }
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".ticket-cod"); if (!b) return;
    const ok = await copiar(b.dataset.cupom);
    b.classList.add("copiado"); b.querySelector("span").textContent = ok ? "copiado ✓" : "copie";
    setTimeout(() => { b.classList.remove("copiado"); b.querySelector("span").textContent = "copiar"; }, 2500);
    avisar(ok ? `Cupom ${b.dataset.cupom} copiado — cole no carrinho da loja 🛒` : `Cupom: ${b.dataset.cupom}`);
  });
})();

// Tema claro/escuro: segue o aparelho até a pessoa escolher; a escolha fica salva.
(function () {
  const b = document.getElementById("btn-tema"); if (!b) return;
  const raiz = document.documentElement;
  b.addEventListener("click", () => {
    const novo = raiz.dataset.tema === "escuro" ? "claro" : "escuro";
    raiz.dataset.tema = novo;
    try { localStorage.setItem("tema", novo); } catch {}
  });
  // se a pessoa nunca escolheu, acompanha a troca do sistema
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
    try { if (localStorage.getItem("tema")) return; } catch {}
    raiz.dataset.tema = e.matches ? "escuro" : "claro";
  });
})();
