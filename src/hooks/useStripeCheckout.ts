import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

export const useStripeCheckout = () => {
    const createCheckout = useAction(api.billing.createCheckoutSession);

    const startCheckout = async (invoiceId: string) => {
        try {
            toast.info("Initializing checkout...");
            const result = await createCheckout({ type: 'invoice', invoiceId });

            if (result && result.url) {
                window.location.href = result.url;
            } else {
                toast.error("Error: No Checkout URL returned.");
            }
        } catch (error: any) {
            console.error("Checkout validation failed:", error);
            toast.error("Failed to start payment: " + (error.message || "Unknown error"));
        }
    };

    return { startCheckout };
};
