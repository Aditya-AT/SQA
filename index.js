const { chromium } = require("playwright");

async function saveHackerNewsArticles() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://news.ycombinator.com/newest");

  let allArticles = [];
  while (allArticles.length < 100) {
    // Wait for the articles to be loaded on the page
    await page.waitForSelector('.athing');

    const articles = await page.$$eval('.athing', nodes => nodes.map(n => {
      const titleElement = n.querySelector('.titlelink');
      const ageElement = n.nextElementSibling.querySelector('.age');

      // Extract the datetime from the title attribute of the age span
      const datetime = ageElement ? ageElement.getAttribute('title') : "Datetime not found";

      return {
        id: n.getAttribute('id'),
        title: titleElement ? titleElement.innerText : "Title not found",
        link: titleElement ? titleElement.href : "Link not found",
        datetime  // Using full datetime for sorting validation
      };
    }));

    allArticles.push(...articles);

    if (allArticles.length < 100) {
      try {
        await page.click('.morelink');
        await page.waitForLoadState('networkidle');  // Wait for network to be idle after loading more articles
      } catch (error) {
        console.error('Error loading more articles:', error);
        break;
      }
    }
  }

  // Ensure exactly 100 articles are collected
  allArticles = allArticles.slice(0, 100);

  // Validate the sorting of articles
  let sorted = true;
  for (let i = 1; i < allArticles.length; i++) {
    const currentTime = new Date(allArticles[i].datetime).getTime();
    const previousTime = new Date(allArticles[i - 1].datetime).getTime();
    if (currentTime > previousTime) {
      sorted = false;
      break;
    }
  }

  if (sorted) {
    console.log("Articles are correctly sorted from newest to oldest. Test Passed");
  } else {
    throw new Error("Articles are not sorted correctly. Test failed");
  }

  await browser.close();
}

(async () => {
  await saveHackerNewsArticles();
})();
