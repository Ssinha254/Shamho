import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  transactionId?: string;
};

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const parseRemarkValue = (remarks: string | null, key: string) => {
  if (!remarks) return "";
  const match = remarks.match(new RegExp(`${key}:([^|]+)`));
  return match?.[1] || "";
};

const buildRemarks = (currentRemarks: string | null, otp: string) => {
  if (!currentRemarks) {
    return `DELIVERY_PENDING|otp:${otp}`;
  }

  if (currentRemarks.includes("otp:")) {
    return currentRemarks.replace(/otp:[^|]+/, `otp:${otp}`);
  }

  return `${currentRemarks}|otp:${otp}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const transactionId = body.transactionId?.trim();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "transactionId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
      return new Response(
        JSON.stringify({ error: "Missing Twilio credentials" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("transaction_id, transaction_code, member_id, remarks")
      .eq("transaction_id", transactionId)
      .single();

    if (transactionError || !transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("member_id, member_name, mobile")
      .eq("member_id", transaction.member_id)
      .single();

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: "Member not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mobile = (member.mobile || "").trim();
    if (!mobile) {
      return new Response(
        JSON.stringify({ error: "Member mobile number is missing" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const otp = generateOtp();
    const remarks = buildRemarks(transaction.remarks, otp);

    const { error: updateError } = await supabase
      .from("transactions")
      .update({ remarks })
      .eq("transaction_id", transactionId);

    if (updateError) {
      throw updateError;
    }

    const smsBody = `Shamho ERP delivery OTP for bill ${transaction.transaction_code}: ${otp}. Share this OTP with the truck driver only after delivery.`;

    const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const smsResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({
          To: mobile,
          From: twilioFromNumber,
          Body: smsBody,
        }),
      },
    );

    if (!smsResponse.ok) {
      const smsError = await smsResponse.text();
      return new Response(
        JSON.stringify({ error: "SMS send failed", details: smsError }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ otp, mobile, transactionId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
