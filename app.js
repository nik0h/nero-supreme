var Cleave = require('cleave.js');
var fs = require('fs');
var rp = require('request-promise');
const timer = ms => new Promise( res => setTimeout(res, ms));
var cheerio = require('cheerio');
var tough = require('tough-cookie');
var Cookie = tough.Cookie;
var {ipcRenderer, remote} = require('electron');
var puppeteer = require('puppeteer');

var cleavePhone = new Cleave('#phone', {
    blocks: [3, 3, 4],
    delimiter: '-',
    delimiterLazyShow: true,
    numericOnly: true,
});
var cleaveCardnumber = new Cleave('#ccnumber', {
    creditCard: true
});
var cleaveUsZip = new Cleave('#uszip', {
    blocks: [5],
    numericOnly: true,
});
var cleaveCaZip = new Cleave('#cazip', {
    blocks: [3, 3],
    delimiter: ' ',
    delimiterLazyShow: true,
});

var pookyWorkers = [];
var pookyCookies = [];
var taskcounter = 0;
var tasks = {};
var captchabank = [];
const $ = selector => document.querySelector(selector);

initialize();

let loadedprofiles = Object.keys(JSON.parse(fs.readFileSync('profiles.json').toString()));
for (var i = 0; i < loadedprofiles.length; i++) {
    var option = document.createElement("option");
    var option2 = document.createElement("option");
    option.value = loadedprofiles[i];
    option.text = loadedprofiles[i];
    option2.value = loadedprofiles[i];
    option2.text = loadedprofiles[i];
    $('#pickprofile').appendChild(option);
    $('#taskprofile').appendChild(option2);
}

$('#cazip').hidden = true;

function wait(milleseconds) {
  return new Promise(resolve => setTimeout(resolve, milleseconds))
}

async function initializePooky() {
  for (let i = 0; i < 5; i++){
    const browser = await puppeteer.launch();
    pookyWorkers.push(browser);
  }
}

async function generatePooky() {
  let pookyTasks = [];
  while (true) {
    while (pookyCookies.length < 100) {
      try {
        let count = 100 - pookyCookies.length;
        if (count > 5)
          count = 5;
        for (let i = 0; i < count; i++) {
          pookyTasks.push(pookyHeadless());
        }
        await Promise.all(pookyTasks);
      } catch(err) {}
    }
    await timer(1000);
  }
}

async function pookyHeadless() {
    const browser = pookyWorkers.pop();
    const page = await browser.newPage();
    await page.goto('https://www.supremenewyork.com/shop/all/accessories');
    await page.evaluate(() => {
      document.querySelector("#container > article:last-child > div > a").click();
    });
    await page.waitForSelector('#add-remove-buttons > input');
    await page.evaluate(() => {
      document.querySelector("#add-remove-buttons > input").click();
    });
    await page.waitForSelector('#cart > a.button.checkout');
    await page.evaluate(() => {
      document.querySelector("#cart > a.button.checkout").click();
    });
    const cookies = await page.cookies();
    await page.close();
    const cookiearray = JSON.parse(JSON.stringify(cookies));
    const pookyarray = [];
    cookiearray.forEach(cookie => {
      if(cookie['name'].includes('pooky'))
        pookyarray.push(cookie);
    });
    pookyCookies.push(pookyarray);
    pookyWorkers.push(browser);
}

async function initialize() {
  initializeRequest();
  await initializePooky();
  // generatePooky();
}

async function initializeRequest() {
  try {
    let googlerequest = {
        uri: 'http://www.google.com/',
    };
    let rpinitialize = await rp(googlerequest);
  }
  catch (err) {
    console.log('request initialize failed', err);
  }
}

async function highlightError(element) {
  try {
    document.getElementById(element).classList.toggle('profileerror');
    await timer(1000);
    document.getElementById(element).classList.toggle('profileerror');
  }
  catch (err) {
    console.log('error failed', err);
  }
}

async function updateTasklist() {
  try {
    while ($('#tasklist').firstChild) {
        $('#tasklist').removeChild($('#tasklist').firstChild);
    }
    let keys = Object.keys(tasks);
    for (var i = 0; i < keys.length; i++) {
      let taskid = keys[i];
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      var text = document.createTextNode(keys[i].toString());
      td.appendChild(text);
      var td1 = document.createElement("td");
      var text1 = document.createTextNode(tasks[keys[i]][0]);
      td1.appendChild(text1);
      var td2 = document.createElement("td");
      var text2 = document.createTextNode(tasks[keys[i]][3]);
      td2.appendChild(text2);
      var td3 = document.createElement("td");
      if (tasks[[keys[i]]][5]){
        var text3 = document.createTextNode("Random");
      } else {
        var text3 = document.createTextNode(tasks[keys[i]][4]);
      }
      td3.appendChild(text3);
      var td4 = document.createElement("td");
      var text4 = document.createTextNode(tasks[keys[i]][6]);
      td4.appendChild(text4);
      var td5 = document.createElement("td");
      td5.id = 'mb' + keys[i].toString();
      var text5 = document.createTextNode(tasks[keys[i]][9]);
      td5.appendChild(text5);
      var td6 = document.createElement("td");
      td6.style.textAlign = "center";
      var button1 = document.createElement("button");
      button1.classList.toggle('taskbuttons');
      button1.style.width = "25px";
      button1.style.marginLeft = "1px";
      button1.style.marginRight = "1px";
      var text5 = document.createTextNode("▶");
      var button2 = document.createElement("button");
      button2.classList.toggle('taskbuttons');
      button2.style.width = "25px";
      button2.style.marginLeft = "1px";
      button2.style.marginRight = "1px";
      var text6 = document.createTextNode("❚❚");
      var button3 = document.createElement("button");
      button3.classList.toggle('taskbuttons');
      button3.style.width = "25px";
      button3.style.marginLeft = "1px";
      button3.style.marginRight = "1px";
      var text7 = document.createTextNode("✖");
      button1.appendChild(text5);
      button2.appendChild(text6);
      button3.appendChild(text7);
      button1.onclick = function(){startTask(taskid)};
      button3.onclick = function(){deleteTask(taskid)};
      td6.appendChild(button1);
      td6.appendChild(button2);
      td6.appendChild(button3);
      tr.appendChild(td);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tr.appendChild(td4);
      tr.appendChild(td5);
      tr.appendChild(td6);
      $('#tasklist').appendChild(tr);
    }
  }
  catch (err) {
    console.log('task update failed', err);
  }
}

async function updateTaskStatus(task, message) {
  try {
    tasks[task][9] = message;
    $("#mb" + task.toString()).textContent = message;
    console.log('task ' + task.toString() + ": " + message);
  }
  catch (err) {
    console.log('update message failed', err);
  }
}

async function startTask(task) {
  try {
    updateTaskStatus(task, 'task started');
    // const cookies = pookyCookies.pop().map(pooky => {
    //     const cleanedPooky = pooky;
    //     cleanedPooky['key'] = pooky.name;
    //     delete cleanedPooky['name'];
    //     return new Cookie(pooky);
    // });
    const cookieJar = rp.jar();
    // cookies.forEach(cookie =>
    //     cookieJar.setCookie(cookie, "https://www.supremenewyork.com")
    // );
    var options = {
        uri: 'http://www.supremenewyork.com/mobile_stock.json',
        json: true,
    };
    var stockjson = await rp(options);
    var items = stockjson["products_and_categories"][tasks[task][8]];
    updateTaskStatus(task, 'got itemlist');
    for(var i = 0; i < items.length; i++)
    {
      if ((tasks[task][1].every(function(j){ return (items[i]["name"].toLowerCase().indexOf(j.toLowerCase()) != -1)})) && (tasks[task][2].every(function(j){ return (items[i]["name"].toLowerCase().indexOf(j.toLowerCase()) == -1)}))) {
        var itemid = items[i]["id"];
        updateTaskStatus(task, 'itemid: ' + itemid.toString());
        break;
      }
    }
    if (itemid == null){
      updateTaskStatus(task, "didn't find item");
      return;
    }
    var options = {
        uri: 'http://www.supremenewyork.com/shop/' + itemid + '.json',
        json: true,
    };
    var itemjson = await rp(options);
    var itemstyles = itemjson["styles"];
    updateTaskStatus(task, 'got stylelist');
    if(tasks[task][5]){
      var style = itemstyles[Math.floor(Math.random() * Math.floor(itemstyles.length))];
      updateTaskStatus(task, 'randomly picked style: ' + style["name"]);
    } else {
      for(var i = 0; i < itemstyles.length; i++)
      {
        if (itemstyles[i]["name"].toLowerCase().indexOf(tasks[task][4].toLowerCase()) != -1) {
          var style = itemstyles[i];
          updateTaskStatus(task, 'found style: ' + style["name"]);
          break;
        }
      }
    }
    if (style == null){
      updateTaskStatus(task, "didn't find style");
      return;
    }
    itemsizes = style["sizes"];
    if(tasks[task][3] == "Any"){
      var size = itemsizes[Math.floor(Math.random() * Math.floor(itemsizes.length))];
      updateTaskStatus(task, "randomly picked size: " + size["name"]);
    } else {
      for(var i = 0; i < itemsizes.length; i++)
      {
        if (itemsizes[i]["name"].toLowerCase() == tasks[task][3].toLowerCase()) {
          var size = itemsizes[i];
          updateTaskStatus(task, 'found size: ' + size["name"]);
          break;
        }
      }
    }
    if (size == null){
      updateTaskStatus(task, "didn't find size");
      return;
    }
    var options = {
        method: 'POST',
        uri: 'https://www.supremenewyork.com/shop/' + itemid + '/add.json',
        form: {
          'st': style["id"],
          's': size["id"],
          'qty': 1
        },
        headers: {
          'Host': 'www.supremenewyork.com',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_2 like Mac OS X) AppleWebKit/604.4.7 (KHTML, like Gecko) Mobile/15C114',
          'Accept-Language': 'en-us',
          'Accept-Encoding': 'br, gzip, deflate',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'http://www.supremenewyork.com',
          'Referer': 'http://www.supremenewyork.com/mobile'
        },
        resolveWithFullResponse: true,
        jar: cookieJar,
        simple: false
    };
    let resolved = false;
    while (!resolved){
      var res = await rp(options);
      if (res.statusCode == 200){
        resolved = true;
      }
    }
    resolved = false;
    updateTaskStatus(task, "atc");
    ipcRenderer.send('captchaStart', 1);
    while (captchabank.length == 0) {
      await wait(1);
    }
    captchatoken = captchabank.pop();
    var options = {
        uri: 'https://www.supremenewyork.com/checkout/totals_mobile.js?order%5Bbilling_country%5D=USA&cookie-sub=%257B%2522' + size["id"].toString() + '%2522%253A1%257D&order%5Bbilling_state%5D=' + tasks[task][7]['state'] + '&order%5Bbilling_zip%5D=' + tasks[task][7]['zip'] + '&mobile=true',
        headers: {
          'Host': 'www.supremenewyork.com',
          'Accept': 'text/html',
          'Connection': 'keep-alive',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_2 like Mac OS X) AppleWebKit/604.4.7 (KHTML, like Gecko) Mobile/15C114',
          'Accept-Language': 'en-us',
          'Accept-Encoding': 'br, gzip, deflate',
          'Origin': 'http://www.supremenewyork.com',
          'Referer': 'http://www.supremenewyork.com/mobile'
        },
        jar: cookieJar
    };
    rp(options);
    var options = {
        method: 'POST',
        uri: 'https://www.supremenewyork.com/checkout.json',
        form: {
          'store_credit_id': '',
          'from_mobile': 1,
          'cookie-sub': '%257B%2522' + size["id"].toString() + '%2522%253A1%257D',
          'same_as_billing_address': 1,
          'order[billing_name]': tasks[task][7]['name'],
          'order[email]': tasks[task][7]['email'],
          'order[tel]': tasks[task][7]['phone'],
          'order[billing_address]': tasks[task][7]['address1'],
          'order[billing_address_2]': tasks[task][7]['address2'],
          'order[billing_zip]': tasks[task][7]['zip'],
          'order[billing_city]': tasks[task][7]['city'],
          'order[billing_state]': tasks[task][7]['state'],
          'order[billing_country]': tasks[task][7]['country'],
          'credit_card[cnb]': tasks[task][7]['ccnumber'],
          'credit_card[month]': tasks[task][7]['ccmonth'],
          'credit_card[year]': tasks[task][7]['ccyear'],
          'credit_card[rsusr]': tasks[task][7]['cvv'],
          'order[terms]': 0,
          'order[terms]': 1,
          //'g-recaptcha-response': captchatoken,
          'is_from_ios_native': 1,
        },
        headers: {
          'Host': 'www.supremenewyork.com',
          'Accept-Encoding': 'br, gzip, deflate',
          'Connection': 'keep-alive',
          'Accept': 'application/json',
          'Referer': 'http://www.supremenewyork.com/mobile',
          'Accept-Language': 'en-us',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_2 like Mac OS X) AppleWebKit/604.4.7 (KHTML, like Gecko) Mobile/15C114',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'http://www.supremenewyork.com',
        },
        resolveWithFullResponse: true,
        jar: cookieJar,
        json: true,
        simple: false
    };
    await timer(Math.floor(Math.random()*500)+1250);
    while (!resolved){
      var body = await rp(options);
      console.log(body.statusCode);
      if (body.statusCode == 200 || Math.floor(body.statusCode/100) == 3){
        resolved = true;
      }
    }
    updateTaskStatus(task, (body.statusCode == 200 && body.body['mpa'][0]['Success?']) ? "submitted order" : ((body.statusCode == 200 && body.body['mpa'][0]['Sold Out?']) ? 'sold out' : 'checkout failed'));
    console.log(body.body);
  }
  catch (err) {
    updateTaskStatus(task, 'task failed');
    console.log(err);
  }
}

async function deleteTask(task) {
  try {
    delete tasks[task];
    updateTasklist();
  }
  catch (err) {
    console.log('delete failed', err);
    updateTaskStatus(task, 'error');
  }
}

ipcRenderer.on('captcha', (event, arg) => {
  console.log(arg);
  captchabank.push(arg);
});

$('#country').addEventListener('change', () => {
  if ($('#country').value == "USA"){
    while ($('#province').firstChild) {
        $('#province').removeChild($('#province').firstChild);
    }
    var states = ["AL","AK","AS","AZ","AR","CA","CO","CT","DE","DC","FM","FL","GA","GU","HI","ID","IL","IN","IA","KS","KY","LA","ME","MH","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","MP","OH","OK","OR","PW","PA","PR","RI","SC","SD","TN","TX","UT","VT","VI","VA","WA","WV","WI","WY"];
    for (var i = 0; i < states.length; i++) {
        var option = document.createElement("option");
        option.value = states[i];
        option.text = states[i];
        $('#province').appendChild(option);
    }
    $('#cazip').hidden = true;
    $('#uszip').hidden = false;
  }
  if ($('#country').value == "CANADA"){
    while ($('#province').firstChild) {
        $('#province').removeChild($('#province').firstChild);
    }
    var provinces = ["AB","BC","MB","NB","NL","NT","NS","NU","ON","PE","QC","SK","YT"];
    for (var i = 0; i < provinces.length; i++) {
        var option = document.createElement("option");
        option.value = provinces[i];
        option.text = provinces[i];
        $('#province').appendChild(option);
    }
    $('#uszip').hidden = true;
    $('#cazip').hidden = false;
  }
})

$('#randomcolor').addEventListener('change', () => {
  $('#color').disabled = $('#randomcolor').checked;
  if ($('#color').disabled == true){
    $('#color').value = "";
  }
})

$('#saveProfile').addEventListener('click', () => {
  var elem = $('#profileform').elements;
  for(var i = 0; i < elem.length; i++)
  {
    if (elem[i].value == "" && elem[i].id != 'address2' && !((elem[i].id == 'cazip' && $('#country').value == "USA") || (elem[i].id == 'uszip' && $('#country').value == "CANADA"))) {
      var empty = 1;
      highlightError(elem[i].id);
    }
  }
  if ($('#profilename').value == "") {
    var empty = 1;
    highlightError('profilename');
  }
  if (empty == null){
    let profile = {
        "name": $('#name').value,
        "email": $('#email').value,
        "phone": $('#phone').value,
        "address1": $('#address1').value,
        "address2": $('#address2').value,
        "city": $('#city').value,
        "state": $('#province').value,
        "country": $('#country').value,
        "ccnumber": $('#ccnumber').value,
        "ccmonth": $('#ccmonth').value,
        "ccyear": $('#ccyear').value,
        "cvv": $('#cvv').value
    };
    if ($('#country').value == "USA"){
      profile["zip"] = $('#uszip').value;
    } else if ($('#country').value == "CANADA"){
      profile["zip"] = $('#cazip').value;
    }
    let profilejson = JSON.parse(fs.readFileSync('profiles.json').toString());
    profilejson[$('#profilename').value] = profile;
    fs.writeFile('profiles.json',JSON.stringify(profilejson),function(err){
      if(err) throw err;
    })
    var exists = false;
    for(var i = 0, opts = $('#pickprofile').options; i < opts.length; ++i)
       if(opts[i].value === $('#profilename').value)
       {
          exists = true;
          break;
       }
    if (exists != true){
      var option = document.createElement("option");
      var option2 = document.createElement("option");
      option.value = $('#profilename').value;
      option.text = $('#profilename').value;
      option2.value = $('#profilename').value;
      option2.text = $('#profilename').value;
      $('#pickprofile').appendChild(option);
      $('#taskprofile').appendChild(option2);
    }
    while ($('#province').firstChild) {
        $('#province').removeChild($('#province').firstChild);
    }
    var option = document.createElement("option");
    option.value = "";
    option.text = "state/province";
    $('#province').appendChild(option);
    $('#profileform').reset();
    $('#cazip').hidden = true;
    $('#uszip').hidden = false;
    option.setAttribute('disabled', '');
  } else {
  }
})

$('#loadProfile').addEventListener('click', () => {
  if ($('#pickprofile').value == "") {
    var empty = 1;
    highlightError('pickprofile');
  }
  if (empty == null){
    let profilejson = JSON.parse(fs.readFileSync('profiles.json').toString());
    let profile = profilejson[$('#pickprofile').value];
    $('#profilename').value = $('#pickprofile').value;
    $('#name').value = profile['name'];
    $('#email').value = profile['email'];
    $('#phone').value = profile['phone'];
    $('#address1').value = profile['address1'];
    $('#address2').value = profile['address2'];
    $('#city').value = profile['city'];
    $('#country').value = profile['country'];
    $('#ccnumber').value = profile['ccnumber'];
    $('#ccmonth').value = profile['ccmonth'];
    $('#ccyear').value = profile['ccyear'];
    $('#cvv').value = profile['cvv'];
    if ($('#country').value == "USA"){
      while ($('#province').firstChild) {
          $('#province').removeChild($('#province').firstChild);
      }
      var states = ["AL","AK","AS","AZ","AR","CA","CO","CT","DE","DC","FM","FL","GA","GU","HI","ID","IL","IN","IA","KS","KY","LA","ME","MH","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","MP","OH","OK","OR","PW","PA","PR","RI","SC","SD","TN","TX","UT","VT","VI","VA","WA","WV","WI","WY"];
      for (var i = 0; i < states.length; i++) {
          var option = document.createElement("option");
          option.value = states[i];
          option.text = states[i];
          $('#province').appendChild(option);
      }
      $('#cazip').hidden = true;
      $('#uszip').hidden = false;
      $('#uszip').value = profile['zip'];
    }
    if ($('#country').value == "CANADA"){
      while ($('#province').firstChild) {
          $('#province').removeChild($('#province').firstChild);
      }
      var provinces = ["AB","BC","MB","NB","NL","NT","NS","NU","ON","PE","QC","SK","YT"];
      for (var i = 0; i < provinces.length; i++) {
          var option = document.createElement("option");
          option.value = provinces[i];
          option.text = provinces[i];
          $('#province').appendChild(option);
      }
      $('#uszip').hidden = true;
      $('#cazip').hidden = false;
      $('#cazip').value = profile['zip'];
    }
    $('#province').value = profile['state'];
  } else {
  }
})

$('#deleteProfile').addEventListener('click', () => {
  if ($('#pickprofile').value == "") {
    var empty = 1;
    highlightError('pickprofile');
  }
  if (empty == null){
    let profilejson = JSON.parse(fs.readFileSync('profiles.json').toString());
    delete profilejson[$('#pickprofile').value];
    fs.writeFile('profiles.json',JSON.stringify(profilejson),function(err){
      if(err) throw err;
    })
    $("#taskprofile option[value='" + $('#pickprofile').value + "']").remove();
    $("#pickprofile option[value='" + $('#pickprofile').value + "']").remove();
  } else {
  }
})

$('#createTask').addEventListener('click', () => {
  var elem = $('#taskform').elements;
  for(var i = 0; i < elem.length; i++)
  {
    if (elem[i].value == "" && !(elem[i].id == 'color' && $('#randomcolor').checked == true)) {
      var empty = 1;
      highlightError(elem[i].id);
    }
  }
  if ($('#taskprofile').value == "") {
    var empty = 1;
    highlightError('taskprofile');
  }
  var findkeywords = [];
  var ignorekeywords = [];
  let kwraw = $('#keywords').value.split(",");
  for (var i = 0; i < kwraw.length; i++) {
      if(kwraw[i].indexOf("+") != -1){
        findkeywords.push(kwraw[i].substring(1));
      } else if(kwraw[i].indexOf("-") != -1){
        ignorekeywords.push(kwraw[i].substring(1));
      }
  }
  if (findkeywords.length == 0) {
    var empty = 1;
    highlightError('keywords');
  }
  if (empty == null){
    let task = [];
    let profilejson = JSON.parse(fs.readFileSync('profiles.json').toString());
    let profile = profilejson[$('#taskprofile').value];
    task.push($('#keywords').value);
    task.push(findkeywords);
    task.push(ignorekeywords);
    task.push($('#size').value);
    task.push($('#color').value);
    task.push($('#randomcolor').checked);
    task.push($('#taskprofile').value);
    task.push(profile);
    task.push($('#category').value);
    task.push('idle');
    tasks[taskcounter] = task;
    updateTasklist();
    taskcounter += 1;
  } else {
  }
})
