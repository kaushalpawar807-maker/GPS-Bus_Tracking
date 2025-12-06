import { CreditCard, Calendar, Lock } from 'lucide-react';

export default function CreditCardForm() {
    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700">Card Details</h3>
                <div className="flex gap-2">
                    <div className="w-8 h-5 bg-blue-600 rounded"></div>
                    <div className="w-8 h-5 bg-orange-500 rounded"></div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Card Number</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-mono"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Expiry</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="MM/YY"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-mono"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">CVC</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="123"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-100 p-2 rounded">
                <Lock className="w-3 h-3" />
                Payments are secure and encrypted.
            </div>
        </div>
    );
}
