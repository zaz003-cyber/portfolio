console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let currentLink = document.querySelector(`a[href="${location.pathname}"]`);
currentLink?.classList.add("current");