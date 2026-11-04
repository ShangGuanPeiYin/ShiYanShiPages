const {chromium}=require('/home/xxs/yanjiushi/ShiYanShiPages/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
for(const width of [390,1440])for(const locale of ['', '/en']) {
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.goto('http://127.0.0.1:4000'+locale+'/publications/');
 await page.waitForTimeout(900);
 const paint=await page.locator('.pub-entry').first().evaluate(el=>{let opacity=1;for(let n=el;n;n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);const r=el.getBoundingClientRect();return {opacity,inView:r.top<innerHeight&&r.bottom>0,text:el.querySelector('.text-justify').textContent.trim()}});
 assert(paint.opacity>.99,`Invisible ancestor: ${width} ${locale} effective opacity=${paint.opacity}`);assert(paint.inView);assert(paint.text.length>30);
 await page.screenshot({path:`/tmp/mvas-papers-${width}-${locale?'en':'zh'}.png`});await page.close();
}
await browser.close();console.log('PASS: Chinese/English papers painted at 390/1440px; ancestor opacity=1; real title/author text in viewport');})().catch(e=>{console.error(e);process.exit(1)});
