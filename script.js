// ===============================
// SS PHOTOGRAPHY - PREMIUM EFFECTS
// ===============================

// Navbar color on scroll
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");

  if (window.scrollY > 50) {
    header.style.background = "rgba(0,0,0,0.85)";
    header.style.boxShadow = "0 5px 20px rgba(0,0,0,.5)";
  } else {
    header.style.background = "rgba(0,0,0,0.45)";
    header.style.boxShadow = "none";
  }
});

// Fade-up animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll(".service-box, .card, .footer-logo, .contact-info, .social")
  .forEach((el) => {
    el.classList.add("hidden");
    observer.observe(el);
  });

// Portfolio hover glow
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.style.boxShadow = "0 0 30px rgba(212,175,55,.35)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.boxShadow = "none";
  });
});

// Hero buttons ripple
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");

    const rect = btn.getBoundingClientRect();
    ripple.style.left = e.clientX - rect.left + "px";
    ripple.style.top = e.clientY - rect.top + "px";

    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
})