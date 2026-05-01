import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import './PricingPage.css';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started.',
    features: ['10 Testimonials', '1 Collection Form', 'Basic Widget Template'],
    buttonText: 'Current Plan',
    disabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    description: 'Advanced features for growing brands.',
    features: ['Unlimited Testimonials', 'Unlimited Forms', '20+ Widget Templates', 'Custom Branding', 'Social Imports'],
    buttonText: 'Upgrade to Pro',
    disabled: false,
    priceId: 'price_H5ggY9...', // Placeholder
  },
];

export default function PricingPage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const { url } = await api.createCheckoutSession(workspaceId, priceId);
      window.location.href = url;
    } catch (err) {
      toast.error('Failed to initiate checkout. Please check if STRIPE_SECRET_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <Link to={`/workspaces/${workspaceId}`} className="btn-back">← Back to Workspace</Link>
      <header className="pricing-header">
        <h1>Plans & Pricing</h1>
        <p>Choose the plan that's right for your business.</p>
      </header>

      <div className="plans-grid">
        {PLANS.map(plan => (
          <div key={plan.id} className={`plan-card ${plan.id === 'pro' ? 'featured' : ''}`}>
            {plan.id === 'pro' && <div className="badge">Recommended</div>}
            <h3>{plan.name}</h3>
            <div className="plan-price">
              <span className="amount">{plan.price}</span>
              <span className="period">/month</span>
            </div>
            <p className="plan-description">{plan.description}</p>
            <ul className="plan-features">
              {plan.features.map(f => <li key={f}>✓ {f}</li>)}
            </ul>
            <button 
              className={`btn-${plan.id === 'pro' ? 'primary' : 'secondary'}`}
              onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
              disabled={plan.disabled || loading}
            >
              {loading ? 'Processing...' : plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
