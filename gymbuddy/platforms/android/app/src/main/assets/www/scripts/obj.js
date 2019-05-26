var _database = null;
var _selected = "none";
var _originalBodyContent = "";
var _totalMacros, _currentMacros, _historyServings, _singleDayServing, _historyTotalMacros, _favoriteItems;
//not using .toDateString in case of language translation in future.
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
var dayNames = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
var _alerts = ["addFavorites", "importFromFavorites", "setGoalsGrams", "setGoalsPercentages", "setGoalsWhich", "setServingSize", "addSet", "addNewExercise", "createExercise", "miniAlert", "multiPurposeAlert"];
var _msgBox = {};
var _pageNames = ["workouts", "macros"];
var _pages = {};

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

function category(name, notes) {
    this.title = name;
    this.description = notes;
}

function exercise(ID, name, description, category = 1, maxWeight = 0, maxReps = 0, bestTime = 0) { //saved exercise
    this.name = name;
    this.exerciseID = ID;
    this.categoryID = category;
    this.comment = description; 
    this.record = [];

}

function record(weight, reps, date, singleExerciseIndex, setId) {
    this.reps = reps;
    this.weight = weight;
    this.where = {
        exerciseIndex: singleExerciseIndex,
        setId: setId,
        date: date
    };
}

//on json convert addSet will be lost.
function singleExercise(exerciseID) {
    this.exerciseID = exerciseID;
    this.set = [];
    this.addSet = addSet;
}

function getExerciseDetails(exerciseID, propertyName) {
    if (_exercises.hasOwnProperty(exerciseID) && _exercises[exerciseID].hasOwnProperty(propertyName))
        return _exercises[exerciseID][propertyName];
}

function addSet(weight, reps, note = "") { //many for each exercise
    this.set.push({
        note: note,
        weight: weight,
        reps: reps
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

function mixinCopyObj(obj) {
    var newObj = Object.create(null);
    for (let property of Object.keys(obj))
        newObj[property] = obj[property];

    return newObj;
}