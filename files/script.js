/* ===== Configuración ===== */
const CONFIG = {
  // Si tienes un servicio para recibir pedidos (Formspree, EmailJS, tu propio backend),
  // pega aquí su URL. Se enviará un POST con los datos en JSON.
  orderEndpoint: "",
  currency: "COP",
  locale: "es-CO",
  storageKey: "kitty-cart"
};

/* ===== Productos de ejemplo (cámbialos por los tuyos) ===== */
const CATEGORY_NAMES = {
  accesorios: "Accesorios",
  belleza: "Belleza",
  papeleria: "Papelería",
  regalos: "Regalos"
};

const PRODUCTS = [
  { id: 1,  cat: "accesorios", emoji: "🎀", name: "Set de moños de satín", desc: "Pack de 3 moños en tonos pastel.", price: 18000 },
  { id: 2,  cat: "accesorios", emoji: "💍", name: "Anillos delicados", desc: "Dos anillos ajustables bañados en dorado.", price: 24000 },
  { id: 3,  cat: "accesorios", emoji: "👜", name: "Mini bolso lila", desc: "Ideal para lo esencial del día.", price: 59000 },
  { id: 4,  cat: "belleza",    emoji: "💄", name: "Brillo labial rosa", desc: "Acabado jugoso con aroma a vainilla.", price: 22000 },
  { id: 5,  cat: "belleza",    emoji: "🧴", name: "Crema de manos", desc: "Hidratación suave con karité.", price: 19000 },
  { id: 6,  cat: "belleza",    emoji: "🪞", name: "Espejo de bolsillo", desc: "Compacto, con marco rosa pastel.", price: 15000 },
  { id: 7,  cat: "papeleria",  emoji: "📓", name: "Cuaderno de tapa blanda", desc: "80 hojas punteadas, tonos lila.", price: 21000 },
  { id: 8,  cat: "papeleria",  emoji: "✏️", name: "Kit de lápices pastel", desc: "Set de 6 lápices con borrador.", price: 14000 },
  { id: 9,  cat: "papeleria",  emoji: "🏷️", name: "Stickers florales", desc: "Hoja con 40 stickers resistentes al agua.", price: 9000 },
  { id: 10, cat: "regalos",    emoji: "🎁", name: "Caja sorpresa", desc: "Mezcla de accesorios y papelería.", price: 65000 },
  { id: 11, cat: "regalos",    emoji: "🕯️", name: "Vela aromática", desc: "Aroma a peonía, 40 horas de duración.", price: 32000 },
  { id: 12, cat: "regalos",    emoji: "💌", name: "Tarjeta con sobre", desc: "Escribe un mensaje que se recuerde.", price: 7000 }
];

/* ===== Utilidades ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = n => new Intl.NumberFormat(CONFIG.locale, {
  style: "currency", currency: CONFIG.currency, maximumFractionDigits: 0
}).format(n);

/* ===== Estado ===== */
let cart = loadCart();
let currentFilter = "todos";
let checkoutMode = false;

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || []; }
  catch { return []; }
}
function saveCart() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart)); } catch {}
}

/* ===== Productos ===== */
function renderProducts() {
  const list = currentFilter === "todos" ? PRODUCTS : PRODUCTS.filter(p => p.cat === currentFilter);
  $("#productGrid").innerHTML = list.map(p => `
    <article class="product">
      <div class="product-img" aria-hidden="true">${p.emoji}</div>
      <div class="product-body">
        <span class="product-cat">${CATEGORY_NAMES[p.cat]}</span>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="product-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add-btn" data-add="${p.id}" aria-label="Agregar ${p.name} al carrito">Agregar</button>
        </div>
      </div>
    </article>
  `).join("");
}

function setFilter(filter) {
  currentFilter = filter;
  $$(".chip").forEach(c => c.classList.toggle("active", c.dataset.filter === filter));
  renderProducts();
}

$("#filters").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (chip) setFilter(chip.dataset.filter);
});

$$(".cat-card").forEach(card => {
  card.addEventListener("click", () => {
    setFilter(card.dataset.cat);
    $("#productos").scrollIntoView({ behavior: "smooth" });
  });
});

$("#productGrid").addEventListener("click", e => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  addToCart(Number(btn.dataset.add));
});

/* ===== Carrito ===== */
function addToCart(id) {
  const item = cart.find(i => i.id === id);
  if (item) item.qty += 1; else cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  const btn = $("#openCart");
  btn.classList.remove("bump");
  void btn.offsetWidth;
  btn.classList.add("bump");
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

function renderCart() {
  cart = cart.filter(i => PRODUCTS.some(p => p.id === i.id));
  const count = cart.reduce((s, i) => s + i.qty, 0);
  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = money(cartTotal());
  $("#cartEmpty").hidden = cart.length > 0;
  $("#checkoutBtn").disabled = cart.length === 0;

  $("#cartList").innerHTML = cart.map(i => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return `
      <li class="cart-item">
        <div class="cart-thumb" aria-hidden="true">${p.emoji}</div>
        <div>
          <h5>${p.name}</h5>
          <small>${money(p.price)}</small>
          <div class="qty">
            <button data-minus="${p.id}" aria-label="Quitar una unidad de ${p.name}">−</button>
            <span aria-live="polite">${i.qty}</span>
            <button data-plus="${p.id}" aria-label="Agregar una unidad de ${p.name}">+</button>
          </div>
        </div>
        <button class="remove" data-remove="${p.id}">Quitar</button>
      </li>`;
  }).join("");
}

$("#cartList").addEventListener("click", e => {
  const t = e.target;
  if (t.dataset.plus) changeQty(Number(t.dataset.plus), 1);
  if (t.dataset.minus) changeQty(Number(t.dataset.minus), -1);
  if (t.dataset.remove) removeItem(Number(t.dataset.remove));
});

/* ===== Drawer ===== */
const drawer = $("#drawer");
const overlay = $("#overlay");

function openCart() {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.classList.add("no-scroll");
  $("#closeCart").focus();
}
function closeCart() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.classList.remove("no-scroll");
  $("#openCart").focus();
}
function setCheckoutMode(on) {
  checkoutMode = on;
  $("#cartView").hidden = on;
  $("#checkoutForm").hidden = !on;
  $("#backBtn").hidden = !on;
  $("#checkoutBtn").textContent = on ? "Confirmar pedido" : "Continuar con el pedido";
  $("#drawerTitle").textContent = on ? "Tus datos" : "Tu carrito";
  $("#checkoutMsg").textContent = "";
  $("#checkoutMsg").classList.remove("error");
}

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) closeCart(); });
$("#backBtn").addEventListener("click", () => setCheckoutMode(false));

/* ===== Validación de formularios ===== */
function validateForm(form, msgEl) {
  let firstInvalid = null;
  $$("input[required], textarea[required]", form).forEach(field => {
    const ok = field.type === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())
      : field.type === "tel"
        ? field.value.replace(/\D/g, "").length >= 7
        : field.value.trim() !== "";
    field.classList.toggle("invalid", !ok);
    if (!ok && !firstInvalid) firstInvalid = field;
  });
  if (firstInvalid) {
    msgEl.textContent = "Revisa los campos marcados en rojo.";
    msgEl.classList.add("error");
    firstInvalid.focus();
    return false;
  }
  msgEl.classList.remove("error");
  return true;
}

/* ===== Pedido ===== */
$("#checkoutBtn").addEventListener("click", async () => {
  if (!checkoutMode) { setCheckoutMode(true); return; }

  const form = $("#checkoutForm");
  const msg = $("#checkoutMsg");
  if (!validateForm(form, msg)) return;

  const order = {
    id: "KT-" + Date.now().toString().slice(-6),
    cliente: Object.fromEntries(new FormData(form)),
    productos: cart.map(i => {
      const p = PRODUCTS.find(p => p.id === i.id);
      return { nombre: p.name, cantidad: i.qty, precio: p.price };
    }),
    total: cartTotal()
  };

  const btn = $("#checkoutBtn");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    if (CONFIG.orderEndpoint) {
      const res = await fetch(CONFIG.orderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      if (!res.ok) throw new Error("Error al enviar");
    }
    showSuccess(order);
  } catch {
    msg.textContent = "No pudimos enviar tu pedido. Intenta de nuevo en un momento.";
    msg.classList.add("error");
    btn.disabled = false;
    btn.textContent = "Confirmar pedido";
  }
});

function showSuccess(order) {
  cart = [];
  saveCart();
  renderCart();
  $("#checkoutForm").reset();
  $("#checkoutForm").hidden = true;
  $("#drawerFoot").hidden = true;
  $("#drawerTitle").textContent = "Pedido enviado";
  $("#successText").textContent =
    `Tu pedido ${order.id} por ${money(order.total)} quedó registrado. Te contactaremos al ${order.cliente.telefono} para confirmar el pago y la entrega.`;
  $("#success").hidden = false;
}

$("#successClose").addEventListener("click", () => {
  $("#success").hidden = true;
  $("#drawerFoot").hidden = false;
  setCheckoutMode(false);
  renderCart();
  closeCart();
});

/* ===== Menú móvil ===== */
const menuBtn = $("#menuBtn");
const nav = $("#nav");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});
$$("#nav a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
}));

/* ===== Formulario de contacto ===== */
$("#contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const msg = $("#contactMsg");
  if (!validateForm(form, msg)) return;
  // Aquí puedes conectar un servicio (Formspree, EmailJS, etc.)
  form.reset();
  msg.textContent = "¡Gracias! Recibimos tu mensaje y te responderemos pronto.";
});

/* ===== Inicio ===== */
$("#year").textContent = new Date().getFullYear();
renderProducts();
renderCart();
