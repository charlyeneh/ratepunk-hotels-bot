const puppeteer = require('puppeteer');

const AGODA_BASE_URL = 'https://www.agoda.com/';
const HOTEL_NAME = 'Golden Royale Hotel';

const waitSeconds = async (duration) =>
	new Promise((resolve) => setTimeout(resolve, duration * 1000));

const clickIfExist = async (page, selector) => {
	await page.waitForSelector(selector);
	await page.click(selector);
};

const enterHotelSearchData = async (page, data) => {
	await page.waitForSelector('.Box-sc-kv6pi1-0.hRUYUu');

	await page.type(
		'.SearchBoxTextEditor.SearchBoxTextEditor--autocomplete',
		data
	);

	await Promise.all([
		page.waitForSelector('.IconBox.IconBox--checkIn'),
		page.waitForSelector('.IconBox.IconBox--checkOut'),
		page.waitForSelector('.IconBox.IconBox--occupancy'),
	]);
};

const getCheapestRoom = async (page, { value, currency }) => {
	try {
		return await page.evaluate(
			([_priceSelector, _currencySelector]) => {
				const price = document.querySelector(_priceSelector).textContent;
				const currency = document.querySelector(_currencySelector).textContent;

				return `${currency}${price}`;
			},
			[value, currency]
		);
	} catch (error) {
		console.log({ error });
		throw new Error('Could not find price. Wait for page to load!');
	}
};

const main = async (hotelName, agodaUrl) => {
	const selector = {
		closeDropdown:
			'#home-react-root > div > section > section > div > div.Box-sc-kv6pi1-0.kZhKrh > ul > li:nth-child(1) > div',
		searchButton:
			'#SearchBoxContainer > div.Box-sc-kv6pi1-0.hRUYUu.TabContent__Search--button > button',
		price: {
			value: '.PropertyCardPrice__Value',
			currency: '.PropertyCardPrice__Currency',
		},
		modal:
			'body > div.ab-iam-root.v3.ab-animate-in.ab-animate-out.ab-effect-modal.ab-show > div.ab-in-app-message.ab-background.ab-modal-interactions.ab-modal.ab-centered > div.ab-message-buttons > button:nth-child(2)',
	};
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: false,
	});
	const page = await browser.newPage();

	await page.goto(agodaUrl);

	await clickIfExist(page, selector.modal);
	await enterHotelSearchData(page, hotelName);
	await waitSeconds(1);
	await clickIfExist(page, selector.closeDropdown);
	await waitSeconds(1);
	await clickIfExist(page, selector.searchButton);
	await waitSeconds(30); //Increase delay if your network is slow

	const price = await getCheapestRoom(page, selector.price);
	await browser.close();

	return price;
};

main(HOTEL_NAME, AGODA_BASE_URL).then(console.log).catch(console.error);
