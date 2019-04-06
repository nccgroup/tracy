function createInput(name, value) {
  const i = document.createElement("input");
  i.value = value;
  i.name = name;
  i.type = "text";
  return i;
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("loaded. getting params");
  const u = new URL(document.location.href);
  const form = document.createElement("form");
  let action;
  let method;
  for (let p of u.searchParams) {
    if (p[0] === "TRACYTRACYACTION") {
      action = p[1];
      continue;
    }
    if (p[0] === "TRACYTRACYMETHOD") {
      method = p[1];
      continue;
    }
    form.appendChild(createInput(p[0], p[1]));
  }
  form.action = action;
  form.method = method;
  document.body.appendChild(form);
  form.submit();
});
