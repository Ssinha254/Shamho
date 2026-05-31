import { supabase } from "../lib/supabase";

export const deliveryService = {
  async sendDeliveryOtp(transactionId: string): Promise<{ otp: string }> {
    const { data, error } = await supabase.functions.invoke(
      "send-delivery-otp",
      {
        body: { transactionId },
      },
    );

    if (error) {
      throw error;
    }

    return data as { otp: string };
  },
};
