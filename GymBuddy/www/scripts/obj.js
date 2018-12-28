var _selected = "none";
var _originalBodyContent = "";
var _totalMacros, _currentMacros, _historyServings, _singleDayServing, _historyTotalMacros, _favoriteItems;
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
var dayNames = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
//Macros Object
function totalMacros(totalFats, totalCarbs, totalProteins, month, day, year) {
    this.fats = totalFats;
    this.carbs = totalCarbs;
    this.proteins = totalProteins;
    this.month = month;
    this.day = day;
    this.year = year;
    this.calculateCalories = calculateCalories;
}

function currentMacros(currentFats, currentCarbs, currentProteins, month, day, year) {
    this.fats = currentFats;
    this.carbs = currentCarbs;
    this.proteins = currentProteins;
    this.calculateCalories = calculateCalories;
    this.day = day;
    this.month = month;
    this.year = year;
}

function singleServing(minutes, hour, servingSize, fats, carbs, proteins, itemName = "New Item", servingQuantity) {
    this.minutes = minutes;
    this.hour = hour;
    this.fats = fats;
    this.carbs = carbs;
    this.proteins = proteins;
    this.calculateCalories = calculateCalories;
    this.itemName = itemName;
    this.servingSize = servingSize;
    this.servingQuantity = servingQuantity;
}

function calculateCalories() {
    return ((this.fats * 9) + (this.carbs + this.proteins) * 4);
}

function singleDayServing(day, month, year, totalMacrosId = null, totalCarbs = null, totalFats = null, totalProteins = null) {
    this.day = day;
    this.month = month;
    this.year = year;
    this.totalMacrosId = totalMacros;
    this.servings = []; 
    this.carbs = totalCarbs;
    this.fats = totalFats;
    this.proteins = totalProteins;
}

function getCurrentTime() {
    var time = {};
    var date = new Date();
    time.day = date.getDate();
    time.month = date.getMonth() + 1;
    time.year = date.getFullYear();
    time.hour = date.getHours();
    time.minutes = date.getMinutes();

    return time;
}

function favoriteItem(title, grams, proteins, fats, carbs) {
    this.title = title;
    this.grams = grams;
    this.proteins = proteins;
    this.fats = fats;
    this.carbs = carbs;
}

_favoriteItems = [];
_historyServings = {};
_historyTotalMacros = {};