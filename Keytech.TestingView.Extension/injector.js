fetch("https://js.testingview.com/app/src")
    .then(response => response.text())
    .then(jsContent => {
        const blob = new Blob([jsContent], { type: "application/javascript" });
        const script = document.createElement("script");
        script.src = URL.createObjectURL(blob);
        script.type = "module";
        script.async = true; 
        document.documentElement.appendChild(script);
    })
    .catch(error => console.error("Failed to fetch TestingView script content:", error));
