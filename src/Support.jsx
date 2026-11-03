import { useState } from "react";

const faqs = [
  {
    question: "How do I purchase EVA NOVARA products?",
    answer:
      "Browse our Products section, select your preferred product and use the Add to Cart option. Online checkout will be enabled in a future update."
  },
  {
    question: "How can I get product installation support?",
    answer:
      "You can contact our support team with your product name and installation query for assistance."
  },
  {
    question: "Can I control smart products using my smartphone?",
    answer:
      "Smartphone control depends on the connectivity and application support of the specific product."
  },
  {
    question: "How can I report a product issue?",
    answer:
      "Contact our support team with the product name, issue description and relevant details."
  },
  {
    question: "Are all products compatible with every smart home system?",
    answer:
      "Compatibility depends on the individual product specifications. Please check the product details before purchasing."
  },
  {
    question: "How can I contact EVA NOVARA Technologies?",
    answer:
      "You can contact us through info@evanovara.com or call +91 98765 43210."
  }
];

function Support() {
  const [activeFaq, setActiveFaq] = useState(null);

  return (
    <main className="support-page">

      <section className="support-hero">
        <span>CUSTOMER CARE</span>
        <h1>How Can We <strong>Help You?</strong></h1>
        <p>
          Find product information, installation guidance
          and answers to common questions.
        </p>
      </section>

      <section className="support-options">

        <div className="support-card">
          <span>🎧</span>
          <h2>Customer Support</h2>
          <p>
            Get assistance with product-related questions
            and general enquiries.
          </p>
          <a href="#contact">Contact Support →</a>
        </div>

        <div className="support-card">
          <span>⚙️</span>
          <h2>Product Assistance</h2>
          <p>
            Find information about product operation,
            features and compatibility.
          </p>
          <a href="#faq">Explore FAQs →</a>
        </div>

        <div className="support-card">
          <span>📖</span>
          <h2>Installation Guidance</h2>
          <p>
            Get guidance about product setup and
            installation requirements.
          </p>
          <a href="#faq">Read Help Topics →</a>
        </div>

      </section>

      <section className="faq-section" id="faq">

        <div className="support-heading">
          <span>HELP CENTER</span>
          <h2>Frequently Asked Questions</h2>
          <p>
            Find answers to common questions about our products.
          </p>
        </div>

        <div className="faq-list">

          {faqs.map((faq, index) => (
            <div className="faq-item" key={index}>

              <button
                className="faq-question"
                onClick={() =>
                  setActiveFaq(activeFaq === index ? null : index)
                }
                aria-expanded={activeFaq === index}
              >
                <span>{faq.question}</span>
                <strong>
                  {activeFaq === index ? "−" : "+"}
                </strong>
              </button>

              {activeFaq === index && (
                <div className="faq-answer">
                  {faq.answer}
                </div>
              )}

            </div>
          ))}

        </div>
      </section>

      <section className="support-cta" id="contact">
        <h2>Still Need Help?</h2>
        <p>
          Our team is available for product and general enquiries.
        </p>

        <a href="mailto:info@evanovara.com">
          Email Our Support Team →
        </a>
      </section>

    </main>
  );
}

export default Support;