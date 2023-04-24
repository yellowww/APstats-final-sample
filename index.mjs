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

// SCHEMA: [price,name,lore]
function getAuctions(occourences) {
  apiRequest("https://api.hypixel.net/skyblock/auctions_ended", (res => {
        generateSaveStrings(res.auctions, filtered=>{
          for(let i=0;i<occourences;i++)auctions.auctions.push(...filtered);
          auctions.lastUpdate = new Date().getTime();
          fs.writeFileSync("./auctions.json",JSON.stringify(auctions), "utf-8");
        })
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

//generateBazaarPriceDates(7500,1728000000);

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


function nbtDecrypt(price, data,cb) {
  nbt.parse(Buffer.from(data, "base64"), (error,parsed) => {
    if(error) return console.error(error);
    cb([price, parsed.value.i.value.value[0].tag.value.display.value.Name.value, parsed.value.i.value.value[0].tag.value.display.value.Lore.value.value.join("\n")])
  });
}


// SCHEMA: [price, name, lore]
function generateSaveStrings (items,cb) {
  for(let i=0;i<items.length;i++) if(items[i].bin) {items.splice(i,1);i--}
  const total = items.length,compiled=[];
  let complete = 0;
  for(let i=0;i<total;i++) {
    nbtDecrypt(items[i].price, items[i].item_bytes, (res) => {
      complete++;
      compiled.push(res);
      if(complete == total) cb(compiled);
    });
  }
}
