self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("gc-v1").then(c =>
      c.addAll(["./","./index.html","./app.js"])
    )
  );
});
