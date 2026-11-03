const categories = [
  {
    id: 1,
    name: "Controllers",
    icon: "🎛️",
    description: "Smart controllers for wireless appliance and home automation.",
    filter: "Controllers",
  },
  {
    id: 2,
    name: "Sensors",
    icon: "📡",
    description: "Smart sensors for motion, temperature, humidity and security.",
    filter: "Sensors",
  },
  {
    id: 3,
    name: "Switches & Plugs",
    icon: "🔌",
    description: "Smart switches and plugs for convenient electrical control.",
    filter: "Switches & Plugs",
  },
  {
    id: 4,
    name: "Security",
    icon: "📹",
    description: "Smart camera solutions for home and office monitoring.",
    filter: "Security",
  },
];

function Categories({ onSelectCategory, products = [] }) {
  return (
    <section className="categories-page">

      <div className="categories-heading">
        <span>OUR PRODUCT RANGE</span>
        <h1>Explore Our Categories</h1>
        <p>
          Discover smart technology solutions designed to make
          your everyday life easier.
        </p>
      </div>

      <div className="categories-grid">

        {categories.map((category) => {

          const count = products.filter(
            (product) => product.category === category.filter
          ).length;

          return (
            <div className="category-card" key={category.id}>

              <div className="category-icon">
                {category.icon}
              </div>

              <h2>{category.name}</h2>

              <p>{category.description}</p>

              <span className="category-count">
                {count} {count === 1 ? "Product" : "Products"}
              </span>

              <button
                onClick={() => onSelectCategory?.(category.filter)}
              >
                View Products →
              </button>

            </div>
          );
        })}

      </div>
    </section>
  );
}

export default Categories;