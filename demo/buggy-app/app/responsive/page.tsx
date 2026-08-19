import "./responsive.css";

export default function ResponsivePage() {
  return (
    <>
      <header className="app-header">TraceLens Demo Shop</header>
      <main className="responsive-main">
        <h1>Checkout</h1>
        <p>Review your order and submit below.</p>
        {/* BUG: at narrow viewports, .app-header grows taller (see responsive.css)
            but .responsive-main's padding-top does not increase to compensate,
            so the fixed header overlaps and hides this button. */}
        <button id="submit-btn">Submit order</button>
      </main>
    </>
  );
}
