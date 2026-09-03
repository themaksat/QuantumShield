async function checkAssets() {
  const html = await (await fetch('http://localhost:3000/')).text();
  const scriptMatches = html.match(/src="(\/_next\/[^"]+)"/g) || [];
  const linkMatches = html.match(/href="(\/_next\/[^"]+)"/g) || [];

  const scriptUrls = scriptMatches.map(s => s.replace(/src="|"/g, ''));
  const linkUrls = linkMatches.map(s => s.replace(/href="|"/g, ''));
  const all = [...new Set([...scriptUrls, ...linkUrls])];

  console.log('Total Next.js assets referenced in HTML:', all.length);
  let failed = 0;
  for (const asset of all) {
    const res = await fetch('http://localhost:3000' + asset);
    if (!res.ok) {
      console.error('FAILED asset:', asset, res.status);
      failed++;
    } else {
      console.log('OK:', res.status, asset);
    }
  }
  if (failed === 0) {
    console.log('ALL ASSETS LOADED SUCCESSFULLY (200 OK)');
  }
}
checkAssets().catch(console.error);
