(function () {
  const cfg = window.SITE_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const grade = $("#grade"), q = $("#q"), filtros = $("#filtros");
  let ofertas = [], lojaAtiva = "Todas";

  $("#link-grupo").href = cfg.linkGrupoWhatsApp || "#";

  const brl = (v) => typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function tempo(iso) {
    const min = Math.round((Date.now() - new Date(iso)) / 60000);
    if (min < 60) return `há ${Math.max(min, 1)} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `há ${h} h`;
    return `há ${Math.round(h / 24)} d`;
  }

  function card(o) {
    const desconto = o.precoAntigo && o.preco && o.precoAntigo > o.preco
      ? Math.round((1 - o.preco / o.precoAntigo) * 100) : null;
    const img = o.imagem
      ? `<img src="${esc(o.imagem)}" alt="" loading="lazy">`
      : `<div class="sem-img">🛍️</div>`;
    return `
      <article class="card">
        <a class="card-img" href="${esc(o.link)}" target="_blank" rel="sponsored noopener">${img}
          ${desconto ? `<span class="selo">-${desconto}%</span>` : ""}</a>
        <div class="card-corpo">
          <span class="loja loja-${esc((o.loja || "").toLowerCase().replace(/\s+/g, "-"))}">${esc(o.loja || "Loja")}</span>
          <h2>${esc(o.titulo)}</h2>
          <div class="precos">
            ${o.precoAntigo ? `<s>${brl(o.precoAntigo)}</s>` : ""}
            ${o.preco ? `<strong>${brl(o.preco)}</strong>` : ""}
          </div>
          ${o.cupom ? `<p class="cupom">Cupom: <code>${esc(o.cupom)}</code></p>` : ""}
          <a class="btn" href="${esc(o.link)}" target="_blank" rel="sponsored noopener">Ver oferta</a>
          ${o.data ? `<time>${tempo(o.data)}</time>` : ""}
        </div>
      </article>`;
  }

  function render() {
    const termo = q.value.trim().toLowerCase();
    const lista = ofertas.filter((o) =>
      (lojaAtiva === "Todas" || o.loja === lojaAtiva) &&
      (!termo || (o.titulo + " " + (o.loja || "")).toLowerCase().includes(termo)));
    grade.innerHTML = lista.map(card).join("");
    $("#vazio").hidden = lista.length > 0;
    $("#contador").textContent = `${lista.length} oferta${lista.length === 1 ? "" : "s"}`;
  }

  function montarFiltros() {
    const lojas = ["Todas", ...new Set(ofertas.map((o) => o.loja).filter(Boolean))];
    filtros.innerHTML = lojas.map((l) =>
      `<button type="button" data-loja="${esc(l)}" class="${l === lojaAtiva ? "ativo" : ""}">${esc(l)}</button>`).join("");
    filtros.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      lojaAtiva = b.dataset.loja; montarFiltros(); render();
    };
  }

  fetch((cfg.arquivoOfertas || "produtos.json") + "?v=" + Date.now())
    .then((r) => r.json())
    .then((dados) => {
      const limite = Date.now() - (cfg.diasValidade || 7) * 864e5;
      ofertas = dados
        .filter((o) => o.link && o.titulo && (!o.data || new Date(o.data) >= limite))
        .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
      montarFiltros(); render();
    })
    .catch(() => { grade.innerHTML = "<p>Não foi possível carregar as ofertas.</p>"; });

  q.addEventListener("input", render);
})();
