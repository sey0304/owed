// ===== 画面の部品 =====
const fromIran = document.getElementById("from");
const toIran = document.getElementById("to");
const hoursIran = document.getElementById("hours");
const reasonIran = document.getElementById("reason");
const routeIran = document.getElementById("route");
const botan = document.getElementById("check");

const distanceHyouji = document.getElementById("distanceOut");
const kekka = document.getElementById("result");
const letterBox = document.getElementById("letterBox");
const letter = document.getElementById("letter");
const copyBotan = document.getElementById("copy");

// ===== EU・EEA・スイスの国コード（この国から飛ぶと対象になる）=====
const EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
            "IS","NO","LI","CH",
            "GP","MQ","GF","RE","YT","PM","BL","MF","AW","CW","SX","PF","NC","WF"];

// ===== 打った文字から空港を探す =====
function kuukouSagasu(moji){
    const s = moji.trim().toUpperCase();
    if(s === "") return null;

    // 3文字のコードそのままなら一発
    if(AIRPORTS[s]) return { code: s, data: AIRPORTS[s] };

    // 名前や都市名で探す
    for(const code in AIRPORTS){
        const a = AIRPORTS[code];
        const midashi = (a.n + " " + a.c).toUpperCase();
        if(midashi.includes(s)) return { code: code, data: a };
    }
    return null;
}

// ===== 2地点の距離（km）。地球は丸いので直線ではなく大圏距離 =====
function kyori(y1,x1,y2,x2){
    const R = 6371; // 地球の半径 km
    const rad = Math.PI / 180;
    const dy = (y2 - y1) * rad;
    const dx = (x2 - x1) * rad;
    const a = Math.sin(dy/2)*Math.sin(dy/2)
            + Math.cos(y1*rad)*Math.cos(y2*rad)*Math.sin(dx/2)*Math.sin(dx/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ===== 距離から金額を決める =====
function kingaku(km){
    if(km <= 1500) return 250;
    if(km <= 3500) return 400;
    return 600;
}

// ===== 「航空会社のせいじゃない」と言われる理由 =====
const NIGERARERU = ["weather","atc","security"];

// ===== ボタンを押したとき =====
botan.addEventListener("click", function(){

    const shuppatsu = kuukouSagasu(fromIran.value);
    const touchaku  = kuukouSagasu(toIran.value);

    if(shuppatsu === null || touchaku === null){
        kekka.hidden = false;
        kekka.className = "card bad";
        kekka.innerHTML = "<h2>Airport not found</h2><p>Try the 3-letter code, like HND or LHR.</p>";
        letterBox.hidden = true;
        kekka.scrollIntoView({ behavior: "smooth" });
        return;
    }

    const km = Math.round(kyori(shuppatsu.data.y, shuppatsu.data.x, touchaku.data.y, touchaku.data.x));
    distanceHyouji.textContent = shuppatsu.code + " to " + touchaku.code + " is about " + km + " km.";

    const jikan = Number(hoursIran.value);
    const riyuu = reasonIran.value;

    // EUから飛んだかどうかを自動で見る
    const deEU = EU.includes(shuppatsu.data.k);
    const chakuEU = EU.includes(touchaku.data.k);
    const erabi = routeIran.value;
    const taishou = deEU || erabi === "departEU" || (chakuEU && erabi === "arriveEU");

    let midashi = "";
    let honbun = "";
    let iro = "bad";
    let kane = 0;

    if(!taishou){
        midashi = "Probably not covered";
        honbun = "EU rules cover flights leaving an EU airport, and flights landing in the EU on an EU airline. This route looks like neither. If you flew from the UK, look up UK261 instead &mdash; it works the same way but pays in pounds.";
    } else if(!(jikan >= 3)){
        midashi = "Not enough delay";
        honbun = "You need to arrive 3 hours or more late at your final destination. Enter the delay at the end of the whole journey, not at a stopover.";
    } else if(NIGERARERU.includes(riyuu)){
        midashi = "The airline can probably refuse";
        honbun = "Bad weather, air traffic control strikes and security threats count as things outside the airline's control. You still have the right to food, and a hotel if you had to stay overnight &mdash; ask for those.";
    } else {
        kane = kingaku(km);
        iro = "good";
        midashi = "You are probably owed &euro;" + "<samp>" + kane + "</samp>";
        honbun = "Distance " + km + " km, delayed " + jikan + " hours. A technical fault, a crew problem, or overbooking is the airline's own problem &mdash; they cannot use it as an excuse.";
        if(Math.abs(km - 1500) <= 30 || Math.abs(km - 3500) <= 30){
            honbun = honbun + "This flight is close to a distance boundary, so the amount could be one band higher or lower. Check the exact distance with the airline before you claim."
        }
    }

    kekka.hidden = false;
    kekka.className = "card " + iro;
    kekka.innerHTML = "<h2>" + midashi + "</h2><p>" + honbun + "</p>";
    kekka.scrollIntoView({behavior:"smooth"});

    if(kane > 0){
        letter.value = tegami(shuppatsu, touchaku, km, jikan, kane);
        letterBox.hidden = false;
    } else {
        letterBox.hidden = true;
    }
});

// ===== 請求の手紙を作る =====
function tegami(shuppatsu, touchaku, km, jikan, kane){
    return "Subject: Compensation claim under Regulation (EC) 261/2004\n"
        + "\n"
        + "Dear Sir or Madam,\n"
        + "\n"
        + "I am writing to claim compensation under Regulation (EC) 261/2004.\n"
        + "\n"
        + "Booking reference: [write it here]\n"
        + "Flight number: [write it here]\n"
        + "Date of flight: [write it here]\n"
        + "Route: " + shuppatsu.code + " (" + shuppatsu.data.c + ") to " + touchaku.code + " (" + touchaku.data.c + ")\n"
        + "Great-circle distance: approximately " + km + " km\n"
        + "Delay on arrival at final destination: " + jikan + " hours\n"
        + "\n"
        + "Because I arrived at my final destination three hours or more behind schedule,\n"
        + "and the delay was not caused by extraordinary circumstances, I am entitled to\n"
        + "compensation of EUR " + kane + " under Article 7 of the Regulation.\n"
        + "\n"
        + "Please pay this amount to the bank account below within 14 days.\n"
        + "\n"
        + "Account holder: [write it here]\n"
        + "IBAN or account number: [write it here]\n"
        + "\n"
        + "If you believe extraordinary circumstances applied, please send me evidence of\n"
        + "them. If I do not hear from you, I will refer the matter to the national\n"
        + "enforcement body of the country of departure.\n"
        + "\n"
        + "Yours faithfully,\n"
        + "[your name]\n";
}

// ===== 手紙をコピー =====
copyBotan.addEventListener("click", function(){
    letter.select();
    navigator.clipboard.writeText(letter.value);
    copyBotan.textContent = "Copied";
});
