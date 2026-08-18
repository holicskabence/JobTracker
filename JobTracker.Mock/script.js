// Mobile navigation toggle
var burger = document.getElementById('navBurger');
var nav = document.getElementById('nav');
if (burger && nav) {
  burger.addEventListener('click', function () {
    nav.classList.toggle('open');
  });
}
