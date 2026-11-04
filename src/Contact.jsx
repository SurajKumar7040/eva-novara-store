import { useState } from "react";

function Contact() {
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
    };

    setLoading(true);
    setResponseMessage("");
    setSuccess(false);

    try {
      const response = await fetch(
        "http://localhost:5000/api/contact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Message submission failed"
        );
      }

      setSuccess(true);
      setResponseMessage(
        "Thank you! Your message has been submitted successfully."
      );

      form.reset();

    } catch (error) {
      console.error("Contact API Error:", error);

      setSuccess(false);
      setResponseMessage(
        error.message || "Unable to send message. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="contact-page">

      {/* HERO SECTION */}
      <section className="contact-hero">
        <span>GET IN TOUCH</span>

        <h1>
          Contact <strong>EVA NOVARA</strong>
        </h1>

        <p>
          Have a question about our products or technology?
          We would love to hear from you.
        </p>
      </section>

      {/* CONTACT CONTENT */}
      <section className="contact-container">

        <div className="contact-info">

          <span className="contact-label">
            CONTACT INFORMATION
          </span>

          <h2>Let's Start a Conversation</h2>

          <p>
            Get in touch with our team for product enquiries,
            technical information and business opportunities.
          </p>

          <div className="contact-info-card">
            <span>✉️</span>
            <div>
              <h3>Email</h3>
              <p>info@evanovara.com</p>
            </div>
          </div>

          <div className="contact-info-card">
            <span>📞</span>
            <div>
              <h3>Phone</h3>
              <p>+91 6391366017</p>
            </div>
          </div>

          <div className="contact-info-card">
            <span>🌐</span>
            <div>
              <h3>Company</h3>
              <p>EVA NOVARA Technologies</p>
            </div>
          </div>

          <div className="contact-info-card">
            <span>🕒</span>
            <div>
              <h3>Business Enquiries</h3>
              <p>Contact us through email or phone.</p>
            </div>
          </div>

        </div>

        {/* CONTACT FORM */}
        <div className="contact-form-box">

          <h2>Send Us a Message</h2>

          <form onSubmit={handleSubmit}>

            <div className="contact-form-row">

              <div className="form-group">
                <label>Your Name</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  maxLength="150"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  maxLength="255"
                  required
                />
              </div>

            </div>

            <div className="form-group">
              <label>Subject</label>

              <input
                type="text"
                name="subject"
                placeholder="Enter subject"
                maxLength="255"
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>

              <textarea
                name="message"
                rows="6"
                placeholder="Write your message..."
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message →"}
            </button>

          </form>

          {responseMessage && (
            <p
              className={
                success ? "contact-success" : "contact-error"
              }
              role="status"
            >
              {responseMessage}
            </p>
          )}

          <small>
            Your enquiry will be submitted to EVA NOVARA Technologies.
          </small>

        </div>

      </section>

    </main>
  );
}

export default Contact;