const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  // Read image as base64 to embed directly — avoids file:// security issues
  const imgBase64 = fs.readFileSync(path.resolve(__dirname, '01_original.png')).toString('base64');
  const dataUrl = 'data:image/png;base64,' + imgBase64;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 400 });

  await page.setContent(`<!DOCTYPE html>
<html><body style="margin:0">
<canvas id="c"></canvas>
<script>
const img = new Image();
img.onload = function() {
  const c = document.getElementById('c');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    // Remove near-black background (pure black, not the dark navy of the logo)
    if (r < 30 && g < 30 && b < 30) { data[i+3] = 0; }
  }
  ctx.putImageData(imageData, 0, 0);
  window._result = c.toDataURL('image/png');
  window._done = true;
};
img.src = '${dataUrl}';
</script>
</body></html>`);

  await page.waitForFunction('window._done === true', { timeout: 10000 });
  const result = await page.evaluate(() => window._result);
  const base64 = result.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.resolve(__dirname, '01_original_transparent.png'), Buffer.from(base64, 'base64'));
  await browser.close();
  console.log('Done: 01_original_transparent.png');
})();
