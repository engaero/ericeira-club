import "server-only";
import Stripe from "stripe";

// Sem apiVersion fixa e sem @ts-ignore: o SDK usa a versão de API com que foi publicado.
// (O "|| ''" mantém o build a passar sem chave; o Stripe falha no primeiro pedido se faltar.)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  typescript: true,
});
