﻿var _selected = "none";
var _originalBodyContent = "";
var _totalMacros, _currentMacros, _historyServings, _singleDayServing, _historyTotalMacros, _favoriteItems;
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
var dayNames = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
var _alerts = ["addFavorites", "deleteEntry", "importFromFavorites", "setGoalsGrams", "setGoalsPercentages", "setGoalsWhich", "setServingSize"];
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

//workouts 
/*
var _historyWorkouts = {};
var _exercises = {};//key is id, value is exercise obj

function exercise(ID, name, description, day, month, year) { //many per day
    this.day = day; //dates of creation
    this.month = month;
    this.year = year;
    this.name = name;
    this.exerciseID = ID;
    this.comment = description;
}

function set(weight, reps) { //many for each exercise
    this.weight = weight;
    this.reps = reps;
}

function addSet(weight, reps) { //use with call on exercise
    this.sets.push(new set(weight, reps));
}

var todayDate = new Date();

function returnKeyFromDate(date) {
    return date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();
}


_historyWorkouts[returnKeyFromDate(new Date())] = {
    
}
*/