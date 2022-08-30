const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const getWSS = require("./wss")
const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require('puppeteer')
puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
    blockedTypes: new Set([`stylesheet`, `image`, `font`, `texttrack`]),
    // Optionally enable Cooperative Mode for several request interceptors
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
}))

var models = [];

async function getModels() {
    await (async () => {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto("https://chaturbate.com/female-cams/");
        var pageNumbers = await page.evaluate(() => {
            return parseInt(document.querySelector("#roomlist_pagination > ul > li:nth-child(7) > a").innerText);
        });
        for (let i = 0; i < pageNumbers-1; i++) {
            await page.waitForSelector("#room_list");
            var modelTemp = await page.evaluate(() => {
                var rooms = document.querySelector("#room_list").children;
                var urls = [];
                for (var i=0; i < rooms.length;i++) {
                    console.log(rooms[i].querySelector("a").href.split("/")[3])
                    var obj = {
                        model:rooms[i].querySelector("a").href.split("/")[3],
                        url:rooms[i].querySelector("a").href,
                        viewers:rooms[i].querySelector(".viewers").innerText.split(" ")[0],
                    }
                    urls = urls.concat(obj);
                }
                return urls;
            })
            models = models.concat(modelTemp);
            console.log(models.length,"Models");
            var nextAvailable = await page.evaluate(() => {
                var nextButton = Array.from(document.querySelectorAll('a')).find(el => el.textContent === 'next');
                nextButton.click();
                return nextButton.href !== "#";
            })
            console.log("Next Available:",nextAvailable)
        }
        console.log(models);
        await browser.close();
    })();
}

async function sendMessages(message) {
    await (async () => {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto("https://chaturbate.com/auth/login/");
        await page.type("#id_username","googlesmarketingteam");
        await page.type("#id_password","SuperSecretPassword123!@");
        await page.click("input.button");
        await page.waitForSelector("#room_list");
        await page.evaluate(() => {
            document.querySelector("#entrance_terms_overlay").parentElement.removeChild(document.querySelector("#entrance_terms_overlay"));
        });
        console.log("Loaded login page");
        for (let i = 0; i < models.length; i++) {
            console.log("Navigating to",models[i].model)
            await page.goto(models[i].url);
            // Remove video to speed up loading times and network usage
            await page.waitForSelector("#VideoPanel");
            await page.evaluate(() => {
                document.querySelector("#entrance_terms_overlay").parentElement.removeChild(document.querySelector("#entrance_terms_overlay"));
                //document.querySelector("#VideoPanel").parentElement.removeChild(document.querySelector("#VideoPanel"));
            });
            // Wait for chat box
            await page.waitForSelector("#ChatTabContents");
            console.log("Setting message")
            // Set message in chat bar
            await page.evaluate((message) => {
                document.querySelector("#ChatTabContents > div.inputDiv > form > div").innerText = message;
            },message);
            try {
                console.log("Accept rules")
                // Click Accept Rules Button
                await page.evaluate(() => {
                    document.querySelector("#ChatTabContents > div.rulesModal > button.acceptRulesButton").click();
                })
            } catch (e) {
                console.log("No CB Rules to accept")
            }
            console.log("Selecting send")
            // Click send button
            await page.evaluate(() => {
                document.querySelector("#ChatTabContents > div.inputDiv > div.buttonHolder > span.send-button.send-button-gradient.theatermodeSendButtonChat").click();
            })
            try {
                await page.waitForSelector("asdfhsdgjsfgdj",{timeout:5000});
            } catch (e) {

            }
        }
        await browser.close();
    })();
}

async function getModelWSS(model) {
    try {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: "C:\\Users\\appl9\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
    });
    const page = await browser.newPage();
        var f12 = await page.target().createCDPSession();
        await page.goto("https://chaturbate.com/"+model+"/");
        await f12.send('Network.enable');
        await f12.send('Page.enable');
        const handleWebSocketFrameReceived = (params) => {
            if (params.url.includes("chat")) {
                getWSS(model, params.url);
                browser.close()
            } else {
                browser.close()
            }
        }
        f12.on('Network.webSocketCreated', handleWebSocketFrameReceived);
    } catch (e) {
        console.log(e);
    }
}
async function run() {
    await getModels()
    for (let i = 0; i < models.length/3; i++) {
        try {
            await getModelWSS(models[i].model);
            console.log("Connected to",i,"of",models.length);
        } catch (e) {
            console.log(e)
        }

    }
}
run();
