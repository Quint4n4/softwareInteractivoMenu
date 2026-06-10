// Multi-idioma de la vitrina pública.
//
// Dos cosas viven aquí:
//   1) UI: los textos fijos de la app (botones, títulos…) en cada idioma.
//   2) localizeItem / localizeCategoria: toman un platillo/categoría y
//      devuelven su versión traducida usando el campo `i18n` que ya manda el
//      backend, con respaldo (fallback) al texto base en español.
import type { PubCategoria, PubItem } from "../api/public";

export type Lang = string;

// Etiqueta legible de cada idioma (para menús/ayuda).
export const LANG_LABELS: Record<string, string> = {
  es: "Español",
  en: "English",
};

interface ItemTr {
  nombre?: string;
  descripcion?: string;
  incluye?: string[];
}
interface CatTr {
  nombre?: string;
}

/** Devuelve el platillo con nombre/descr/incluye en `lang` si hay traducción. */
export function localizeItem(it: PubItem, lang: Lang): PubItem {
  const tr = it.i18n?.[lang] as ItemTr | undefined;
  if (!tr) return it;
  return {
    ...it,
    nombre: tr.nombre ?? it.nombre,
    descripcion: tr.descripcion ?? it.descripcion,
    incluye: tr.incluye ?? it.incluye,
  };
}

/** Devuelve la categoría con su nombre en `lang` si hay traducción. */
export function localizeCategoria(c: PubCategoria, lang: Lang): PubCategoria {
  const tr = c.i18n?.[lang] as CatTr | undefined;
  if (!tr?.nombre) return c;
  return { ...c, nombre: tr.nombre };
}

export interface UIStrings {
  menuDigital: string;
  welcomeTo: string;
  heroTag: string;
  seeMenu: string;
  tapCategory: string;
  chooseTitle: string;
  startHere: string;
  favorites: string;
  menu: string;
  store: string;
  seeStore: string;
  searchPlaceholder: string;
  searchStore: string;
  options: string;
  noResultsPre: string;
  emptyMenu: string;
  bundle: string;
  includes: string;
  addToCart: string;
  addAnother: string;
  hi: string;
  welcomeNote: string;
  howVisit: string;
  dineIn: string;
  atTable: string;
  takeout: string;
  pickupBar: string;
  yourName: string;
  yourNamePh: string;
  tableNumber: string;
  tablePh: string;
  cartEmpty: string;
  cartEmptyNote: string;
  yourCart: string;
  table: string;
  each: string;
  kitchenNotes: string;
  notesPh: string;
  tip: string;
  noTip: string;
  payment: string;
  payNow: string;
  payNowSub: string;
  payCash: string;
  payCashSub: string;
  change: string;
  subtotal: string;
  tableService: string;
  included: string;
  total: string;
  sending: string;
  payConfirm: string;
  confirmOrder: string;
  payCardNote: string;
  payCashNote: string;
  tracking: string;
  eta: string;
  canceled: string;
  now: string;
  done: string;
  pending: string;
  orderSummary: string;
  paidCard: string;
  paidCash: string;
  orderAgain: string;
  ticketBtn: string;
  whatsappSend: string;
  whatsappPhone: string;
  whatsappPhonePh: string;
  thanks: string;
  downloadPdf: string;
  willSendWhatsapp: string;
  ticketNoPhone: string;
  phoneOptional: string;
  noActiveOrders: string;
  noActiveOrdersNote: string;
  tabs: { home: string; menu: string; cart: string; order: string };
  steps: Record<string, { label: string; sub: string }>;
  etiquetas: Record<string, string>;
}

const ES: UIStrings = {
  menuDigital: "Menú digital",
  welcomeTo: "Bienvenido a",
  heroTag: "Escanea, explora nuestro menú y disfruta. 🍰",
  seeMenu: "Ver el menú",
  tapCategory: "Toca una categoría para ir directo.",
  chooseTitle: "¿Qué se te antoja?",
  startHere: "Empieza aquí",
  favorites: "Favoritos",
  menu: "Menú",
  store: "Tienda",
  seeStore: "Ver la tienda",
  searchPlaceholder: "Buscar en el menú…",
  searchStore: "Buscar productos…",
  options: "opciones",
  noResultsPre: "Sin resultados para",
  emptyMenu: "Este menú aún no tiene platillos.",
  bundle: "Paquete",
  includes: "Incluye",
  addToCart: "Agregar a la orden",
  addAnother: "Agregar otro",
  hi: "¡Hola!",
  welcomeNote: "Un par de datos para preparar tu experiencia.",
  howVisit: "¿Cómo nos visitas?",
  dineIn: "Comer aquí",
  atTable: "En tu mesa",
  takeout: "Para llevar",
  pickupBar: "Recoger en barra",
  yourName: "¿A nombre de quién?",
  yourNamePh: "Tu nombre",
  tableNumber: "Número de mesa",
  tablePh: "Ej. 12",
  cartEmpty: "Tu orden está vacía",
  cartEmptyNote: "Agrega platillos desde el menú.",
  yourCart: "Tu orden",
  table: "Mesa",
  each: "c/u",
  kitchenNotes: "Notas para la cocina",
  notesPh: "Ej. sin azúcar, leche de avena…",
  tip: "Propina",
  noTip: "Sin propina",
  payment: "Forma de pago",
  payNow: "Pagar ahora",
  payNowSub: "Tarjeta o pago con QR · sin filas",
  payCash: "Pagar en efectivo",
  payCashSub: "Le pagas al mesero en tu mesa",
  change: "Cambiar",
  subtotal: "Subtotal",
  tableService: "Servicio en mesa",
  included: "Incluido",
  total: "Total",
  sending: "Enviando…",
  payConfirm: "Pagar y confirmar",
  confirmOrder: "Confirmar pedido",
  payCardNote: "Se cobrará a tu tarjeta al confirmar.",
  payCashNote: "Pagas al recibir tu pedido.",
  tracking: "Seguimiento",
  eta: "Tiempo estimado",
  canceled: "Este pedido fue cancelado.",
  now: "Ahora",
  done: "Hecho",
  pending: "Pendiente",
  orderSummary: "Resumen del pedido",
  paidCard: "Pagado con tarjeta",
  paidCash: "Pago en efectivo",
  orderAgain: "Hacer otro pedido",
  ticketBtn: "Ver / enviar ticket",
  whatsappSend: "Enviar por WhatsApp",
  whatsappPhone: "Tu número de WhatsApp",
  whatsappPhonePh: "Ej. 55 1234 5678",
  thanks: "¡Gracias por tu compra!",
  downloadPdf: "Imprimir / Descargar PDF",
  willSendWhatsapp: "Te enviaremos tu ticket por WhatsApp ✓",
  ticketNoPhone: "Para recibir tu ticket, deja tu WhatsApp al ordenar.",
  phoneOptional: "Opcional — te enviaremos tu ticket por aquí.",
  noActiveOrders: "Sin pedidos activos",
  noActiveOrdersNote: "Cuando hagas un pedido, aquí podrás seguirlo.",
  tabs: { home: "Inicio", menu: "Menú", cart: "Orden", order: "Pedido" },
  steps: {
    nuevo: { label: "Pedido recibido", sub: "Confirmamos tu pedido" },
    en_proceso: { label: "En preparación", sub: "Manos a la obra" },
    listo: { label: "Listo", sub: "Pasa por él o te lo llevamos" },
    entregado: { label: "Entregado", sub: "¡Disfrútalo!" },
  },
  etiquetas: { Favorito: "Favorito", Ligero: "Ligero", Nuevo: "Nuevo" },
};

const EN: UIStrings = {
  menuDigital: "Digital menu",
  welcomeTo: "Welcome to",
  heroTag: "Scan, explore our menu and enjoy. 🍰",
  seeMenu: "See the menu",
  tapCategory: "Tap a category to jump right in.",
  chooseTitle: "What are you craving?",
  startHere: "Start here",
  favorites: "Favorites",
  menu: "Menu",
  store: "Store",
  seeStore: "See the store",
  searchPlaceholder: "Search the menu…",
  searchStore: "Search products…",
  options: "options",
  noResultsPre: "No results for",
  emptyMenu: "This menu has no dishes yet.",
  bundle: "Bundle",
  includes: "Includes",
  addToCart: "Add to order",
  addAnother: "Add another",
  hi: "Hi there!",
  welcomeNote: "A couple of details to set up your experience.",
  howVisit: "How are you visiting?",
  dineIn: "Dine in",
  atTable: "At your table",
  takeout: "Takeout",
  pickupBar: "Pick up at counter",
  yourName: "Under what name?",
  yourNamePh: "Your name",
  tableNumber: "Table number",
  tablePh: "e.g. 12",
  cartEmpty: "Your order is empty",
  cartEmptyNote: "Add dishes from the menu.",
  yourCart: "Your order",
  table: "Table",
  each: "ea.",
  kitchenNotes: "Notes for the kitchen",
  notesPh: "e.g. no sugar, oat milk…",
  tip: "Tip",
  noTip: "No tip",
  payment: "Payment method",
  payNow: "Pay now",
  payNowSub: "Card or QR pay · no lines",
  payCash: "Pay with cash",
  payCashSub: "Pay the server at your table",
  change: "Change",
  subtotal: "Subtotal",
  tableService: "Table service",
  included: "Included",
  total: "Total",
  sending: "Sending…",
  payConfirm: "Pay & confirm",
  confirmOrder: "Confirm order",
  payCardNote: "Your card will be charged on confirmation.",
  payCashNote: "You pay when you get your order.",
  tracking: "Tracking",
  eta: "Estimated time",
  canceled: "This order was canceled.",
  now: "Now",
  done: "Done",
  pending: "Pending",
  orderSummary: "Order summary",
  paidCard: "Paid by card",
  paidCash: "Cash payment",
  orderAgain: "Order again",
  ticketBtn: "View / send ticket",
  whatsappSend: "Send via WhatsApp",
  whatsappPhone: "Your WhatsApp number",
  whatsappPhonePh: "e.g. 55 1234 5678",
  thanks: "Thanks for your order!",
  downloadPdf: "Print / Download PDF",
  willSendWhatsapp: "We'll send your ticket via WhatsApp ✓",
  ticketNoPhone: "To get your ticket, leave your WhatsApp when ordering.",
  phoneOptional: "Optional — we'll send your ticket here.",
  noActiveOrders: "No active orders",
  noActiveOrdersNote: "When you place an order, you can track it here.",
  tabs: { home: "Home", menu: "Menu", cart: "Order", order: "Track" },
  steps: {
    nuevo: { label: "Order received", sub: "We confirmed your order" },
    en_proceso: { label: "Preparing", sub: "On it!" },
    listo: { label: "Ready", sub: "Pick it up or we'll bring it" },
    entregado: { label: "Delivered", sub: "Enjoy!" },
  },
  etiquetas: { Favorito: "Favorite", Ligero: "Light", Nuevo: "New" },
};

export const UI: Record<string, UIStrings> = { es: ES, en: EN };

/** Devuelve los textos del idioma pedido, con respaldo a español. */
export function uiFor(lang: Lang): UIStrings {
  return UI[lang] ?? ES;
}
