async function testCss() {
  try {
    const pageRes = await fetch("http://localhost:3000/dashboard/analytics");
    const html = await pageRes.text();
    const cssMatch = html.match(/href="(\/_next\/static\/css\/[^"]+)"/);
    console.log("HTML Status:", pageRes.status);
    console.log("CSS Link in HTML:", cssMatch ? cssMatch[1] : "NONE FOUND");

    if (cssMatch) {
      const cssUrl = "http://localhost:3000" + cssMatch[1];
      const cssRes = await fetch(cssUrl);
      const cssText = await cssRes.text();
      console.log("CSS HTTP Status:", cssRes.status);
      console.log("CSS Payload Size (Bytes):", cssText.length);
      console.log("Tailwind Utilities Included:", cssText.includes("bg-slate") && cssText.includes("grid"));
      console.log("CSS Sample Preview:", cssText.slice(0, 150));
    }
  } catch (err) {
    console.error("Test Error:", err);
  }
}

testCss();
