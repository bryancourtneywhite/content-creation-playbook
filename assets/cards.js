/* ------------------------------------------------------------------
   Cinematic build cards for Ashura Whole Heavens.
   - Injects a video-thumbnail art header into any .build-card that has
     a data-thumb="<youtube-id>" attribute (art side glows, text side
     fades out via CSS mask).
   - Adds a subtle mouse-move 3D tilt + parallax so cards feel alive.
   Include after the cards exist in the DOM (end of page). Safe no-op if
   a card has no data-thumb.
   ------------------------------------------------------------------ */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.build-card'));
  if (!cards.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  cards.forEach(function (card) {
    // 1) Inject the art header if requested and not already present.
    var id = card.getAttribute('data-thumb');
    if (id && !card.querySelector('.bc-art')) {
      var art = document.createElement('div');
      art.className = 'bc-art';
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = '';
      img.src = 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg';
      // Fallback to hqdefault if maxres isn't available for that video.
      img.onerror = function () {
        if (img.src.indexOf('maxresdefault') !== -1) {
          img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
        }
      };
      art.appendChild(img);
      card.insertBefore(art, card.firstChild);
    }

    // 2) Mouse-move 3D tilt + parallax (skip if reduced motion).
    if (reduce) return;
    card.style.transformStyle = 'preserve-3d';
    var img2 = card.querySelector('.bc-art img');

    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
      var py = (e.clientY - r.top) / r.height - 0.5;
      var rotX = (-py * 6).toFixed(2);
      var rotY = (px * 8).toFixed(2);
      card.style.transform =
        'translateY(-8px) perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
      if (img2) img2.style.transform = 'scale(1.12) translate(' + (px * -10) + 'px,' + (py * -8) + 'px)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
      if (img2) img2.style.transform = '';
    });
  });
})();
