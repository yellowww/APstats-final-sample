import fetch from 'node-fetch';
import fs from 'fs';
import nbt from 'nbt';
let auctions = JSON.parse(fs.readFileSync("./auctions.json"));
let bazaar = JSON.parse(fs.readFileSync("./bazaar.json"));
let bazaarPriceDates = JSON.parse(fs.readFileSync("./bazaarPriceDates.json"));
let iteration = 0;
let tickInterval;
console.log('retrieved data from last session.');

function getOccourences() {
  let occourences = 0;
  const now = new Date().getTime();
  for(let i=0;i<bazaarPriceDates.dates.length;i++) {
    if(now > bazaarPriceDates.dates[i]) {
      occourences++;
      bazaarPriceDates.dates.splice(i,1);
      i--;
    }
  }
  if(occourences>0) fs.writeFileSync("./bazaarPriceDates.json",JSON.stringify(bazaarPriceDates), "utf-8");
  return occourences;
}

// SCHEMA: [price,bytes]
function getAuctions(occourences) {
  apiRequest("https://api.hypixel.net/skyblock/auctions_ended", (res => {
        const filtered = [];
        for(let i=0;i<res.auctions.length;i++) if(res.auction[i].bin) filtered.push([res.auction[i].price,res.auction[i].item_bytes]);
        for(let i=0;i<occourences;i++)auctions.auctions.push(...filtered);
        auctions.lastUpdate = new Date().getTime();
        fs.writeFileSync("./auctions.json",JSON.stringify(auctions), "utf-8");
  }));
}

// SCHEMA: buy
function getBazaar(occourences) {
  apiRequest("https://api.hypixel.net/skyblock/bazaar", (res => {
    const keys = Object.keys(res.products), values = Object.values(res.products);
    for(let i=0;i<keys.length;i++) res.products[keys[i]] = Math.round(values[i].quick_status.buyPrice*1000)/1000;
    for(let i=0;i<occourences;i++) bazaar.push(res);
    fs.writeFileSync("./bazaar.json",JSON.stringify(bazaar), "utf-8");
  }));
}

function apiRequest(request, callBack) {
    fetch(request)
      .then(response => {
        if(response.ok) {
            return response.json();
        } else {
          console.error("an error occurred during an API request");
        }
      })
      .catch(error => {
        return console.error(error)
      })
      .then(res => callBack(res));
}

function tick() {
  if(new Date().getTime()>=bazaarPriceDates.endDate) clearInterval(tickInterval);
  if(iteration%60 == 0) console.log(`${new Date().toLocaleString()}: ${bazaarPriceDates.dates.length} dates remaining.`);
  iteration++;
  
  const occourences = getOccourences();
  if(occourences==0) return;
  getAuctions(occourences);
  getBazaar(occourences);
}

if(new Date().getTime()>=bazaarPriceDates.endDate) console.log("data gathering done!");
else tickInterval = setInterval(tick, 60000);

//generateBazaarPriceDates(10000,1684028061598-1681868061598);

function generateBazaarPriceDates(n, timespan) {
  const dates = [];
  const now = new Date().getTime();
  for(let i=0;i<n;i++) {
    const date = Math.random()*timespan+now;
    dates.push(date);
  }
  fs.writeFileSync("./bazaarPriceDates.json",JSON.stringify({
    startDate:now,
    endDate:now+timespan,
    dates:dates
  }), "utf-8");
}



// example decryption
const data = "H4sIAAAAAAAAAEWR3W7TQBCFx2mBxKgtSH2ArUACZKL6L9jtndUYBdHQyGlV7qq1PXZX9U+03kB6yYNw7ffwo/AgiHEC4m7mmz1nz87qACPQhA4A2gAGItUGGjy5qNeV0nTYUzzX4PlNFUvkDzwuUNuD0Uyk+LHgeUOi3zo8S0WzKvjjCPYva4lDoofwsmu9KS95juesaxPDN+GY0FJJrHJ1v4PWxKTDAfGQy4rQB8M2WVKLqqHGy2RdsrKuGoWSPYiiaNjbS/yGBQ3RMo3+TF0Vj+/I5NXWj+2u7Acr0hCbmGbfbdWgd60/5xtmOBM4JPq5p9sofY43W4tfP3+wfyn/++Bfn+91nYJBxS0VlLQoMFGCIvYu6FnvXcenindtMQ++htMT8u11dPH1vWiYUFiyhFcsRiYxq2WO6Qm86NozUkRBFLLl7VU0HcL+F14iHNAg4rRuyYINgg5H4UZJHiglRbxW2AxhVEuRi+qa53CwnF0t7hY30cUsWIbD/jdBj4JP0zC6ozBkul4Teu34Tua7vj124tQduz73xtxOvbGVoZtMbN/xnIyMlSixUbxcwZFln/qn9DX2ue2wxRxgAE93q6b3wR9BYJa/RAIAAA=="
nbt.parse(Buffer.from(data, "base64"), (error,parsed) => {
  if(error) return console.error(error);
})
