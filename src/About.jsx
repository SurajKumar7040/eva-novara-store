function About({ onExploreProducts }) {
  const technologyAreas = [
    {
      icon: "🔌",
      title: "Embedded Systems",
      description:
        "Microcontroller-based electronics, embedded hardware and intelligent control systems.",
    },
    {
      icon: "📡",
      title: "Internet of Things",
      description:
        "Connected devices, wireless communication and smart monitoring solutions.",
    },
    {
      icon: "🏠",
      title: "Smart Home Automation",
      description:
        "Smart controllers, connected sensors and automation products for modern homes.",
    },
    {
      icon: "⚙️",
      title: "Electronics Development",
      description:
        "Electronic product development, PCB design and hardware integration.",
    },
  ];

  const advantages = [
    "Innovation-driven approach",
    "Practical engineering solutions",
    "Smart technology integration",
    "Customer-focused development",
  ];

  return (
    <main className="about-page">

      {/* HERO SECTION */}
      <section className="about-hero">
        <span>ABOUT EVA NOVARA TECHNOLOGIES</span>

        <h1>
          Engineering the Future
          <br />
          <strong>Through Smart Technology</strong>
        </h1>

        <p>
          We develop innovative electronics, IoT and smart
          automation solutions designed to make everyday
          life smarter, simpler and more connected.
        </p>

        <button
          type="button"
          onClick={onExploreProducts}
          className="about-explore-button"
        >
          Explore Our Products →
        </button>
      </section>

      {/* COMPANY INTRODUCTION */}
      <section className="about-intro">

        <div className="about-intro-content">
          <span className="about-label">WHO WE ARE</span>

          <h2>
            Welcome to EVA NOVARA Technologies
          </h2>

          <p>
            EVA NOVARA Technologies focuses on developing
            smart electronics, embedded systems, IoT products
            and automation solutions.
          </p>

          <p>
            Our goal is to combine modern technology with
            practical engineering to create useful products
            for homes, businesses and everyday applications.
          </p>

          <p>
            From electronic hardware to connected smart
            devices, we aim to make technology more accessible
            and convenient.
          </p>
        </div>

        <div className="about-intro-visual">
          <div className="about-visual-icon">⚡</div>

          <h3>EVA NOVARA</h3>

          <p>TECHNOLOGIES</p>

          <span>
            Innovation · Technology · Automation
          </span>
        </div>

      </section>

      {/* VISION AND MISSION */}
      <section className="about-purpose">

        <div className="purpose-card">
          <div>🔭</div>

          <h2>Our Vision</h2>

          <p>
            To build innovative and reliable technology
            solutions that contribute to a smarter,
            connected and technologically advanced future.
          </p>
        </div>

        <div className="purpose-card">
          <div>🎯</div>

          <h2>Our Mission</h2>

          <p>
            To develop practical electronics, IoT and
            automation products that simplify everyday
            activities through thoughtful engineering.
          </p>
        </div>

      </section>

      {/* TECHNOLOGY AREAS */}
      <section className="about-technology">

        <div className="about-section-heading">
          <span>WHAT WE DO</span>

          <h2>Our Technology Areas</h2>

          <p>
            Engineering solutions across modern technology domains.
          </p>
        </div>

        <div className="technology-grid">

          {technologyAreas.map((item, index) => (
            <div className="technology-card" key={index}>

              <span>{item.icon}</span>

              <h3>{item.title}</h3>

              <p>{item.description}</p>

            </div>
          ))}

        </div>

      </section>

      {/* WHY CHOOSE US */}
      <section className="why-choose-us">

        <div className="about-section-heading">
          <span>OUR APPROACH</span>

          <h2>Why Choose EVA NOVARA?</h2>

          <p>
            Our approach combines engineering, innovation
            and practical technology development.
          </p>
        </div>

        <div className="choose-grid">

          {advantages.map((item, index) => (
            <div key={index}>
              <span>✓</span>
              {item}
            </div>
          ))}

        </div>

      </section>

      {/* CALL TO ACTION */}
      <section className="about-cta">

        <span>LET'S INNOVATE TOGETHER</span>

        <h2>
          Let's Build a Smarter Future Together
        </h2>

        <p>
          Discover our smart home products and technology solutions.
        </p>

        <button
          type="button"
          onClick={onExploreProducts}
          className="about-explore-button"
        >
          Explore Our Products →
        </button>

      </section>

    </main>
  );
}

export default About;