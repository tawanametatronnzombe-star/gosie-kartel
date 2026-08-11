import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const payload = await req.json();

    // Verify payment status from ZB Bank callback
    const orderID = payload.reference || payload.order_id;
    const paymentStatus = payload.status; // e.g., 'SUCCESS', 'PAID'

    if (paymentStatus === "SUCCESS" || paymentStatus === "PAID") {
      // Update status in public."Orders"
      const { error } = await supabase
        .from("Orders")
        .update({ status: "Paid" })
        .eq("order_id", orderID);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
