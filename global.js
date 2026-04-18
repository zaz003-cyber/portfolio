console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

function normalizePath(path) {
  path = path.replace(/index\.html$/, "").replace(/\/$/, "");
  return path || "/";
}

let currentPath = normalizePath(location.pathname);

$$("nav a").forEach((a) => {
  let linkPath = normalizePath(new URL(a.href, location.href).pathname);

  if (linkPath === currentPath) {
    a.classList.add("current");
  }
});