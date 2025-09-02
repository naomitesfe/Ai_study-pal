import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const createPaymentIntent = useAction(api.payments.createPaymentIntent);
  const confirmPayment = useMutation(api.payments.confirmPayment);

  const packages = [
    { id: "basic", tokens: 50, price: 9.99, popular: false },
    { id: "standard", tokens: 120, price: 19.99, popular: true },
    { id: "premium", tokens: 250, price: 39.99, popular: false },
  ];

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error("Please select a package");
      return;
    }

    const pkg = packages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setIsProcessing(true);
    try {
      // Create payment intent
      const { paymentIntentId } = await createPaymentIntent({
        amount: pkg.price,
        tokens: pkg.tokens,
      });

      // Simulate payment processing (in real app, use Stripe)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirm payment
      await confirmPayment({ paymentIntentId });

      toast.success(`Successfully purchased ${pkg.tokens} tokens!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Tokens</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 mb-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPackage === pkg.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {pkg.id} Package
                  </h3>
                  <p className="text-gray-600">{pkg.tokens} tokens</p>
                  <p className="text-sm text-gray-500">
                    ${(pkg.price / pkg.tokens).toFixed(3)} per token
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${pkg.price}
                  </div>
                  {pkg.id === "standard" && (
                    <div className="text-sm text-green-600 font-medium">
                      Save 20%
                    </div>
                  )}
                  {pkg.id === "premium" && (
                    <div className="text-sm text-green-600 font-medium">
                      Save 30%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">What can you do with tokens?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Book tutoring sessions with expert tutors</li>
            <li>• Access premium AI features and advanced analytics</li>
            <li>• Generate unlimited flashcards and quizzes</li>
            <li>• Download learning materials from tutors</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Purchase Tokens"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Demo mode: No real payment will be processed
        </p>
      </div>
    </div>
  );
}
