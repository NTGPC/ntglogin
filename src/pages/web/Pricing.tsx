import React from 'react';
import { Check } from 'lucide-react';

const Pricing = () => {
    const plans = [
        {
            name: 'Starter',
            price: '0đ',
            desc: 'Dành cho người mới bắt đầu',
            features: ['5 Profiles', 'Basic Fingerprint', 'Không hỗ trợ Auto Edit', 'Cộng đồng hỗ trợ'],
            button: 'Dùng thử',
            color: 'bg-white border-gray-200 text-slate-800'
        },
        {
            name: 'Pro',
            price: '299k',
            period: '/tháng',
            desc: 'Cho dân MMO chuyên nghiệp',
            features: ['100 Profiles', 'Advanced Fingerprint', 'Video Editor (Cơ bản)', 'Proxy Manager', 'Support 24/7'],
            button: 'Mua ngay',
            popular: true,
            color: 'bg-slate-900 text-white border-slate-900'
        },
        {
            name: 'Business',
            price: '999k',
            period: '/tháng',
            desc: 'Cho Team và Studio lớn',
            features: ['Unlimited Profiles', 'Full tính năng', 'Video Editor (Tốc độ cao)', 'API Access', 'Private Support'],
            button: 'Liên hệ',
            color: 'bg-white border-teal-500 text-slate-800'
        }
    ];

    return (
        <div className="py-20 bg-slate-50 min-h-screen">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Bảng giá linh hoạt</h1>
                    <p className="text-slate-500">Chọn gói phù hợp với nhu cầu của bạn. Nâng cấp hoặc hủy bất cứ lúc nào.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan, idx) => (
                        <div key={idx} className={`relative p-8 rounded-3xl border shadow-xl flex flex-col ${plan.color} transform hover:-translate-y-2 transition duration-300`}>
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                                    POPULAR
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-end gap-1 mb-2">
                                <span className="text-4xl font-black">{plan.price}</span>
                                <span className={`text-sm ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
                            </div>
                            <p className={`text-sm mb-8 ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>

                            <ul className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-center gap-3 text-sm">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.popular ? 'bg-teal-500/20 text-teal-400' : 'bg-green-100 text-green-600'}`}>
                                            <Check size={12} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button className={`w-full py-3 rounded-xl font-bold transition ${plan.popular ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>
                                {plan.button}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pricing;
