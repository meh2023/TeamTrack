const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const recorder = new PuppeteerScreenRecorder(page, {
    fps: 30,
    videoFrame: { width: 1280, height: 720 },
    recordDurationLimit: 300 
  });

  await recorder.start('./TeamTrack_Demo.mp4');

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    console.log('Navigating to app...');
    await page.goto('https://taskflow-production-51fb.up.railway.app/', { waitUntil: 'networkidle0' });
    await delay(2000);

    console.log('Signing up...');
    await page.click('#tab-signup');
    await delay(1000);
    await page.type('#signup-name', 'Evaluator User', { delay: 50 });
    await page.type('#signup-email', 'evaluator_' + Date.now() + '@college.edu', { delay: 50 });
    await page.type('#signup-password', 'finalyear123', { delay: 50 });
    await delay(1000);
    await page.click('#signup-btn');
    
    await page.waitForSelector('#nav-dashboard', { timeout: 10000 });
    await delay(2000);

    console.log('Toggling theme...');
    await page.click('#theme-toggle-btn');
    await delay(1500);
    await page.click('#theme-toggle-btn'); 
    await delay(1500);

    console.log('Creating project...');
    await page.evaluate(() => openModal('project-modal'));
    await delay(1000);
    await page.type('#proj-name', 'Final Year Project Submission', { delay: 50 });
    await page.type('#proj-desc', 'Building a scalable MERN/PERN application with RBAC and Kanban features.', { delay: 50 });
    await delay(1000);
    await page.click('#project-modal button[type="submit"]');

    await delay(2500);
    await page.click('.project-card'); 
    
    await page.waitForSelector('#add-task-btn', { timeout: 10000 });
    await delay(2000);

    console.log('Adding tasks...');
    await page.click('#add-task-btn');
    await delay(1000);
    await page.type('#task-title', 'Implement REST APIs', { delay: 50 });
    await page.select('#task-priority', 'HIGH');
    await delay(500);
    await page.click('#task-modal button[type="submit"]');
    await delay(2000);

    await page.click('#add-task-btn');
    await delay(1000);
    await page.type('#task-title', 'Design UI with Glassmorphism', { delay: 50 });
    await page.select('#task-priority', 'MEDIUM');
    await delay(500);
    await page.click('#task-modal button[type="submit"]');
    await delay(2000);

    console.log('Moving tasks...');
    await page.evaluate(async () => {
       const buttons = document.querySelectorAll('.status-btns button');
       for (let btn of buttons) {
           if (btn.textContent.includes('Progress')) {
               btn.click();
               break;
           }
       }
    });
    await delay(2500);

    await page.evaluate(async () => {
       const buttons = document.querySelectorAll('.status-btns button');
       for (let btn of buttons) {
           if (btn.textContent.includes('Done')) {
               btn.click();
               break;
           }
       }
    });
    await delay(3000);

    console.log('Showing members...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(2500);
    
    console.log('Returning to dashboard...');
    await page.click('.back-link');
    await delay(3500);

    console.log('Recording finished.');
  } catch (err) {
    console.error('Error during recording:', err);
  } finally {
    await recorder.stop();
    await browser.close();
  }
})();
