'use strict'
$(document).ready(function () {
    $("#header").animate({
        "top": "0px"
    }, 500);

    var time = window.getCurrentTime();
    if (doesNotExist(localStorage.getItem("historyServings"))) {
        newSingleDayServing(time);
        localStorage.setItem("singleDayServing", JSON.stringify(window._singleDayServing));
        localStorage.setItem("historyServings", JSON.stringify(window._historyServings)); //check this, it may be undefined on first time and cause issues?
    } else {
        if (doesNotExist(localStorage.getItem("singleDayServing"))) {
            newSingleDayServing(time);
        }
        else {
            _singleDayServing = JSON.parse(localStorage.getItem("singleDayServing"));
            if (window._singleDayServing.day !== time.day || window._singleDayServing.month !== time.month || window._singleDayServing.year !== time.year) {
                newSingleDayServing(time);
            }
        }
        _historyServings = JSON.parse(localStorage.getItem("historyServings"));
    }

    if (!doesNotExist(localStorage.getItem("favorites"))) {
        _favoriteItems = JSON.parse(localStorage.getItem("favorites"));
    }

    if (!doesNotExist(localStorage.getItem("lastOpened"))) {
        setTimeout(function waitForAnimation() {
            if (localStorage.getItem("lastOpened") == "macros")
                $("#btnMacros").trigger("click");

            if (localStorage.getItem("lastOpened") == "workouts")
                $("#btnWorkouts").trigger("click");
        }, 500)
    }

    //workouts
    if (!doesNotExist(localStorage.getItem("historyWorkouts"))) {
        _historyWorkouts = JSON.parse(localStorage.getItem("historyWorkouts"));
    }

    if (!doesNotExist(localStorage.getItem("exercises"))) {
        _exercises = JSON.parse(localStorage.getItem("exercises"));
    }
    preloadAlerts();
    preloadPages();
});


function preloadAlerts() { //pre loads all possible message boxes, so that in real time there is no delay when reading from disk
    for (let j = 0; j < _alerts.length; j++) {
        $.get("alerts/" + _alerts[j] + ".html", function (data) {
            _msgBox[_alerts[j]] = data;
        });
    }
}

function preloadPages() {
    for (let j = 0; j < _pageNames.length; j++) {
        $.get(_pageNames[j] + ".html", function (data) {
            _pages[_pageNames[j]] = data;
        });
    }
}

function newSingleDayServing(time) {
    window._singleDayServing = new window.singleDayServing(time.day, time.month, time.year);
}

//To fix stickyhover on mobile devices
$("#btnMacros, #btnWorkouts").on('mouseenter touchstart', function () {
    $(this).addClass("btnHovered");
});

$("#btnMacros, #btnWorkouts").on('mouseleave touchend', function () {
    $(this).removeClass("btnHovered");
});

$("#btnMacros, #btnWorkouts").on("click", function () {
    var width1 = "";
    var width2 = "";

    if (_selected == "none") {
        width1 = "110%";
        width2 = "0%";
        _selected = $(this).attr("id").replace("btn", "").toLowerCase();
        $(this).addClass("btnActive");
        $("#header > h1").addClass("opened");

    } else {
        width1 = width2 = "55%";
        _selected = "none";
        $(".btnActive").trigger("mouseleave"); //To fix stickyhover on mobile devices
        $(".btnActive").removeClass("btnActive");
        $("#header > h1").removeClass("opened");

    }
    $(this).width(width1);
    $(this).siblings().width(width2);


    loadContent(_selected);
});

function loadContent(what) {//initializes one part of the app vs the other
    if (what !== "none") {
        _originalBodyContent = $("#body").html();
        $("#body").empty().append(_pages[what]);
        pushTopAnimation("#pushContent", what);
        let d = returnPastDate(1);
        if (what == "macros") {
            updateBarWidths();
            checkHistoryServings(d);
            updateOldBarWidths(d);
            loadWeeklyStatsGraph();
            localStorage.setItem("lastOpened", "macros");
        } else {//workouts
            checkHistoryWorkouts(d);
            localStorage.setItem("lastOpened", "workouts");

            if (!doesNotExist(localStorage.getItem("_historyWorkouts")))
                _historyWorkouts = JSON.parse(localStorage.getItem("_historyWorkouts"));

            if (!doesNotExist(localStorage.getItem("_exercises"), false)) {
                _exercises = JSON.parse(localStorage.getItem("_exercises"));
            } else {
                setDefaultExercises();
            }

            if (!doesNotExist(localStorage.getItem("_exerciseCategories"))) {
                _exerciseCategories = JSON.parse(localStorage.getItem("_exerciseCategories"));
            } else {
                setDefaultCategories();
            }

            loadWorkoutsForToday();
            //Add iterator to objects to have direct access to its property values
            if (!_exercises.hasOwnProperty(Symbol.iterator))
                addIteratorToObject(_exercises);

            if (!_exerciseCategories.hasOwnProperty(Symbol.iterator))
                addIteratorToObject(_exerciseCategories);

            if (!_historyWorkouts.hasOwnProperty(Symbol.iterator))
                addIteratorToObject(_historyWorkouts);
        }
    } else {
        $("#pushContent").children("div").each(function (i, e) {
            $(e).addClass("animatedOut");
        });
        setTimeout(function () {
            $("#body").empty().append(_originalBodyContent.replace("parent both-full", "parent opacity-0 both-full"));
            $("#body .opacity-0").animate({
                "opacity": "1"
            }, 250);
            localStorage.removeItem("lastOpened");
        }, 300);
    }

}
function pushTopAnimation(element, what) {
    var delay = 0; //regardless of how many children div, all will animate
    $(element).children("div").each(function (i, e) {
        setTimeout(function () {
            $(e).addClass("animatedIn");
        }, delay);
        delay += 250 - (i * 50);
    });
}

function loadDailyServings(entriesContainer = "#entriesContainer", singleDayServing = _singleDayServing, msg = "No servings have been added for today yet") {
    $(entriesContainer).empty();
    if (!isEmpty(singleDayServing) && singleDayServing.servings.length > 0) {
        var singleServingEntryDiv = `<div class="singleServingLoadedEntry">
            <div><p>FOODNAME</p></div><div><p><span>TIME</span><span class="glyphicon glyphicon-menu-up"></span></p></div>
            <div class="innerContents">
            
            <div>
                <p>You had SERV servings of GRMSg</p>
                <div>
                    <p>Calories: CALS</p>
                    <ul>
                        <li><p>Fats: <span>FATSg</span></p></li>
                        <li><p>Carbs: <span>CARBSg</span></p></li>
                        <li><p>Protein: <span>PROTEINSg</span></p></li>
		            </ul>
                </div><div><div class='saveEntry' data-values='DATAVALUES'>
                        <span class='glyphicon glyphicon-heart'></span>
                    </div>
                    `+ (entriesContainer == "#entriesContainer" ? `
                    <div class='removeEntry' data-item-id='ATTRID'>
                        <span class='glyphicon glyphicon-trash'></span>
                    </div>` : "") + `
                </div>
            </div>

            <div></div>
            </div>
            <div></div>
            <div class="HIDELAST"></div>
            </div>`;
        for (let j = singleDayServing.servings.length - 1; j >= 0; j--) {
            let item = singleDayServing.servings[j];
            let hideLast = (j == 0 ? "" : "hidden");

            let calories = round(window.calculateCalories.call(item) * parseFloat(item.servingQuantity));
            let proteins = round(parseFloat(item.proteins) * parseFloat(item.servingQuantity));
            let carbs = round(parseFloat(item.carbs) * parseFloat(item.servingQuantity));
            let fats = round(parseFloat(item.fats) * parseFloat(item.servingQuantity));
            let tmpObj = {
                title: item.itemName,
                proteins: round(proteins / item.servingQuantity),
                fats: round(fats / item.servingQuantity),
                carbs: round(carbs / item.servingQuantity),
                grams: item.servingSize
            }
            let valuesToReplace = ["FOODNAME", "TIME", "HIDELAST", "FATS", "CARBS", "PROTEINS", "CALS", "SERV", "GRMS", "ATTRNAME", "DATAVALUES"];
            let valuesToReplaceWith = [item.itemName, item.hour + ":" + item.minutes, hideLast, fats, carbs, proteins, calories, item.servingQuantity, item.servingSize, item.itemName, JSON.stringify(tmpObj)];

            if (entriesContainer == "#entriesContainer") {
                valuesToReplace.push("ATTRID");
                valuesToReplaceWith.push(j);
            }

            $(entriesContainer).append(replaceArrays(singleServingEntryDiv, valuesToReplace, valuesToReplaceWith));

        }

    } else {
        $(entriesContainer).append("<div class='parent both-full'><div class='child'><p class='text-center width-full font-size-18'>" + msg + ".</p></div></div>");
    }
}

function replaceArrays(string, arrayOne, arrayTwo) {
    for (let j in arrayOne)
        string = string.replace(arrayOne[j], arrayTwo[j]);

    return string;
}

$(document).on("click", ".singleServingLoadedEntry > div:first-of-type, .singleServingLoadedEntry > div:nth-of-type(2)", function () {
    $(this).parent().toggleClass("open");
    $(this).parent().children(".innerContents").toggleClass("open");
});


function updateBarWidths() {
    var currentDate = getCurrentTime();
    if (doesNotExist(localStorage.getItem("totalMacros"))) {
        //no save data for calories
        _totalMacros = new window.totalMacros(0, 0, 0, currentDate.month, currentDate.day, currentDate.year);

    } else {
        //load save data for calories         
        _totalMacros = JSON.parse(localStorage.getItem("totalMacros"));
        Object.setPrototypeOf(_totalMacros, calculateCalories); //when pulling from localstorage and parsing to obj onyl variables are saved to function not the functions inside
        _totalMacros.calculateCalories = window.calculateCalories;
    }
    var currentCaloriesDate = "";
    if (doesNotExist(localStorage.getItem("currentMacros"))) {
        _currentMacros = new window.currentMacros(0, 0, 0, currentDate.month, currentDate.day, currentDate.year);
        localStorage.setItem("currentMacros", JSON.stringify(_currentMacros));
    } else {
        _currentMacros = JSON.parse(localStorage.getItem("currentMacros"));

        if (currentDate.day == _currentMacros.day && currentDate.month == _currentMacros.month && currentDate.year == _currentMacros.year) {
            //if same day, load macros
            Object.setPrototypeOf(_currentMacros, calculateCalories); //broser localstorage set item sets variables but not the function itself
            _currentMacros.calculateCalories = window.calculateCalories;
        } else {
            //load new current macros
            _currentMacros = new window.currentMacros(0, 0, 0, currentDate.month, currentDate.day, currentDate.year);
            localStorage.setItem("currentMacros", JSON.stringify(_currentMacros));
        }
    }
    $("#currentFats").html(round(_currentMacros.fats));
    $("#currentCarbs").html(round(_currentMacros.carbs));
    $("#currentProteins").html(round(_currentMacros.proteins));
    $("#totalFats").html(round(_totalMacros.fats));
    $("#totalCarbs").html(round(_totalMacros.carbs));
    $("#totalProteins").html(_totalMacros.proteins);
    $("#currentCalories").html(Math.round(_currentMacros.calculateCalories()));
    $("#totalCalories").html(Math.round(_totalMacros.calculateCalories()));
    $("#barFats").width(calculatePercentage(_currentMacros.fats, _totalMacros.fats) + "%");
    $("#barCarbs").width(calculatePercentage(_currentMacros.carbs, _totalMacros.carbs) + "%");
    $("#barProteins").width(calculatePercentage(_currentMacros.proteins, _totalMacros.proteins) + "%");
    if (round(_totalMacros.fats) < round(_currentMacros.fats)) {
        $("#warningFats").removeClass("hidden");
    } else {
        $("#warningFats").addClass("hidden");
    }
    if (round(_totalMacros.carbs) < round(_currentMacros.carbs)) {
        $("#warningCarbs").removeClass("hidden");
    } else {
        $("#warningCarbs").addClass("hidden");
    }
    if (round(_totalMacros.proteins) < round(_currentMacros.proteins)) {
        $("#warningProteins").removeClass("hidden");
    } else {
        $("#warningProteins").addClass("hidden");
    }
    loadDailyServings();
}

function calculatePercentage(current, total) {
    return (100 * current / total);
}


//Set New Goal For Calories

$(document).on("click", "#setGoals .buttonStyled", function () {
    alertMsgToAppend("setGoalsWhich");
});

$(document).on("click", "#continueGoalSet", function () {
    alertMsgToAppend("setGoals" + $(this).data("which"));
});

$(document).on("click", "#gramsPrecentagesSwitch p", function () {
    $("#continueGoalSet").data("which", $(this).html());
    $("#gramsPrecentagesSwitch p.active").removeClass("active");
    $(this).addClass("active");
});

$(document).on("click", "#setMacrosGrams", function () {
    $(".errorMsg").slideUp();
    if ($("#fatsCount").val().trim().length > 0 && $("#carbsCount").val().trim().length > 0 && $("#proteinsCount").val().trim().length > 0) {
        setNewGoals($("#fatsCount").val().trim(), $("#carbsCount").val().trim(), $("#proteinsCount").val().trim());
        updateBarWidths();
        closeAlert();
    } else {
        $(".errorMsg").slideDown(300);
    }
});

$(document).on("click", "#setMacrosPercentages", function () {
    $(".errorMsg").slideUp();
    if ($("#fatsCount").val().trim().length > 0 && $("#carbsCount").val().trim().length > 0 && $("#proteinsCount").val().trim().length > 0 && $("#caloriesCount").val().trim().length > 0 && (parseFloat($("#fatsCount").val().trim()) + parseFloat($("#carbsCount").val().trim()) + parseFloat($("#proteinsCount").val().trim()) == 100)) {
        //set new goals
        var calories = $("#caloriesCount").val().trim();
        setNewGoals(returnGrams($("#fatsCount").val().trim(), calories, 9), returnGrams($("#carbsCount").val().trim(), calories, 4), returnGrams($("#proteinsCount").val().trim(), calories, 4));
        updateBarWidths();
        closeAlert();
    } else {
        $(".errorMsg").slideDown(300);
    }
});

function returnGrams(percentage, total, caloriePerGram) {
    return (Math.round((total * percentage / 100 / caloriePerGram) * 100) / 100);
}

$(document).on("click", "#displayMessage", function (e) {
    e.stopPropagation();
});


$(document).on("click", "#alertBg", function (e) {
    if ($(this).attr("id") == "alertBg")
        closeAlert();
});

$(document).on("click", "#cancel", function () {
    closeAlert();
});

function closeAlert() {
    $("#alertBg").animate({
        "opacity": "0"
    }, 100, function () {
        setTimeout(function () {
            $("#alertBg").remove();
        }, 150);
    });
}

function closeAlert() {
    $("#alertBg").animate({
        "opacity": "0"
    }, 100, function () {
        setTimeout(function () {
            $("#alertBg").remove();
        }, 150);
    });
}

$(document).on("input", "#fatsCount, #proteinsCount, #carbsCount", function () {
    $(this).val($(this).val().replace(",", ".").trim().match(/^\d*\.?\d*$/));
    if ($(this).val() > 500)
        $(this).val(500);
});

$(document).on("input", "#gramsCount", function () {
    $(this).val($(this).val().replace(",", ".").trim().match(/^\d*\.?\d*$/));
    if ($(this).val() > 9999)
        $(this).val(9999);
});

function setNewGoals(fats, carbs, proteins) {
    //set new goals
    var currentDate = getCurrentTime();
    _totalMacros.fats = fats;
    _totalMacros.carbs = carbs;
    _totalMacros.proteins = proteins;
    _totalMacros.day = currentDate.day
    _totalMacros.month = currentDate.month; // 1 to 12
    _totalMacros.year = currentDate.year;


    localStorage.setItem("totalMacros", JSON.stringify(_totalMacros));

    if (!doesNotExist(localStorage.getItem("historyTotalMacros"))) {
        _historyTotalMacros = JSON.parse(localStorage.getItem("historyTotalMacros"));
    }
    _historyTotalMacros[currentDate.day + "/" + currentDate.month + "/" + currentDate.year] = _totalMacros;
    localStorage.setItem("historyTotalMacros", JSON.stringify(_historyTotalMacros));
}

function alertMsgToAppend(fileToAppend, smoothSwitch = true, replaceWhat = [], replaceWith = [], attributes = []) { //attributes is array of objects with attrName = value
    if (!smoothSwitch && $("#alertBg").length > 0)
        closeAlert();

    if ($("#alertBg").length == 0) //show both normally
        smoothSwitch = false;

    var content = "<div id='displayMessage' class='silver-bg jet-fg coolBorder'>CONTENTHERE</div>".replace("CONTENTHERE", _msgBox[fileToAppend]);

    if (replaceWhat.length > 0 && replaceWith.length > 0 && replaceWhat.length == replaceWith.length)
        for (let i = 0; i < replaceWhat.length; i++)
            content = content.replace(replaceWhat[i], replaceWith[i]);

    if (!smoothSwitch) {
        $("body").prepend("<div id='alertBg' class='transition-all-0-5 both-full noselect'><div class='parent both-full'><div class='child width-full'>" + content + "</div></div></div>");
        $("#alertBg").animate({
            "opacity": "1"
        }, 100);
    } else {
        $("#displayMessage").animate({
            "opacity": "0"
        }, 100, function () {
            $("#displayMessage").remove();

            $("#alertBg > div > div").prepend(content.replace("class", "style='opacity:0;' class"));
            $("#displayMessage").animate({
                "opacity": "1"
            }, 100);
        });
    }
    attributes.forEach(function (item, i) {
        $("#alertBg").data(item["attrName"], item["attrValue"]);
    });
}

//for any input with title-like requirements
$(document).on("input", ".camelCaseInput", function () {
    $(this).val(camelCaseInput($(this).val()));
});

//Instead of CSS's text-transform: capitalize; JUST BECAUSE JS IS DOPER.
function camelCaseInput(string) {
    var camel = "";
    var lastLetter = string.substr(string.length - 1) == " " ? " " : "";
    var x = string.trim().split(" ");
    var tmpSpace = "";
    for (var i = 0; i <= x.length - 1; i++) {
        if (i > 0) {
            tmpSpace = " ";
        }
        camel += tmpSpace + x[i].substr(0, 1).toUpperCase() + x[i].substr(1).toLowerCase();
    }
    return camel + lastLetter;
}

$(document).on("focusin", "#foodName", function () {
    $(this).attr("placeholder", "");
});

$(document).on("focusout", "#foodName", function () {
    $(this).attr("placeholder", "Type Food Name Here");
});

$(document).on("input", "#singleFoodCarbs input, #singleFoodProteins input, #singleFoodFats input, #singleFoodServingSize input, input.carbsOrange, input.fatsRed, input.proteinsGreen, input#kgCount", function () {
    $(this).val($(this).val().replace(",", ".").trim().match(/^\d*\.?\d*$/));
    if ($(this).val().trim() == ".")
        $(this).val("0.");
});

$(document).on("focusin", "#singleFoodCarbs input, #singleFoodProteins input, #singleFoodFats input, #singleFoodServingSize input, input.carbsOrange, input.fatsRed, input.proteinsGreen, input#repCount", function () {
    if ($(this).val().trim() == "0")
        $(this).val("");
});

$(document).on("focusin click", "input#kgCount", function () {
    if ($(this).val().trim() == "0.0")
        $(this).val("");
});

$(document).on("focusout", "input#kgCount", function () {
    let val = round($(this).val().trim());
    if (val % 2 == 0)
        val = val.toFixed(1);

    $(this).val(val);
});

$(document).on("focusout", "#singleFoodCarbs input, #singleFoodProteins input, #singleFoodFats input, #singleFoodServingSize input, input.carbsOrange, input.fatsRed, input.proteinsGreen, input#repCount", function () {
    if ($(this).val().trim().length <= 0)
        $(this).val("0");

    if ($(this).val().trim().indexOf(".") == 0)
        $(this).val("0" + $(this).val());
});

$(document).on("click", "#addServing", function () {
    var serving = $("#singleFoodServingSize input").val().trim();
    if (_totalMacros.calculateCalories() > 0) {
        if (serving.length > 0 && serving !== "0") {
            var name = $("#foodName").val().trim().length > 0 ? $("#foodName").val().trim() : "Unnamed";
            alertMsgToAppend("setServingSize", true, ["GRAMS", "FOODNAME"], [serving, name], [
                {
                    attrName: "servingSize",
                    attrValue: serving
                }
            ]);
        } else {
            errorField("#singleFoodServingSize p");
        }
    } else {
        $("body").scrollTop(0);
        errorField("#caloriesCounter > p:first-of-type");
    }

});

$(document).on("click", "#setServingSize", function () { //AlertMsgToAppend button of add serving by size
    var fats = $("#singleFoodFats input").val().trim();
    var carbs = $("#singleFoodCarbs input").val().trim();
    var proteins = $("#singleFoodProteins input").val().trim();
    var serving = $("#alertBg").data("servingSize");//grams
    var servingQuantity = $("#servingSize").val().trim();//servings
    var name = $("#foodName").val().trim().length > 0 ? $("#foodName").val().trim() : "Unnamed Entry";
    if (servingQuantity.length > 0) {
        _currentMacros.fats += round(parseFloat(fats) * servingQuantity);
        _currentMacros.carbs += round(parseFloat(carbs) * servingQuantity);
        _currentMacros.proteins += round(parseFloat(proteins) * servingQuantity);
        var currentDate = getCurrentTime();
        localStorage.setItem("currentMacros", JSON.stringify(_currentMacros));

        var time = window.getCurrentTime();
        var addedItem = new singleServing(time.minutes, time.hour, serving, fats, carbs, proteins, name, servingQuantity);

        _singleDayServing.servings.push(addedItem);

        if (!isEmpty(_singleDayServing)) {
            _singleDayServing.totalMacrosId = _totalMacros.day + "/" + _totalMacros.month + "/" + _totalMacros.year;
            _singleDayServing.fats = _currentMacros.fats;
            _singleDayServing.carbs = _currentMacros.carbs;
            _singleDayServing.proteins = _currentMacros.proteins;

            localStorage.setItem("singleDayServing", JSON.stringify(_singleDayServing));
        }

        _historyServings[time.day + "/" + time.month + "/" + time.year] = _singleDayServing;

        if (!isEmpty(_historyServings))
            localStorage.setItem("historyServings", JSON.stringify(_historyServings));

        updateBarWidths();

        $("#foodName").val("");
        $("#foodTracker > div input").each(function () {
            $(this).val("0");
        });
        closeAlert();
    } else {
        errorField($("#servingSize").siblings("p:first-of-type"));
    }
});


function errorField(element) {
    $(element).removeClass("errorField");
    setTimeout(function () { //wait some miliseconds before adding class, if we removed it before.
        $(element).addClass("errorField");
    }, 50);
}

function isEmpty(obj) {
    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

//Used to round two decimal point
function round(n) {
    return (Math.round(n * 100) / 100);
}

$(document).on("change", "#foodTracker > div > div:not(#singleFoodServingSize) input", function () {
    if ($(this).val() > 500)
        $(this).val(500);
});

$(document).on("change", "#foodTracker > div > #singleFoodServingSize input, #displayMessage input", function () {
    if ($(this).val() > 9999)
        $(this).val(9999);
});

$(document).on("change", "#foodTracker > input", function () {
    if ($(this).val().length > 100)
        $(this).val($(this).val().substr(0, 99));

});

function getDisplayDate(date) {
    return window.dayNames[date.getDay()] + ", " + window.monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}
/*DELETE*/
function callerName() {
    try {
        throw new Error();
    }
    catch (e) {
        try {
            return e.stack.split('at ')[3].split(' ')[0];
        } catch (e) {
            return '';
        }
    }
}
/*DELETE*/
function checkHistoryServings(date) {
    $("#caloriesCounterHistory").removeClass("hidden");
    $("#dayEntriesShownFor").html(getDisplayDate(date)).data("date", date);
    if (!doesNotExist(localStorage.getItem("historyTotalMacros"))) {
        _historyTotalMacros = JSON.parse(localStorage.getItem("historyTotalMacros"));
        console.log(_historyTotalMacros);
    }
}

function returnPastDate(daysToSubtract, startDate = new Date(), subtract = true) {
    startDate.setDate(subtract == true ? startDate.getDate() - daysToSubtract : startDate.getDate() + daysToSubtract)
    return startDate;
}

//Handle previous food entry display

$(document).on("mouseenter touchstart", "#menu-left, #menu-right", function () {
    $(this).addClass("btnHover");
});

$(document).on("mouseleave touchend", "#menu-left, #menu-right", function () {
    $(this).removeClass("btnHover");
});

$(document).on("click", "#menuHistoryServings #menu-left", function () {
    var date = returnPastDate(1, $("#dayEntriesShownFor").data("date"));
    $("#dayEntriesShownFor").html(getDisplayDate(date)).data("date", date);
    if ($("#menu-right").hasClass("hidden")) {
        var currentDate = returnPastDate(1); //yesterday date not current
        if (new Date(date.getFullYear(), date.getMonth(), date.getDate()) < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()))
            $("#menu-right").removeClass("hidden");
    }

    updateOldBarWidths(date);

});

$(document).on("click", "#menuHistoryServings #menu-right", function () {
    if (!$(this).hasClass("hidden")) {
        var date = returnPastDate(1, $("#dayEntriesShownFor").data("date"), false);
        $("#dayEntriesShownFor").html(getDisplayDate(date)).data("date", date);
        var currentDate = returnPastDate(1); //yesterday date not current
        if ((new Date(date.getFullYear(), date.getMonth(), date.getDate()) >= new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())))
            $(this).addClass("hidden");

        updateOldBarWidths(date);
    }

});

function updateOldBarWidths(date) {
    var totalMacrosId = window.returnKeyFromDate(date);
    var oldServings = _historyServings[totalMacrosId];
    if (typeof oldServings != "undefined" && oldServings != null) {
        var totalOldMacros = _historyTotalMacros[_historyServings[totalMacrosId].totalMacrosId];
        Object.setPrototypeOf(oldServings, calculateCalories);
        oldServings.calculateCalories = window.calculateCalories;
        Object.setPrototypeOf(totalOldMacros, calculateCalories);
        totalOldMacros.calculateCalories = window.calculateCalories;

        $("#currentFatsHistory").html(round(oldServings.fats));
        $("#currentCarbsHistory").html(round(oldServings.carbs));
        $("#currentProteinsHistory").html(round(oldServings.proteins));
        $("#totalFatsHistory").html(round(totalOldMacros.fats));
        $("#totalCarbsHistory").html(round(totalOldMacros.carbs));
        $("#totalProteinsHistory").html(totalOldMacros.proteins);
        $("#barFatsHistory").width(calculatePercentage(oldServings.fats, totalOldMacros.fats) + "%");
        $("#barCarbsHistory").width(calculatePercentage(oldServings.carbs, totalOldMacros.carbs) + "%");
        $("#barProteinsHistory").width(calculatePercentage(oldServings.proteins, totalOldMacros.proteins) + "%");
        $("#currentCaloriesHistory").html(Math.round(oldServings.calculateCalories()));
        $("#totalCaloriesHistory").html(Math.round(totalOldMacros.calculateCalories()));

        oldServings = JSON.parse(JSON.stringify(oldServings)); //copy function object to object
        loadDailyServings("#pastEntriesContainer", oldServings, "No servings added for " + totalMacrosId);
    } else {

        $("#currentFatsHistory").html(0);
        $("#currentCarbsHistory").html(0);
        $("#currentProteinsHistory").html(0);
        $("#totalFatsHistory").html(0);
        $("#totalCarbsHistory").html(0);
        $("#totalProteinsHistory").html(0);
        $("#barFatsHistory").width(0 + "%");
        $("#barCarbsHistory").width(0 + "%");
        $("#barProteinsHistory").width(0 + "%");
        $("#currentCaloriesHistory").html(0);

        //make total calories equal to last loaded calories
        $("#totalCaloriesHistory").html(0);
        loadDailyServings("#pastEntriesContainer", "", "No servings added for " + totalMacrosId);
    }
}

$(document).on("click", ".saveEntry", function () {
    alertMsgToAppend("addFavorites", true, ["VALUETITLE", "VALUEFATS", "VALUECARBS", "VALUEPROTEINS", "VALUEGRAMS"], [$(this).data("values").title, $(this).data("values").fats, $(this).data("values").carbs, $(this).data("values").proteins, $(this).data("values").grams]);
});

$(document).on("click", "#saveItemToFavorites", function () {
    $(".errorMsg").slideUp();
    if ($("#fatsCount").val().trim().length > 0 && $("#carbsCount").val().trim().length > 0 && $("#proteinsCount").val().trim().length > 0 && $("#gramsCount").val().trim().length > 0 && $("#itemName").val().trim().length > 0) {
        _favoriteItems.push(new favoriteItem($("#itemName").val().trim(), $("#gramsCount").val().trim(), $("#proteinsCount").val().trim(), $("#fatsCount").val().trim(), $("#carbsCount").val().trim()));
        saveFavorites();
        closeAlert();
    } else {
        $(".errorMsg").slideDown(300);
    }
});

$(document).on("mousedown touchstart", ".favoriteEntry", function () {
    var favoriteFoodObj = $(this).data("values");
    holdTimer = window.setTimeout(function () {
        editFavoriteFood(favoriteFoodObj);
    }, 1000);
});

function editFavoriteFood(favoriteFoodObj) {
    var favoriteDiv = "<div>" + _msgBox["addFavorites"].replace("VALUETITLE", favoriteFoodObj.title).replace("VALUEGRAMS", favoriteFoodObj.grams).replace("VALUEFATS", favoriteFoodObj.fats).replace("VALUECARBS", favoriteFoodObj.carbs).replace("VALUEPROTEINS", favoriteFoodObj.proteins) + "<div>";
    favoriteDiv = $.parseHTML(favoriteDiv);
    favoriteDiv = $(favoriteDiv).find("div.width-full.inputStyling.tableStyling").html();
    alertMsgToAppend("multiPurposeAlert", true, ["TITLEAREA", "TITLEHERE", "PLACEHOLDERTITLE", "VALUETITLE", "SECONDHERE", "PLACEHOLDERNOTES", "VALUENOTES", "ERRORMSG", "SAVECHANGESBUTTON", "YESBTN", "CANCELCHANGESBUTTON", "NOBTN", "CLASS1", "CLASS2", "<!--ADDITIONAL HTML-->", "TABLEMULTIPURPOSE"], ["Edit Favorite Food", "", "", "", "", "", "", "You must fill in all the fields before proceeding.", "saveFavoriteFoodChanges", "Save", "cancelFavoriteFoodChanges", "Cancel", "", "", favoriteDiv, "hidden"], [{ attrName: "favoriteFoodObj", attrValue: favoriteFoodObj }]);
}

$(document).on("click", "#saveFavoriteFoodChanges", function () {
    var title = $("#itemName").val().trim();
    var grams = $("#gramsCount").val().trim();
    var fats = $("#fatsCount").val().trim();
    var proteins = $("#proteinsCount").val().trim();
    var carbs = $("#carbsCount").val().trim();
    var favoriteFoodObj = $("#alertBg").data("favoriteFoodObj");
    if (title.length > 0 && grams.length > 0 && fats.length > 0 && proteins.length > 0 && carbs.length > 0) {
        $(".errMsg").slideUp();
        _favoriteItems[favoriteFoodObj.key] = new favoriteItem(title, grams, proteins, fats, carbs);
        saveFavorites();
        previousAlertToShow.deleteFavorite();
    } else {
        $(".errorMsg").slideDown(300);
    }
});

$(document).on("click", "#cancelFavoriteFoodChanges", function () {
    previousAlertToShow.deleteFavorite();
});

$(document).on("click", "#loadServing", function () {
    loadServing();
});
function loadServing() {
    var options = (_favoriteItems.length == 0 ? "" : (function () {
        var o = "";
        for (let j in _favoriteItems) {
            let tmpObj = {
                title: _favoriteItems[j].title,
                carbs: _favoriteItems[j].carbs,
                fats: _favoriteItems[j].fats,
                proteins: _favoriteItems[j].proteins,
                grams: _favoriteItems[j].grams,
                key: j
            };
            o += `<div class='favoriteEntry' data-values='` + JSON.stringify(tmpObj) + `'>
                <div><p>` + _favoriteItems[j].title.trim() + `
                </p></div><p class='deleteFavorite' data-index='`+ j + `'><span class='glyphicon glyphicon-trash'></span></p>
                </div>`;
        }

        return o;
    }));
    var hidden1 = "hidden";
    var hidden2 = "hidden";
    if (_favoriteItems.length == 0) {
        hidden2 = "";
    } else {
        hidden1 = "";
    }

    alertMsgToAppend("importFromFavorites", true, ["HIDDEN1", "HIDDEN2", "OPTIONS"], [hidden1, hidden2, options]);
}

$(document).on("click", ".favoriteEntry > div", function () {
    var parent = $(this).parent();
    $("#singleFoodServingSize > input").val(parent.data("values").grams);
    $("#singleFoodFats > input").val(parent.data("values").fats);
    $("#singleFoodCarbs > input").val(parent.data("values").carbs);
    $("#singleFoodProteins > input").val(parent.data("values").proteins);
    $("#foodName").val(parent.data("values").title);
    closeAlert();
});

$(document).on("input", "#favoriteName, #exerciseList", function () {
    let optionElementClass = "";
    let optionContainer = "";
    let runSecondPart = false;
    switch ($(this).attr("id")) {
        case "favoriteName":
            optionElementClass = ".favoriteEntry";
            optionContainer = "#favoriteSelect";
            break;
        case "exerciseList":
            optionElementClass = ".workoutEntry";
            optionContainer = "#exerciseSelect";
            runSecondPart = true;
            break;
    }
    searchThroughList(optionElementClass, optionContainer, $(this), runSecondPart);
});

function searchThroughList(optionElementClass, optionContainer, dis, runSecondPart) {
    dis.val(camelCaseInput(dis.val()));
    if (dis.val().trim().length == 0) {
        $(optionElementClass + ".hidden").removeClass("hidden");
    } else {
        $(optionElementClass).each(function () {
            let vals = $(this).data("values");
            if ((vals.hasOwnProperty("title") && vals.title.toLowerCase().indexOf(dis.val().trim().toLowerCase()) == -1) ||
                (vals.hasOwnProperty("name") && vals.name.toLowerCase().indexOf(dis.val().trim().toLowerCase()) == -1)) {
                $(this).addClass("hidden");
            } else {
                $(this).removeClass("hidden");
            }
        });
    }
    if ($(optionElementClass + ":not(.hidden)").length == 0) {
        $(optionContainer + " > p").removeClass("hidden");
        $(optionContainer).addClass("noEditNote");
    } else {
        $(optionContainer + " > p").addClass("hidden");
        $(optionContainer).removeClass("noEditNote");
    }

    //hides category headers altogether if nothing under them, and fixes margin on last category
    if (runSecondPart) {
        $(optionContainer + " > div").each(function () {
            if ($(this).children("div.hidden").length == $(this).children("div").length) {
                $(this).addClass("hidden");
            } else {
                $(this).removeClass("hidden");
            }
        });
        $(optionContainer + " > .last").removeClass("last");
        $(optionContainer + " > div:not(.hidden)").last().addClass("last");
    }
}

$(document).on("click", ".deleteFavorite", function () {
    var indexToRemove = $(this).data("index");
    alertMsgToAppend("miniAlert", true, ["TOPIDHERE", "MESSAGEID", "MSG", "IDOFYESBTN", "IDOFNOBTN", "YESMESG", "NOMESG"], ["deleteFromWorkoutsConfirm", "titleForDelete", "Delete <span>" + _favoriteItems[indexToRemove].title + "</span> from favorites?", "removeFromFavorites", "cancelRemoveFromFavorites", "Delete", "Cancel"], [{ attrName: "index", attrValue: indexToRemove }]);
});

$(document).on("click", "#cancelRemoveFromFavorites", function () {
    previousAlertToShow.deleteFavorite();
});


$(document).on("click", "#removeFromFavorites", function () {
    var indexToRemove = $("#alertBg").data("index");
    _favoriteItems.splice(indexToRemove, 1);
    saveFavorites();
    previousAlertToShow.deleteFavorite();
});

function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(_favoriteItems));
}

$(document).on("click", ".removeEntry", function () {
    var itemId = $(this).data("itemId");
    alertMsgToAppend("miniAlert", true, ["TOPIDHERE", "MESSAGEID", "MSG", "IDOFYESBTN", "IDOFNOBTN", "YESMESG", "NOMESG"], ["deleteFoodEntry", "titleForDelete", "Remove <span>" + _singleDayServing.servings[itemId].itemName + "</span> from today's servings?", "removeEntryFromServings", "cancel", "Delete", "Cancel"], [{ attrName: "index", attrValue: itemId }]);
});

$(document).on("click", "#removeEntryFromServings", function () {
    var indexToRemove = $("#alertBg").data("index");
    var item = _singleDayServing.servings[indexToRemove];
    var carbs = round(parseFloat(item.carbs) * parseFloat(item.servingQuantity));
    var fats = round(parseFloat(item.fats) * parseFloat(item.servingQuantity));
    var proteins = round(parseFloat(item.proteins) * parseFloat(item.servingQuantity));
    console.log(_currentMacros);
    _currentMacros.proteins -= proteins;
    _currentMacros.carbs -= carbs;
    _currentMacros.fats -= fats;
    _singleDayServing.proteins -= proteins;
    _singleDayServing.carbs -= carbs;
    _singleDayServing.fats -= fats;
    var tempSingleDayServing = JSON.parse(JSON.stringify(_singleDayServing));
    tempSingleDayServing.servings.splice(indexToRemove, 1);
    _historyServings[_singleDayServing.day + "/" + _singleDayServing.month + "/" + _singleDayServing.year].servings.splice(indexToRemove, 1);
    localStorage.setItem("currentMacros", JSON.stringify(_currentMacros));
    localStorage.setItem("singleDayServing", JSON.stringify(tempSingleDayServing));
    localStorage.setItem("historyServings", JSON.stringify(_historyServings));
    _singleDayServing = tempSingleDayServing;
    updateBarWidths();
    closeAlert();
});

function loadWeeklyStatsGraph() {
    var highestCalorieCountOfLast7Days = getHighestTotalMacrosFromLast7Days();
    var singleIncrementUnit = Math.round(highestCalorieCountOfLast7Days) / 4;
    highestCalorieCountOfLast7Days += singleIncrementUnit;
    var graphMaxHeight = $("#statsBox").height() - 30;//30 is to offset to height of last index eg 3500
    for (let j = 1; j < 8; j++) {
        let pastDate = returnPastDate(j);
        let singleDayServingId = window.returnKeyFromDate(pastDate);

        $("#xAxisDays p:nth-of-type(" + (8 - j) + ")").html(dayNames[pastDate.getDay()] + "<br/>" + pastDate.getDate());
        let tmpObj = {
            calsFats: 0,
            calsCarbs: 0,
            calsProteins: 0,
            fats: 0,
            carbs: 0,
            proteins: 0
        };
        if (_historyServings.hasOwnProperty(singleDayServingId)) {
            tmpObj.calsFats = round(_historyServings[singleDayServingId].fats * 9);
            tmpObj.calsCarbs = round(_historyServings[singleDayServingId].carbs * 4);
            tmpObj.calsProteins = round(_historyServings[singleDayServingId].proteins * 4);
            tmpObj.fats = getHeightForGraph(tmpObj.calsFats, highestCalorieCountOfLast7Days, graphMaxHeight);
            tmpObj.carbs = getHeightForGraph(tmpObj.calsCarbs, highestCalorieCountOfLast7Days, graphMaxHeight);
            tmpObj.proteins = getHeightForGraph(tmpObj.calsProteins, highestCalorieCountOfLast7Days, graphMaxHeight);
        }
        setGraphDivValues((8 - j), tmpObj, graphMaxHeight);
    }

    if (highestCalorieCountOfLast7Days > 0) {
        $("#calorieIndex p").each(function () {
            $(this).html(highestCalorieCountOfLast7Days);
            highestCalorieCountOfLast7Days -= singleIncrementUnit;
        });
    } else {
        $("#graphOldValuesDisplayer > div > p").html("No entries within last 7 days.");
    }
}

function setGraphDivValues(count, tmpObj, graphMaxHeight) {
    $("#myDopeTable > div:nth-of-type(" + count + ")").data("values", tmpObj);

    //sets graph heights
    $("#myDopeTable > div:nth-of-type(" + count + ") .fatsTable").css("height", tmpObj.fats + "px");
    $("#myDopeTable > div:nth-of-type(" + count + ") .carbsTable").css("height", tmpObj.carbs + "px");
    $("#myDopeTable > div:nth-of-type(" + count + ") .proteinsTable").css("height", tmpObj.proteins + "px");


    $("#myDopeTable > div:nth-of-type(" + count + ") .fatsTable p:first-of-type").html((tmpObj.fats > 8 ? tmpObj.calsFats : "")); //min height of 8px for each block for calories text to fit in, otherwise hide
    $("#myDopeTable > div:nth-of-type(" + count + ") .carbsTable p:first-of-type").html((tmpObj.carbs > 8 ? tmpObj.calsCarbs : ""));
    $("#myDopeTable > div:nth-of-type(" + count + ") .proteinsTable p:first-of-type").html((tmpObj.proteins > 8 ? tmpObj.calsProteins : ""));


    $("#myDopeTable > div:nth-of-type(" + count + ") .fatsTable p:last-of-type").html((tmpObj.fats > 23 ? parseFloat((tmpObj.calsFats / 9).toFixed(2)) + "g" : ""));//if height greater than 23px then can fit grams under calories
    $("#myDopeTable > div:nth-of-type(" + count + ") .carbsTable p:last-of-type").html((tmpObj.carbs > 23 ? parseFloat((tmpObj.calsCarbs / 4).toFixed(2)) + "g" : ""));
    $("#myDopeTable > div:nth-of-type(" + count + ") .proteinsTable p:last-of-type").html((tmpObj.proteins > 23 ? parseFloat((tmpObj.calsProteins / 4).toFixed(2)) + "g" : ""));


}

function getHeightForGraph(macroCalories, maxGraphCalories, graphHeightAtMaxGraphCalories) {
    //passing:
    //macroCalories, which is fats, proteins of carbs in calories
    //maxGraphCalories, which is x (3500 on default)
    //graphHeightAtMaxGraphCalories, which is 200px for 3500 on default
    return (macroCalories * 100 / maxGraphCalories) / 100 * graphHeightAtMaxGraphCalories;
}

function getHighestTotalMacrosFromLast7Days() {
    var totalMacroIdsToCheck = [];
    for (let j = 1; j < 8; j++) {
        let singleDayServingId = window.returnKeyFromDate(returnPastDate(j));

        if (_historyServings.hasOwnProperty(singleDayServingId)) {
            totalMacroIdsToCheck.push(_historyServings[singleDayServingId].totalMacrosId);
        }
    }
    var maxTotalMacros = 0;

    for (let j = 0; j < totalMacroIdsToCheck.length; j++) {
        if (_historyTotalMacros.hasOwnProperty(totalMacroIdsToCheck[j])) {
            if (!_historyTotalMacros[totalMacroIdsToCheck[j]].hasOwnProperty(calculateCalories)) {
                //object does not have reference to calculateClaories
                _historyTotalMacros[totalMacroIdsToCheck[j]].calculateCalories = calculateCalories;
            }

            if (maxTotalMacros < _historyTotalMacros[totalMacroIdsToCheck[j]].calculateCalories()) {
                maxTotalMacros = _historyTotalMacros[totalMacroIdsToCheck[j]].calculateCalories();
            }
        }

    }

    return Math.round(maxTotalMacros);
}

$(document).on("click", "#myDopeTable > div", function () {
    if ($(this).attr("data-selected") == "open") {
        $(this).removeAttr("data-selected");

        $("#graphOldValuesDisplayer > div").slideUp(250, function () {
            $("#graphOldValuesDisplayer > div > p").show();
            $("#graphOldValuesDisplayer > div > div.row").hide();
            $("#graphOldValuesDisplayer > div").slideDown(250);
        });
    } else {
        $("#myDopeTable > div[data-selected='open']").removeAttr("data-selected");
        $(this).attr("data-selected", "open");
        let calories = {
            carbs: parseFloat((parseFloat($(this).data("values").calsCarbs) / 4).toFixed(2)),
            proteins: parseFloat((parseFloat($(this).data("values").calsProteins) / 4).toFixed(2)),
            fats: parseFloat((parseFloat($(this).data("values").calsFats) / 9).toFixed(2)),
            calories: calculateCalories
        };

        $("#graphOldValuesDisplayer > div").slideUp(250, function () {
            $("#graphOldValuesDisplayer > div > p").hide();

            $("#graphOldValuesDisplayer > div > div.row > div:nth-of-type(1) > p > span").html(Math.round(calories.calories()));
            $("#graphOldValuesDisplayer > div > div.row > div:nth-of-type(2) > p:last-of-type").html(calories.fats + "g");
            $("#graphOldValuesDisplayer > div > div.row > div:nth-of-type(3) > p:last-of-type").html(calories.carbs + "g");
            $("#graphOldValuesDisplayer > div > div.row > div:nth-of-type(4) > p:last-of-type").html(calories.proteins + "g");

            $("#graphOldValuesDisplayer > div > div.row").show();
            $("#graphOldValuesDisplayer > div").slideDown(250);
        });
    }

});


function doesNotExist(item, checkIfEmptyObject = true) {
    return (item === null || typeof item == "undefined" || (checkIfEmptyObject && item.length <= 2));//null is primitive type but typeof returns Object (a JS unsolvable bug)
}
//remove after publish
function countObjectItems(obj) {
    let i = 0;
    for (let key in obj)
        if (hasOwnProperty.call(obj, key))
            i++;

    return i;
}

$(document).on("click", "#header > h1", function () {
    localStorage.clear();
});


//WORKOUT SECTION


function checkHistoryWorkouts(date) {
    var displayDate = getDisplayDate(date);
    $("#dayWorkoutsShownFor").html(displayDate).data("date", date);
    if (_historyWorkouts.length > 0) {
        alert("ok CHANGE SHIT FAM!");
    }
}

$(document).on("click", "#menuHistoryWorkouts #menu-left", function () {
    console.log("date", $("#dayWorkoutsShownFor").data("date"));
    var date = returnPastDate(1, $("#dayWorkoutsShownFor").data("date"));
    $("#dayWorkoutsShownFor").html(getDisplayDate(date)).data("date", date);
    if ($("#menuHistoryWorkouts #menu-right").hasClass("hidden")) {
        var currentDate = returnPastDate(1); //yesterday date not current
        if (new Date(date.getFullYear(), date.getMonth(), date.getDate()) < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()))
            $("#menuHistoryWorkouts #menu-right").removeClass("hidden");
    }

    updateOldWorkoutSection(date);

});

$(document).on("click", "#menuHistoryWorkouts #menu-right", function () {
    if (!$(this).hasClass("hidden")) {
        var date = returnPastDate(1, $("#dayWorkoutsShownFor").data("date"), false)
        $("#dayWorkoutsShownFor").html(getDisplayDate(date)).data("date", date);
        var currentDate = returnPastDate(1); //yesterday date not current
        if (new Date(date.getFullYear(), date.getMonth(), date.getDate()) >= new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()))
            $(this).addClass("hidden");

        updateOldWorkoutSection(date);
    }
});

function updateOldWorkoutSection(date) {
    console.log(date);
}

function loadWorkoutsForToday() {
    let todayDate = window.returnKeyFromDate(new Date());
    $("#workoutsToday").empty();
    if (_historyWorkouts.hasOwnProperty(todayDate)) {
        //check if for TODAY there is any workouts saved already, if soooo load them!
        var div = "";
        let indexCounter = 0;
        for (var singleExercise of _historyWorkouts[todayDate]) {//assume array of singleExercises
            let setsDiv = "";
            let totalVolumeDiv = "";
            let totalVolume = 0;
            div += `<div class="individualExercise noselect margin-bottom-15">
                <div class="workoutHeader">
                    <h3 class="margin-0">`+ _exercises[singleExercise.exerciseID].name + `</h3>
                    <span id="deleteExerciseBtn" class="fas fa-times" data-exercise-details='`+ JSON.stringify({ exerciseID: singleExercise.exerciseID, exerciseIndex: indexCounter, date: todayDate }) + `'></span>
                </div>
                <div class="workoutContent" data-empty="`+ (singleExercise.set.length == 0 ? "true" : "false") + `" data-id='` + singleExercise.exerciseID + `' ">
                    <!-- start sets -->
                    ` + (singleExercise.set.length == 0 ? "" : "#SETS#") + `
                    <!-- last div of type set have border bottom and data-attribute for total weight -->
                    <div class="addSet">
                        <span data-array-index='`+ indexCounter + `' data-id='` + singleExercise.exerciseID + `'  class="addSetBtn fas fa-plus-square"></span>
                        `+ (singleExercise.set.length == 0 ? '<p class="noSets">No sets added yet.</p>' : "") + `                    
                    </div>
                    ` + (singleExercise.set.length == 0 ? "" : "#TOTALVOLUME#") + `
                    <hr class='fancySeparator'>
                    <div class='workoutHistory'>
                        <hr class='fancySeparator'>              
                    </div>
                    <div class='historyButtonWrapper'><p data-date='`+ todayDate + `' data-id='` + singleExercise.exerciseID + `'>View History</p></div>
                </div>
            </div>`;

            if (singleExercise.set.length > 0) {
                setsDiv += "<div class='setsTable'>";
                let setIndexCounter = 0;
                for (var set of singleExercise.set) {//array of sets
                    setsDiv += `<div class="set" data-set-details='` + JSON.stringify({ date: todayDate, exerciseIndex: indexCounter, setIndex: setIndexCounter++ }) + `' data-record="` + (checkForRecord(singleExercise.exerciseID, todayDate, indexCounter, setIndexCounter) == true ? "visible" : "invisible") + `" data-has-note="` + (set.note.length > 0 ? "true" : "false") + `"` + (set.note.length > 0 ? ` data-note='` + set.note + `'` : "") + `>
                        <div class="recordSection">
                            <div data-set-index='`+ setIndexCounter +`'></div>
                            <span class="fas fa-trophy"></span>
                            <span class="fas fa-comment-dots"></span>
                        </div>
                        <div class="weightSection">
                           <div><p>` + set.weight + `</p></div>
                           <div><p>` + set.reps + `</p></div>
                        </div>
                    </div>`;
                    totalVolume += parseFloat(set.weight) * set.reps;
                }
                setsDiv += "</div>";
            }

            //sdasd
            totalVolumeDiv = `<div class="totalVolume">
                            <p><span>`+ round(totalVolume) + ` kg</span></p>
                        </div>`;

            div = div.replace("#SETS#", setsDiv).replace("#TOTALVOLUME#", totalVolumeDiv);
            indexCounter++;
        }
        $("#workoutsToday").append(div);
        $("#exercisesMsg").addClass("hidden");
    } else {
        //no workouts for today
        $("#exercisesMsg").removeClass("hidden");
    }
}

function checkForRecord(exerciseID, date, exerciseIndex, setId, deleteFound = false) {
    if (_exercises[exerciseID].record.length > 0) {
        let recordIndex = 0;
        for (let record of _exercises[exerciseID].record) {//of used to access the array items dirrectly instead of getting the item index and then using that to get value from array, although ironically i am using a personal index counter to delete the array item lol
            if (record.where.date == date &&
                record.where.exerciseIndex == exerciseIndex &&
                record.where.setId == setId) {
                if (deleteFound) {
                    _exercises[exerciseID].record.splice(recordIndex, 1);
                    saveExercises();
                }
                return true;
            }
            recordIndex++;
        }
    }
    return false;
}

$(document).on("click", "#addSetToExercise", function () {
    var exerciseID = $("#alertBg").data("exerciseId");
    var singleExerciseIndex = $("#alertBg").data("arrayIndex");
    var todayDate = window.returnKeyFromDate(new Date());
    var weight = $("#kgCount").val();
    var reps = $("#repCount").val();
    if (weight.length > 0 && parseFloat(weight) > 0 && reps.length > 0 && parseFloat(reps) > 0) {
        $(".errorMsg").slideUp();
        if (weight.indexOf(".") == -1)
            weight = round(weight).toFixed(1);

        window.addSet.apply(_historyWorkouts[todayDate][singleExerciseIndex], [weight, reps, $("#setAddSet textarea").val()]);
        saveHistoryWorkouts();
        setRecords(exerciseID, weight, reps, todayDate, singleExerciseIndex, (_historyWorkouts[todayDate][singleExerciseIndex].set.length - 1));
        closeAlert();
        loadWorkoutsForToday();
    } else {
        $(".errorMsg").slideDown(300);
    }
});

function setRecords(exerciseID, weight, reps, todayDate, singleExerciseIndex, setId) {
    //if no record for exercise, set one immediatelly
    if (_exercises[exerciseID].record.length == 0) {
        _exercises[exerciseID].record = [new record(weight, reps, todayDate, singleExerciseIndex, setId)];
        saveExercises();
        return true;
    } else {
        //array of records to check
        let isRecord = true;
        for (let i in _exercises[exerciseID].record) {
            if (round(_exercises[exerciseID].record[i].weight) >= round(weight) && round(_exercises[exerciseID].record[i].reps) >= round(reps)) {
                isRecord = false;
                break;
            }
        }
        if (isRecord) {
            let indexToRemove = [];
            for (let i = _exercises[exerciseID].record.length - 1; i >= 0; i--) {//add indexes back to forth so splice does not fuck up the order
                if (round(_exercises[exerciseID].record[i].weight) <= round(weight) && round(_exercises[exerciseID].record[i].reps) <= round(reps))
                    _exercises[exerciseID].record.splice(i, 1);;
            }

            _exercises[exerciseID].record.push(new record(weight, reps, todayDate, singleExerciseIndex, setId));
            saveExercises();
            return true;
        }
    }
    return false;
}

$(document).on("click", "#addWorkoutBtn", function () {
    addNewExercise();
});

//separate function in order for lastAlertOpened to be able to fire it for re-opening automatically when sub-alert is closed
function addNewExercise() {
    //show msgbox for new workout
    var options = (Object.keys(_exercises).length == 0 ? "" : (function () {
        var o = "";
        for (let category of _exerciseCategories) {
            let tmpHtml = `<div data-category-name='` + category.obj.title + `'>`;
            let foundExerciseForCategory = false;
            for (let property of _exercises) {
                if (property.obj.categoryID == category.relativeKey) {
                    tmpHtml += `<div class='workoutEntry' data-values='` + JSON.stringify(property.obj) + `'>
                    <div><p>` + property.obj.name + `
                    </p></div><p class='deleteWorkout' data-exercise-id='`+ property.obj.exerciseID + `'><span class='glyphicon glyphicon-trash'></span></p>
                    </div>`;
                    foundExerciseForCategory = true;
                }
            }

            if (foundExerciseForCategory)
                o += tmpHtml + `</div>`;
        }
        return o;
    }));
    var hidden1 = "hidden";
    var hidden2 = "hidden";
    if (Object.keys(_exercises).length == 0) {
        hidden2 = "";
    } else {
        hidden1 = "";
    }
    alertMsgToAppend("addNewExercise", true, ["HIDDEN1", "HIDDEN2", "OPTIONS"], [hidden1, hidden2, options]);
}

//creation key var highestKey = parseFloat(Object.keys(_exercises)[Object.keys(_exercises).length - 1]) + 1;
$(document).on("click", ".workoutEntry > div", function () {
    var exercise = new singleExercise($(this).parent().data("values").exerciseID);
    var todayDate = window.returnKeyFromDate(new Date());
    if (_historyWorkouts.hasOwnProperty(todayDate)) {
        let exerciseExistsAlready = false;
        for (let singleExercise of _historyWorkouts[todayDate]) {
            if (singleExercise.exerciseID == exercise.exerciseID) {
                exerciseExistsAlready = true;
                break;
            }
        }
        if (!exerciseExistsAlready) {
            _historyWorkouts[todayDate].push(exercise);
            saveHistoryWorkouts();
            loadWorkoutsForToday();
            closeAlert();
        }
        else {
            alertMsgToAppend("miniAlert", true, ["TOPIDHERE", "MESSAGEID", "MSG", "IDOFYESBTN", "IDOFNOBTN", "YESMESG", "NOMESG"], ["addExistingExercise", "titleForDelete", "<span>" + _exercises[exercise.exerciseID].name + "</span> has already been added for today, add again?", "yesAddExerciseAgain", "noDoNotAddExerciseAgain", "Yes", "No"], [{ attrName: "exerciseId", attrValue: exercise.exerciseID }]);
        }
    } else {
        _historyWorkouts[todayDate] = [exercise];
        saveHistoryWorkouts();
        loadWorkoutsForToday();
        closeAlert();
    }
});

$(document).on("click", ".deleteWorkout", function () {
    var exerciseID = $(this).data("exerciseId");
    //continue here
    alertMsgToAppend("miniAlert", true, ["TOPIDHERE", "MESSAGEID", "MSG", "IDOFYESBTN", "IDOFNOBTN", "YESMESG", "NOMESG"], ["deleteFromWorkoutsConfirm", "titleForDelete", "Delete <span>" + _exercises[exerciseID].name + "</span> from exercises?", "removeFromWorkouts", "cancelRemoveFromWorkouts", "Delete", "Cancel"], [{ attrName: "exerciseId", attrValue: exerciseID }]);
});

$(document).on("click", "#cancelRemoveFromWorkouts, #noDoNotAddExerciseAgain, #cancelExerciseChanges", function () {
    previousAlertToShow.createExercise();
});

$(document).on("click", "#yesAddExerciseAgain", function () {
    var exercise = new singleExercise($("#alertBg").data("exerciseId"));
    var todayDate = window.returnKeyFromDate(new Date());
    _historyWorkouts[todayDate].push(exercise);
    $("#deleteFromWorkoutsConfirm").addClass("hidden");
    saveHistoryWorkouts();
    loadWorkoutsForToday();
    closeAlert();
});

$(document).on("click", "#removeFromWorkouts", function () {
    var exerciseIDToDelete = $("#alertBg").data("exerciseId");
    if (Object.keys(_historyWorkouts).length > 0) {
        //from all the previous workouts ever, remove from each daily array of workouts the exercise that was deleted. Delete the entire workout of the day if no other exercises are on that day.
        var notFound = true;
        while (notFound) {
            notFound = false;
            for (let singleExerciseArray of _historyWorkouts) {
                for (let singleExercise of singleExerciseArray.obj) {
                    if (singleExercise.exerciseID == exerciseIDToDelete) {
                        singleExerciseArray.obj.splice(singleExerciseArray.obj.indexOf(singleExercise), 1);
                        notFound = true;
                    }
                }
                if (singleExerciseArray.obj.length == 0)
                    delete _historyWorkouts[singleExerciseArray.relativeKey];
            }
        }
        saveHistoryWorkouts();
    }
    delete _exercises[exerciseIDToDelete];
    $(".workoutEntry").each(function () {
        if ($(this).data("values").exerciseID == exerciseIDToDelete)
            $(this).remove();
    });

    if ($(".workoutEntry").length == 0) {
        $("#exerciseNoMsg").removeClass("hidden");
        $("#exerciseSelect").addClass("hidden");
    }

    saveExercises();
    loadWorkoutsForToday();
    previousAlertToShow.createExercise();
});

function saveExercises() {
    //save exercises to localstorage here
    localStorage.setItem("_exercises", JSON.stringify(_exercises));
}

function saveCategories() {
    //save exercise categories to localstorage here
    localStorage.setItem("_exerciseCategories", JSON.stringify(_exerciseCategories));
}

function saveHistoryWorkouts() {
    localStorage.setItem("_historyWorkouts", JSON.stringify(_historyWorkouts));
}

//On close of alert with name of key, open alert in value
var previousAlertToShow = {
    createExercise: addNewExercise,
    newCategory: createNewExercise,
    deleteFavorite: loadServing,
    deleteSet: editSet
};

$(document).on("click", "#saveNewExercise", function () {
    var exerciseName = $("#exerciseName").val().trim();
    if (exerciseName.length > 0) {
        $(".errorMsg").slideUp();
        var newId = exerciseName.length;
        while (true) {
            newId++;
            if (!_exercises.hasOwnProperty(newId))
                break;
        }
        var notes = $("#description").val().trim();
        var categoryId = $("input[name='category'][type='radio']:checked").val()
        _exercises[newId] = new exercise(newId, exerciseName, notes, categoryId);
        saveExercises();
        previousAlertToShow.createExercise();
    } else {
        $(".errorMsg").slideDown(300);
    }
});

$(document).on("click", "#cancelNewExercise", function () {
    previousAlertToShow.createExercise();
});

$(document).on("click", "#cancelNewCategory, #cancelCategoryChanges, #cancelDeleteCategory", function () {
    previousAlertToShow.newCategory();
});

$(document).on("click", "#createNewExercise", function () {
    createNewExercise();
})

function createCategoryRows(checkSpecificCategory = false, categoryIdToCheck = 0, enableEditing = true) {
    var categoryRows = "";
    if (Object.keys(_exerciseCategories).length > 0) {
        var isFirstRow = true;
        for (let exerciseCategory of _exerciseCategories) {
            categoryRows += `<tr class='optionCategory' data-category='` + JSON.stringify(exerciseCategory) + `' data-editing-enabled='` + JSON.stringify(enableEditing) + `'>
                        <td>
                            <div class='position-relative'>
                                <input value='` + exerciseCategory.relativeKey + `' type="radio" name="category" ` + (checkSpecificCategory ? (exerciseCategory.relativeKey == categoryIdToCheck ? "checked" : "") : (isFirstRow ? "checked" : "")) + `>
                                <h3>` + exerciseCategory.obj.title + `</h3>
                            </div>
                            <p>`+ exerciseCategory.obj.description + `</p>
                        </td>
                    </tr>`;
            isFirstRow = false;
        }
    } else {
        categoryRows += `<tr>
                <td class='optionCategory'><h3>No categories created yet.</h3></td>
                    </tr>`;
    }
    return categoryRows;
}

function createNewExercise() {
    alertMsgToAppend("createExercise", true, ["<!--CATEGORYOPTIONS-->"], [createCategoryRows()]);
}

$(document).on("click", "#addNewCategory", function () {
    alertMsgToAppend("multiPurposeAlert", true, ["TITLEAREA", "TITLEHERE", "PLACEHOLDERTITLE", "VALUETITLE", "SECONDHERE", "PLACEHOLDERNOTES", "VALUENOTES", "ERRORMSG", "SAVECHANGESBUTTON", "YESBTN", "CANCELCHANGESBUTTON", "NOBTN", "CLASS1", "CLASS2"], ["New Category", "Title", "Category Name", "", "Notes", "Optional", "", "The category must have a title before continuing.", "saveNewCategory", "Save Category", "cancelNewCategory", "Cancel", "", ""]);
});

$(document).on("click", "#saveNewCategory", function () {
    var categoryTitle = $("#inputFirst").val().trim();
    if (categoryTitle.length > 0) {
        $(".errorMsg").slideUp();
        var newId = categoryTitle.length;
        while (true) {
            newId++;
            if (!_exerciseCategories.hasOwnProperty(newId))
                break;
        }
        var notes = $("#inputSecond").val().trim();
        _exerciseCategories[newId] = new category(categoryTitle, (notes.length == 0 ? "-" : notes));
        saveCategories();
        previousAlertToShow.newCategory();
    } else {
        $(".errorMsg").slideDown(300);
    }
});

function setDefaultExercises() {
    _exercises = {
        0: new exercise(0, "Flat Dumbell Bench Press", "Lying on bench, use barbell to press and workout your chest.", 3)
    }
}
function setDefaultCategories() {
    _exerciseCategories = {
        0: { title: "Shoulders", description: "These are the exercises related to the shoulders." },
        1: { title: "Triceps", description: "These are the exercises related to the triceps." },
        2: { title: "Biceps", description: "These are the exercises related to the biceps." },
        3: { title: "Chest", description: "These are the exercises related to the chest." },
        4: { title: "Back", description: "These are the exercises related to the back." },
        5: { title: "Legs", description: "These are the exercises related to the legs." },
        6: { title: "Abs", description: "These are the exercises related to the abs." }
    };
}

$(document).on("input keydown focusout blur", "td.position-relative > input", function () {
    if ($(this).val().trim().length == 0) {
        $(this).parent().removeClass("hasValue");
    } else {
        $(this).parent().addClass("hasValue");
    }
});

$(document).on("click", ".optionCategory", function () {
    $(this).children().children().children("input[type='radio']").prop("checked", true);
});

//Hold optionCategory for edit
var holdTimer;
$(document).on("mousedown touchstart", ".optionCategory[data-editing-enabled='true']", function () {
    holdTimer = window.setTimeout(() => { //arrow function in ES6 does not follow normal function scope rules, it goes to its parent's scope for its this
        editOptionCategory($(this).data("category"));
    }, 1000);
});

$(document).on("mousedown touchstart", ".workoutEntry", function () {
    holdTimer = window.setTimeout(() => {
        editWorkoutEntry($(this).data("values"));
    }, 1000);
});

$(document).on("mouseup touchend", ".optionCategory[data-editing-enabled='true'], .workoutEntry, .favoriteEntry, .set", function () {
    if (holdTimer)
        window.clearTimeout(holdTimer);
});

function editOptionCategory(categoryObj) {
    var hasValue = "";
    if (categoryObj.obj.description.trim().length > 1)
        var hasValue = "hasValue";

    var deleteBtn = `<span id='deleteCategoryBtn' class='glyphicon glyphicon-trash' data-category='` + JSON.stringify(categoryObj) + `'></span>`;

    alertMsgToAppend("multiPurposeAlert", true, ["TITLEAREA", "TITLEHERE", "PLACEHOLDERTITLE", "VALUETITLE", "SECONDHERE", "PLACEHOLDERNOTES", "VALUENOTES", "ERRORMSG", "SAVECHANGESBUTTON", "YESBTN", "CANCELCHANGESBUTTON", "NOBTN", "CLASS1", "CLASS2", "<!--ADDITIONAL HTML-->"], ["Edit Category", "Title", "Category Name", categoryObj.obj.title, "Notes", "Optional", categoryObj.obj.description, "The category must have a valid title.", "saveCategoryChanges", "Save", "cancelCategoryChanges", "Cancel", "hasValue", hasValue, deleteBtn], [{ attrName: "categoryObj", attrValue: categoryObj }]);
}

$(document).on("click", "#deleteCategoryBtn", function () {
    var categoryObj = $(this).data("category");
    alertMsgToAppend("miniAlert", true, ["TOPIDHERE", "MESSAGEID", "MSG", "IDOFYESBTN", "IDOFNOBTN", "YESMESG", "NOMESG"], ["deleteFromWorkoutsConfirm", "titleForDelete", "Delete <span>" + categoryObj.obj.title + "</span> from exercise categories?", "yesDeleteCategory", "cancelDeleteCategory", "Delete", "Cancel"], [{ attrName: "categoryKey", attrValue: categoryObj.relativeKey }]);
});

$(document).on("click", "#yesDeleteCategory", function () {
    var key = $("#alertBg").data("categoryKey");
    delete _exerciseCategories[key];
    saveCategories();
    previousAlertToShow.newCategory();
});

function editWorkoutEntry(exerciseObj) {
    var hasValue = "";
    if (exerciseObj.comment.trim().length > 1)
        var hasValue = "hasValue";

    var categoryOptions = `<h3>Category:</h3>
    <div class="categoryTable">
        <table class="width-full">
            <tbody>
                `+ createCategoryRows(true, exerciseObj.categoryID, false) + `
            </tbody>
        </table>
    </div>`;

    alertMsgToAppend("multiPurposeAlert", true, ["TITLEAREA", "TITLEHERE", "PLACEHOLDERTITLE", "VALUETITLE", "SECONDHERE", "PLACEHOLDERNOTES", "VALUENOTES", "ERRORMSG", "SAVECHANGESBUTTON", "YESBTN", "CANCELCHANGESBUTTON", "NOBTN", "CLASS1", "CLASS2", "<!--ADDITIONAL HTML-->"], ["Edit Exercise", "Title", "Exercise Name", exerciseObj.name, "Notes", "Optional", exerciseObj.comment, "The exercise must have a valid title.", "saveExerciseChanges", "Save", "cancelExerciseChanges", "Cancel", "hasValue", hasValue, categoryOptions], [{ attrName: "exerciseObj", attrValue: exerciseObj }]);
}


$(document).on("click", "#saveCategoryChanges", function () {
    var title = $("#inputFirst").val().trim();
    var notes = $("#inputSecond").val().trim();
    var categoryObj = $("#alertBg").data("categoryObj");
    if (title.length == 0) {
        $(".errorMsg").slideDown(300);
    } else {
        $(".errMsg").slideUp();
        _exerciseCategories[categoryObj.relativeKey] = new category(title, notes);
        saveCategories();
        previousAlertToShow.newCategory();
    }
});

$(document).on("click", "#saveExerciseChanges", function () {
    var title = $("#inputFirst").val().trim();
    var notes = $("#inputSecond").val().trim();
    var exerciseObj = $("#alertBg").data("exerciseObj");
    if (title.length == 0) {
        $(".errorMsg").slideDown(300);
    } else {
        $(".errMsg").slideUp();
        _exercises[exerciseObj.exerciseID].comment = notes;
        _exercises[exerciseObj.exerciseID].name = title;
        _exercises[exerciseObj.exerciseID].categoryID = $("input[type='radio'][name='category']:checked").val();
        saveExercises();
        previousAlertToShow.createExercise();
    }
});

$(document).on("click", ".addSetBtn", function () {
    var exerciseID = $(this).data("id");
    alertMsgToAppend("addSet", true, ["VALUETITLE"], ["Add Set"], [{ attrName: "exerciseId", attrValue: exerciseID }, { attrName: "arrayIndex", attrValue: $(this).data("arrayIndex") }]);
});

$(document).on("click", ".btnMinus, .btnPlus", function () {
    var inputSibling = $(this).siblings("input");
    var input = inputSibling.val();

    if (input.length == 0) {
        input = 0;
    } else {
        input = parseFloat(input);
    }

    if ($(this).hasClass("btnMinus")) {//minus
        if (inputSibling.attr("id") == "kgCount") {
            if (input > 2.5) {
                input -= 2.5;
            } else {
                input = 0;
            }
            input = input.toFixed(2);
            if (input.lastIndexOf("0") == input.length - 1)
                input = parseFloat(input).toFixed(1);

        } else {
            if (input > 1) {
                input--;
            } else {
                input = 0;
            }
            input = parseInt(input);
        }
    } else {
        if (inputSibling.attr("id") == "kgCount") {
            input += 2.5;
            input = input.toFixed(2);
            if (input.lastIndexOf("0") == input.length - 1)
                input = parseFloat(input).toFixed(1);
        } else {
            input++;
            input = parseInt(input);
        }
    }

    inputSibling.val(input);
    if (!inputSibling.parent().hasClass("hasValue"))
        inputSibling.parent().addClass("hasValue");
});

$(document).on("input", "#repCount", function () {
    $(this).val(parseInt($(this).val()));
});

$(document).on("click", ".set[data-has-note='true']", function () {
    alertMsgToAppend("multiPurposeAlert", true, ["TITLEAREA", "TABLEMULTIPURPOSE", "<!--ADDITIONAL HTML-->", "SAVECHANGESBUTTON", "YESBTN", "CANCELCHANGESBUTTON", "NOBTN"],
        ["Edit Comment", "hidden", "<textarea class='width-full margin-top-5'>" + $(this).data("note") + "</textarea>", "saveNoteChanges", "Save", "cancelNoteChanges", "Cancel"], [{ attrName: "setDetails", attrValue: $(this).data("setDetails") }]);
});

$(document).on("click", "#saveNoteChanges", function () {
    var setDetails = $("#alertBg").data("setDetails");
    var newNote = $("#alertBg textarea").val().trim();
    _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].note = newNote;
    saveHistoryWorkouts();
    if (newNote.length > 0) {
        $(".set[data-set-details='" + JSON.stringify(setDetails, Object.keys(setDetails).sort()) + "']").data("note", newNote); //JSON could not stringify following property order as declared, so force it so follow alphabetical order of properties
    } else {
        $(".set[data-set-details='" + JSON.stringify(setDetails, Object.keys(setDetails).sort()) + "']").attr("data-note", "").attr("data-has-note", false); //this way a unique identifier is created from the details object and can be used to easily query the DOM
    }
    closeAlert();
});

$(document).on("mousedown touchstart", ".set", function () {
    holdTimer = window.setTimeout(() => {
        editSet($(this).data("setDetails"));
    }, 1000);
});

function editSet(setDetails) {
    alertMsgToAppend("addSet", true, ["VALUETITLE", '"0.0"', 'value="0"', '</textarea>', "Add Set", "addSetToExercise", "<!--OPTIONALHTML-->"],
        ["Edit Set", '"' + _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].weight + '"', 'value="' + _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].reps + '"', _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].note + "</textarea>", "Save Set", "saveEditedSet", `<span id="deleteSetBtn" class="glyphicon glyphicon-trash" data-set-details='` + JSON.stringify(setDetails) + `'></span>`],
        [{ attrName: "setDetails", attrValue: setDetails }]);
}

$(document).on("click", "#saveEditedSet", function () {
    var setDetails = $("#alertBg").data("setDetails");
    var setFromDOM = $(".set[data-set-details='" + JSON.stringify(setDetails, Object.keys(setDetails).sort()) + "']");
    var changed = false;
    var notesChanged = false;
    if (_historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].weight != $("input#kgCount").val().trim()) {
        changed = true;
        _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].weight = $("input#kgCount").val().trim();
        setFromDOM.children("td:nth-child(2)").children("span").first().html(_historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].weight);
    }

    if (_historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].reps != $("input#repCount").val().trim()) {
        changed = true;
        _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].reps = $("input#repCount").val().trim();
        setFromDOM.children("td:nth-child(3)").children("span").first().html(_historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].reps);
    }


    if (_historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].note != $("#alertBg textarea").val().trim()) {
        notesChanged = true;
        _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].note = $("#alertBg textarea").val().trim();
        setFromDOM.attr("data-has-note", (_historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].note.length > 0 ? true : false)).attr("data-note", _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set[setDetails.setIndex].note);
    }

    if (changed || notesChanged)
        saveHistoryWorkouts();

    if (changed) {
        //if the edited set was a record set, then delete it from the records of that exercise
        checkForRecord(_historyWorkouts[setDetails.date][setDetails.exerciseIndex].exerciseID, setDetails.date, setDetails.exerciseIndex, setDetails.setIndex, true);

        //once deleted update all other record sets for that exercise
        updateRecords(_historyWorkouts[setDetails.date][setDetails.exerciseIndex].exerciseID);

        loadWorkoutsForToday();
    }
    closeAlert();
});

$(document).on("click", "#cancelNoteChanges", function () {
    closeAlert();
});

$(document).on("click", "#deleteSetBtn", function () {
    alertMsgToAppend("miniAlert", true, ["MSG", "IDOFYESBTN", "IDOFNOBTN", "YESMESG", "NOMESG"],
        ["Are you sure you want to delete the set?", "confirmDeleteSetBtn", "cancelDeleteSet", "Delete", "Cancel"], [{ attrName: "setDetails", attrValue: $(this).data("setDetails") }]);
});

$(document).on("click", "#cancelDeleteSet", function () {
    previousAlertToShow.deleteSet($("#alertBg").data("setDetails"));
});

$(document).on("click", "#confirmDeleteSetBtn", function () {
    deleteSets([$("#alertBg").data("setDetails")]);
    loadWorkoutsForToday();
    closeAlert();
});
//setRecords(exerciseID, weight, reps, todayDate, singleExerciseIndex, setId).
//Keep sets array related to one exercise at a time!
function deleteSets(sets) {
    let c = 0;

    for (let setDetails of sets) {
        //delete sets from _historyWorkouts
        _historyWorkouts[setDetails.date][setDetails.exerciseIndex].set.splice(setDetails.setIndex, 1);//Delete set!

        //delete set from records if it is a record set
        checkForRecord(_historyWorkouts[setDetails.date][setDetails.exerciseIndex].exerciseID, setDetails.date, setDetails.exerciseIndex, setDetails.setIndex, true);

        if (++c == sets.length) //update all other record sets for that exercise
            updateRecords(_historyWorkouts[setDetails.date][setDetails.exerciseIndex].exerciseID);
    }

    saveExercises();
    saveHistoryWorkouts();
}

//used to loop through all specific exercise sets ever imported and re-set the records
function updateRecords(exerciseID) {
    for (let dayWorkout in _historyWorkouts) {
        let singleExerciseIndex = 0;
        for (let exercise of _historyWorkouts[dayWorkout]) {
            let setCounter = 0;
            if (exercise.exerciseID == exerciseID)
                for (let set of exercise.set)
                    setRecords(exerciseID, set.weight, set.reps, dayWorkout, singleExerciseIndex, setCounter++);

            singleExerciseIndex++;
        }
    }
}

$(document).on("click", "#deleteExerciseBtn", function () {
    alertMsgToAppend("miniAlert", true, ["MSG", "IDOFYESBTN", "IDOFNOBTN", "YESMESG", "NOMESG"],
        ["Are you sure you want to delete these records?", "confirmDeleteExerciseBtn", "cancelDeleteExercise", "Delete", "Cancel"], [{ attrName: "exerciseDetails", attrValue: $(this).data("exerciseDetails") }]);
});

$(document).on("click", "#confirmDeleteExerciseBtn", function () {
    var exerciseDetails = $("#alertBg").data("exerciseDetails");
    deleteExercise(exerciseDetails);
    loadWorkoutsForToday();
    closeAlert();
});

function deleteExercise(exerciseDetails) {
    var formattedSetsObject = _historyWorkouts[exerciseDetails.date][exerciseDetails.exerciseIndex].set.map(x => {
        let obj = {};
        for (let property of Object.keys(x)) {
            obj[property] = x[property];
            obj["exerciseIndex"] = exerciseDetails.exerciseIndex;
            obj["date"] = exerciseDetails.date;
        }
        return obj;
    });

    deleteSets(formattedSetsObject);
    console.log(_historyWorkouts[exerciseDetails.date][exerciseDetails.exerciseIndex]);
    //if other exercises have records for the day on which you delete an exercise then update their
    _historyWorkouts[exerciseDetails.date].splice(exerciseDetails.exerciseIndex, 1);
    saveHistoryWorkouts();
}