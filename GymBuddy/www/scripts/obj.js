var _selected = "none";
var _originalBodyContent = "";
var _totalMacros, _currentMacros, _historyServings, _singleDayServing, _historyTotalMacros, _favoriteItems;
//not using .toDateString in case of language translation in future.
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
var dayNames = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
var _alerts = ["addFavorites", "deleteEntry", "importFromFavorites", "setGoalsGrams", "setGoalsPercentages", "setGoalsWhich", "setServingSize", "addSet", "addNewExercise", "createExercise"];
var _msgBox = {};

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
    return ((parseFloat(this.fats) * 9) + (parseFloat(this.carbs) + parseFloat(this.proteins)) * 4);
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
    time.weekDay = date.getDay(); //Sunday is 0, Monday is 1..
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


//workouts
var _historyWorkouts = {};
var _exercises = {//key is id, value is exercise obj. These are the saved exercise names and records
};
var _dailyExercises = {}; //these are the exercises for each day
var _exerciseCategories = {}; //category ID, { title, description }

function exercise(ID, name, description, category = 1, maxWeight = 0, maxReps = 0, bestTime = 0) { //saved exercise
    this.name = name;
    this.exerciseID = ID;
    this.categoryID = category;
    this.comment = description; 
    this.maxWeight = maxWeight;
    this.maxReps = maxReps;
    this.bestTime = bestTime;
}

function singleExercise(exerciseID) {
    this.exerciseID = exerciseID;
    this.set = [];
    this.addSet = set;
}

function getMax(exerciseID) {
    if (_exercises.hasOwnProperty(exerciseID))
        return {
            maxWeight: _exercises[exerciseID].maxWeight,
            maxReps: _exercises[exerciseID].maxReps,
            bestTime: _exercises[exerciseID].bestTime
        }
}

function getExerciseDetails(exerciseID, propertyName) {
    if (_exercises.hasOwnProperty(exerciseID) && _exercises[exerciseID].hasOwnProperty(propertyName))
        return _exercises[exerciseID][propertyName];
}

function set(weight, reps, time, note = "") { //many for each exercise
    this.set.push({
        note: note,
        weight: weight,
        reps: reps,
        rest: rest
    });
}

function returnKeyFromDate(date) {//used to generate keys and date format, not using .toLocaleDateString() because I REALLY wanted d/MM/YYYY
    return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
}


function addIteratorToObject(obj) {
    Object.defineProperty(obj, Symbol.iterator, {
        enumerable: false,
        configurable: false,
        value: function () {
            var o = this;
            var id = 0;
            var keys = Object.keys(o);
            return {
                next: function () {
                    let key = keys[id++];
                    return {
                        value: {
                            obj: o[key],
                            relativeKey: key
                        },
                        done: (id > keys.length)
                    }
                }
            }
        }
    });
}