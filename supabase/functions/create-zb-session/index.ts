import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ZB_MERCHANT_ID = Deno.env.get("ZB_MERCHANT_ID") || "YOUR_ZB_MERCHANT_ID";
const ZB_SECRET_KEY = Deno.env.get("ZB_SECRET_KEY") || "YOUR_ZB_SECRET_KEY";
const ZB_GATEWAY_URL = "https://gateway.zbbank.co.zw/api/v1/checkout"; // ZB Endpoint

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, amount, customer_email, customer_name } = await req.json();

    if (!order_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing required order parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const returnUrl = `https://tawanametatronnzombe-star.github.io/gosie-kartel/order-success.html?order_id=${order_id}`;
    const cancelUrl = `https://tawanametatronnzombe-star.github.io/gosie-kartel/checkout.html`;
    const callbackUrl = `https://tnlktzagziuwjjzgrrna.supabase.co/functions/v1/zb-webhook`;

    // 1. Generate SHA256 Signature for ZB Validation
    const signatureData = `${ZB_MERCHANT_ID}|${order_id}|${amount}|USD|${ZB_SECRET_KEY}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(signatureData));
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 2. Prepare payload for ZB Gateway
    const zbPayload = {
      merchant_id: ZB_MERCHANT_ID,
      reference: order_id,
      amount: amount,
      currency: "USD",
      email: customer_email,
      name: customer_name,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      callback_url: callbackUrl,
      signature: signature,
    };

    // 3. Initiate checkout with ZB Gateway
    const response = await fetch(ZB_GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(zbPayload),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ checkout_url: result.checkout_url || result.redirect_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
        
