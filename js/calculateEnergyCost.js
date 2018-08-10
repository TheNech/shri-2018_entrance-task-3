exports.calculateEnergyCost = function(data) {
    if(IsJsonString(data)) {
        data = JSON.parse(data);
    }

    const periodsStart = periodsForModes(data.rates);
    const prices = pricePerHour(data.rates);
    const devices = data.devices.concat().sort(compareDevices);
    let energyCost = {
        schedule: getScheduleTemplate(),
        consumedEnergy: {
            value: 0,
            devices: {}
        }
    };

    let powerHours = [];

    devices.forEach(el => {
        let price = 0;

        if(el.mode === undefined || el.mode === 'night') {
            let from = el.mode === 'night' ? periodsStart.night : periodsStart.min;
            while(powerHours[from] && powerHours[from] + el.power > data.maxPower) {
                from++;
                if(from > 23) {
                    from -= 24;
                }
            }

            if((from + el.duration) < 25) {
                for(let i = from; i < (from + el.duration); i++) {
                    energyCost.schedule[i].push(el.id);
                    powerHours[i] === undefined ? powerHours[i] = el.power : powerHours[i] += el.power;
                    price += el.power * prices[i];
                }
            } else {
                let k = 0;
                for(let i = from; i < 24; i++) {
                    energyCost.schedule[i].push(el.id);
                    powerHours[i] === undefined ? powerHours[i] = el.power : powerHours[i] += el.power;
                    price += el.power * prices[i];
                    k++;
                }
                for(let i = 0; i < (el.duration - k); i++) {
                    energyCost.schedule[i].push(el.id);
                    powerHours[i] === undefined ? powerHours[i] = el.power : powerHours[i] += el.power;
                    price += el.power * prices[i];
                }
            }            
        }

        if(el.mode === 'day') {
            let from = periodsStart.day;
            while(powerHours[from] && powerHours[from] + el.power > data.maxPower) {
                from++;
                if(from > 23) {
                    from -= 24;
                }
            }
            // let offset = from + el.duration > 21 ? from + el.duration - 21 : 0;
            for(let i = from; i < (from + el.duration); i++) {
                energyCost.schedule[i].push(el.id);
                powerHours[i] === undefined ? powerHours[i] = el.power : powerHours[i] += el.power;
                price += el.power * prices[i];
            }
        }

        energyCost.consumedEnergy.devices[el.id] = price / 1000;
        energyCost.consumedEnergy.value += price;
    });
    energyCost.consumedEnergy.value /= 1000;

    return JSON.stringify(energyCost, "", 4);
};

// Проверка на JSON
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// Определение времени начала минимального тарифа для каждого режима
function periodsForModes(rates) {
    let minPeriods = {};
    let min = rates[0].value;
    let minDay, minNight;
    rates.forEach(el => {
        if(el.value < min) {
            minPeriods.min = el.from;
        }
        if(el.from >= 7 && el.from < 21) {
            minDay = el.value;
            minPeriods.day = el.from;

        } else {
            minNight = el.value;
            minPeriods.night = el.from;
        }
    });
    rates.forEach(el => {
        if(el.from >= 7 && el.from < 21 && el.value < minDay) {
            minPeriods.day = el.from;
        } else if (el.value < minNight) {
            minPeriods.night = el.from;
        }
    });

    return minPeriods;
}

// Цена энергии для каждого часа
function pricePerHour(rates) {
    let prices = {};
    rates.forEach(el => {
        if(el.from < el.to) {
            for(let i = el.from; i < el.to; i++) {
                prices[i] = el.value;
            }
        } else {
            for(let i = el.from; i < 24; i++) {
                prices[i] = el.value;
            }
            for(let i = 0; i < el.to; i++) {
                prices[i] = el.value;
            }
        }
    });

    return prices;
}

// Сравнение продолжительности работы устройств для сортировки по убыванию
function compareDevices(a, b) {
    return b.duration - a.duration;
}

// Шаблон расписания
function getScheduleTemplate() {
    let schedule = {};
    for(let i = 0; i < 24; i++) {
        schedule[i] = [];
    }
    return schedule;
}
