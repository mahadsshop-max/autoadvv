const FAQS = [
  ['How does it work?', 'Log in with Discord, choose a plan or start trial, then configure your automation settings in the dashboard.'],
  ['Does it keep running if I close my browser?', 'Yes. Campaigns and reply systems continue through cloud execution 24/7.'],
  ['Can I use more than one account?', 'Yes. v1 includes 1 account, v2 includes 3, and v3 includes 5 accounts. You can also purchase additional slots.'],
  ['What crypto do you accept?', 'We accept Litecoin (LTC) only. A unique address is generated for each purchase.'],
  ['What if I send the wrong amount?', 'We accept up to $0.10 under or over the required amount. Anything else, contact support on Discord.'],
  ['Is this affiliated with Discord?', 'No. Veiled Adv is not affiliated with Discord Inc. Use at your own risk.'],
];

// Frequently asked questions rendered as native disclosure widgets.
export default function Faq() {
  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head reveal is-visible">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2>Answers to common questions</h2>
          </div>
        </div>
        <div className="faq-grid">
          {FAQS.map(([question, answer]) => (
            <article className="faq-item reveal is-visible" key={question}>
              <details>
                <summary>
                  {question}
                  <span className="summary-icon">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
