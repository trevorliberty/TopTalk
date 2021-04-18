const fetch = require('node-fetch');
const url =
	'https://www.espn.com/nba/story/_/id/31279860/boston-celtics-star-jayson-tatum-scores-44-earns-stephen-curry-respect-duel';

const testa = async () => {
	let response = await fetch(
		`https://diffbot-diffbot.p.rapidapi.com/v2/article?token=9216af864a99daaa340cf5bba2ddfc5c&url=${url}&fields=text%2Chtml%2Cimages(pixelHeight%2CpixelWidth)`,
		{
			method: 'GET',
			headers: {
				'x-rapidapi-key': '3d9acc06dbmshfc5ce11c24971b0p116d65jsn008041f167b2',
				'x-rapidapi-host': 'diffbot-diffbot.p.rapidapi.com',
			},
		},
	);

	let json = await response.json();
	return json.html;
};

const run = async () => {
    console.log(await testa())
}
run()
