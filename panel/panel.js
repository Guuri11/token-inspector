// panel.js
const outputContainer = document.getElementById("output-container");
const includeBearerToggle = document.getElementById("include-bearer-toggle");

function handleRequestFinished(request) {
  const hasToken = request.request.headers.some((header) => {
    return header.name.toLowerCase() === "authorization";
  });

  // Si la solicitud tiene un encabezado de Authorization, actualiza el panel
  if (hasToken) {
    updatePanel();
  }
}

function extractTokensFromHAR(requests) {
  return requests.entries
    .filter((entry) =>
      entry.request.headers.some(
        (header) => header.name.toLowerCase() === "authorization"
      )
    )
    .map((entry) => {
      const url = entry.request.url;
      const authorizationHeader = entry.request.headers.find(
        (header) => header.name.toLowerCase() === "authorization"
      ).value;
      return { url, authorizationHeader };
    });
}

function displayTokens(tokens) {
  const outputContainer = document.getElementById("output-container");
  tokens.forEach((token) => {
    const container = document.createElement("div");
    container.classList.add("uk-margin");
    const card = document.createElement("div");
    card.classList.add("uk-card", "uk-card-default", "uk-card-body");

    const urlTitle = document.createElement("h6");
    urlTitle.classList.add("uk-card-title", "uk-text-default");
    urlTitle.innerText = token.url;

    const inspectButton = document.createElement("button");
    inspectButton.classList.add(
      "uk-button",
      "uk-margin-right",
      "uk-button-primary",
      "uk-text-default",
      "uk-text-capitalize"
    );
    inspectButton.innerText = "Inspect token in jwt.io";
    inspectButton.addEventListener("click", () => {
      const jwtInspectUrl = `https://jwt.io/?token=${encodeURIComponent(
        getToken(token)
      )}`;
      window.open(jwtInspectUrl, "_blank");
    });

    const copyButton = document.createElement("button");
    copyButton.classList.add(
      "uk-button",
      "uk-button-secondary",
      "uk-text-default",
      "uk-text-capitalize"
    );
    copyButton.innerText = "Copy token";
    copyButton.addEventListener("click", () => {
      copyToClipboard(getToken(token));
      alert("Token copied");
    });

    container.appendChild(card);
    card.appendChild(urlTitle);
    card.appendChild(inspectButton);
    card.appendChild(copyButton);
    outputContainer.appendChild(container);
  });
}

function getToken(token) {
  return includeBearerToggle.checked
    ? token.authorizationHeader
    : token.authorizationHeader.replace("Bearer ", "");
}

function copyToClipboard(text) {
  const textField = document.createElement("textarea");
  textField.innerText = text;
  document.body.appendChild(textField);
  textField.select();
  document.execCommand("copy");
  textField.remove();
}

function updatePanel() {
  // Limpiar datos antiguos.
  outputContainer.innerHTML = "";

  // Obtener el HAR actualizado.
  chrome.devtools.network.getHAR(function (requests) {
    const includeBearerToggle = document.getElementById(
      "include-bearer-toggle"
    );
    includeBearerToggle.addEventListener("change", () => {
      document.getElementById("output-container").innerHTML = "";
      const tokens = extractTokensFromHAR(requests);
      displayTokens(tokens);
    });

    const tokens = extractTokensFromHAR(requests);
    displayTokens(tokens);
  });
}

// Este método es llamado siempre que una solicitud de red se completa.
chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished);

// Escuchar cambios en el checkbox.
includeBearerToggle.addEventListener("change", updatePanel);

// LLamada inicial para rellenar los datos al abrir el panel.
updatePanel();
