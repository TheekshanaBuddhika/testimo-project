import './StaticPage.css';

export default function TermsPage() {
  return (
    <div className="static-page">
      <div className="static-container">
        <header className="static-header">
          <div className="static-header-text">
            <h1>Terms and Conditions</h1>
            <p className="last-updated">Effective Date: January 29, 2026</p>
          </div>
          <button onClick={() => window.close()} className="btn-close">Close Tab</button>
        </header>

        <section className="static-content">
          <p>By accessing or using Testimo, you agree to be bound by these terms:</p>
          
          <div className="policy-item">
            <h2>1. Platform Purpose</h2>
            <p>Testimo is a management tool for collecting, organizing, and displaying text-based customer testimonials via embeddable web widgets.</p>
          </div>

          <div className="policy-item">
            <h2>2. Account Registration</h2>
            <p>Use of the platform requires authentication via Google OAuth. You agree to provide accurate information and maintain the security of your access.</p>
          </div>

          <div className="policy-item">
            <h2>3. Data Synchronization</h2>
            <p>For users on paid tiers, the platform provides automated synchronization with Google, Facebook, and Instagram. We are not liable for service interruptions caused by changes to these third-party APIs.</p>
          </div>

          <div className="policy-item">
            <h2>4. Widget Implementation</h2>
            <p>You are responsible for the correct placement of the "No-code" embeddable widgets on your own websites.</p>
          </div>

          <div className="policy-item">
            <h2>5. Fees and Billing</h2>
            <p>Subscriptions are managed through Stripe. All fees are non-refundable unless otherwise stated at the time of purchase.</p>
          </div>

          <div className="policy-item">
            <h2>6. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that use the platform to display fraudulent, harassing, or illegal content.</p>
          </div>
        </section>


      </div>
    </div>
  );
}
