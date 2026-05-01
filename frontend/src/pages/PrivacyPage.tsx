//  M.Theekshana Buddhika - 25021196
import './StaticPage.css';

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="static-page">
      <div className="static-container">
        <header className="static-header">
          <div className="static-header-text">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Effective Date: {currentDate}</p>
          </div>
          <button onClick={() => window.close()} className="btn-close">Close Tab</button>
        </header>

        <section className="static-content">
          <p>This policy explains how Testimo handles the information collected through our application.</p>
          
          <div className="policy-item">
            <h2>Information We Collect</h2>
            <ul>
              <li><strong>Profile Data:</strong> When you sign in via Google OAuth, we collect your name and email address.</li>
              <li><strong>Testimonial Content:</strong> We store text-based feedback, names, and metadata (such as job titles) provided by your customers.</li>
              <li><strong>Imported Reviews:</strong> We fetch public text reviews from your connected Google, Facebook, and Instagram profiles via their respective APIs.</li>
            </ul>
          </div>

          <div className="policy-item">
            <h2>How We Use Information</h2>
            <ul>
              <li>To populate your centralized management dashboard.</li>
              <li>To generate and display your customized testimonial widgets.</li>
              <li>To manage your subscription status and billing.</li>
            </ul>
          </div>

          <div className="policy-item">
            <h2>Third-Party Services</h2>
            <p>We utilize several third-party services to function:</p>
            <ul>
              <li><strong>Authentication:</strong> Google OAuth 2.0.</li>
              <li><strong>Database:</strong> MySQL hosting services.</li>
              <li><strong>Payments:</strong> Stripe (we do not store credit card details on our own servers).</li>
              <li><strong>APIs:</strong> Facebook Graph API, Instagram Basic Display API, and Google My Business API.</li>
            </ul>
          </div>

          <div className="policy-item">
            <h2>Data Control</h2>
            <p>You maintain full control over your data. You may use the Export Functionality (CSV/JSON) to download your data or contact us to delete your account and all associated records from our MySQL database.</p>
          </div>
        </section>


      </div>
    </div>
  );
}
