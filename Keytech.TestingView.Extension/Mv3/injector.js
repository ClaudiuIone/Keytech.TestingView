const script = document.createElement("script");
script.src = chrome.runtime.getURL("app.js");
script.type = "module";
script.async = true;

document.documentElement.appendChild(script);