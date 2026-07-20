const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    cartEndpointsHit: [],
    orderEndpointsHit: [],
    errors: []
  };

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/cart/products')) {
      results.cartEndpointsHit.push({ method: request.method(), url });
    }
    if (url.includes('/orders')) {
      results.orderEndpointsHit.push({ method: request.method(), url });
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/cart/products') || url.includes('/orders')) {
      console.log(`Response for ${url}: ${response.status()}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Step 2: Check if we need to login first
    console.log('Checking for login...');
    const loginLink = await page.$('a[href="/login"], button:has-text("Login"), button:has-text("로그인")');
    if (loginLink) {
      console.log('Login required, clicking login...');
      await loginLink.click();
      await page.waitForLoadState('networkidle');

      // Attempt to login with some default credentials if it's a test setup, or just report it
      // I'll type 'test@example.com' or similar if inputs exist.
      const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="이메일"]');
      const pwdInput = await page.$('input[type="password"], input[name="password"]');
      
      if (emailInput && pwdInput) {
        await emailInput.fill('user1@example.com'); // Typical test credential
        await pwdInput.fill('password123!'); 
        const submitBtn = await page.$('button[type="submit"], button:has-text("로그인")');
        if (submitBtn) await submitBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('Logged in successfully (hopefully).');
      } else {
        console.log('Login form not found as expected. Proceeding anyway...');
      }
    } else {
      console.log('No login link found immediately, might be already logged in or not required on home.');
    }

    // Step 3: Try adding an item to the cart
    console.log('Looking for items to add to cart...');
    // We navigate to a shop or list page, or look for '장바구니 담기', 'Add to cart'
    const itemCard = await page.$('a[href*="/detail/"]');
    if (itemCard) {
      await itemCard.click();
      await page.waitForLoadState('networkidle');
      
      const addCartBtn = await page.$('button:has-text("장바구니"), button:has-text("담기")');
      if (addCartBtn) {
        console.log('Found add to cart button, clicking...');
        await addCartBtn.click();
        await page.waitForTimeout(1000); // Wait for API
      } else {
        console.log('Add to cart button not found on detail page.');
      }
    } else {
      console.log('No items found to click on home page.');
    }

    // Go to cart
    console.log('Navigating to cart...');
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });
    
    // Step 4: Placing an order
    console.log('Looking for checkout/order button...');
    const checkoutBtn = await page.$('button:has-text("주문"), button:has-text("결제"), a[href*="checkout"]');
    if (checkoutBtn) {
      await checkoutBtn.click();
      await page.waitForLoadState('networkidle');
      console.log('Went to checkout page.');
      
      const placeOrderBtn = await page.$('button:has-text("주문하기"), button:has-text("결제하기")');
      if (placeOrderBtn) {
         await placeOrderBtn.click();
         await page.waitForTimeout(2000); // Wait for order API
      }
    }

  } catch (err) {
    results.errors.push(err.toString());
  } finally {
    await browser.close();
    console.log('--- TEST RESULTS ---');
    console.log(JSON.stringify(results, null, 2));
  }
})();
