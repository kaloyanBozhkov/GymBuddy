
'use strict'
$(document).ready(function () {
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
    preloadAlerts();
});


function preloadAlerts() { //pre loads all possible message boxes, so that in real time there is no delay when reading from disk
    for (let j = 0; j < _alerts.length; j++) {
        $.get("alerts/" + _alerts[j] + ".html", function (data) {
            _msgBox[_alerts[j]] = data;
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

function loadContent(what) {
    if (what !== "none") {
        _originalBodyContent = $("#body").html();    
        $.get(what+".html", function (data) {
            $("#body").empty().append(data);
            pushTopAnimation("#pushContent", what);
            if (what == "macros") {
                updateBarWidths();
                var d = returnPastDate(1);
                checkHistoryServings(d.getDay(), d.getDate(), d.getMonth() + 1, d.getFullYear());
                updateOldBarWidths(d);
                loadWeeklyStatsGraph();
                localStorage.setItem("lastOpened", "macros");
            } else {//workouts
                localStorage.setItem("lastOpened", "workouts");
            }
        });
    } else {
        $("#pushContent").animate({
            "opacity" : "0"
        }, 200, function () {
            $("#body").empty().append(_originalBodyContent.replace("parent", "parent opacity-0"));
            $("#body .opacity-0").animate({
                "opacity" : "1"
            }, 200);
            localStorage.removeItem("lastOpened");
        });
    }

}

function pushTopAnimation(element, what) {
    $(element).animate({
        "top": "0",
        "opacity" : "1"
    }, 1000);
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
                </div><div><div class='saveEntry' title='ATTRNAME' carbs='ATTRCARBS' fats='ATTRFATS' proteins='ATTRPROTEINS' grams='ATTRGRAMS'>
                        <span class='glyphicon glyphicon-heart'></span>
                    </div>
                    `+ (entriesContainer == "#entriesContainer" ? `
                    <div class='removeEntry' itemId='ATTRID'>
                        <span class='glyphicon glyphicon-trash'></span>
                    </div>` : "") +`
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
             let calories = round((parseFloat(item.fats) * 9) + (parseFloat(item.carbs) + parseFloat(item.proteins)) * 4 * parseFloat(item.servingQuantity));
             let proteins = round(parseFloat(item.proteins) * parseFloat(item.servingQuantity));
             let carbs = round(parseFloat(item.carbs) * parseFloat(item.servingQuantity));
             let fats = round(parseFloat(item.fats) * parseFloat(item.servingQuantity));
             if (entriesContainer == "#entriesContainer"){
                 $(entriesContainer).append(singleServingEntryDiv.replace("FOODNAME", item.itemName).replace("TIME", item.hour + ":" + item.minutes).replace("HIDELAST", hideLast).replace("FATS", fats).replace("CARBS", carbs).replace("PROTEINS", proteins).replace("CALS", calories).replace("SERV", item.servingQuantity).replace("GRMS", item.servingSize).replace("ATTRID", j).replace("ATTRNAME", item.itemName).replace("ATTRCARBS", item.carbs).replace("ATTRFATS", item.fats).replace("ATTRPROTEINS", item.proteins).replace("ATTRGRAMS", item.servingSize));
             } else {
                 $(entriesContainer).append(singleServingEntryDiv.replace("FOODNAME", item.itemName).replace("TIME", item.hour + ":" + item.minutes).replace("HIDELAST", hideLast).replace("FATS", fats).replace("CARBS", carbs).replace("PROTEINS", proteins).replace("CALS", calories).replace("SERV", item.servingQuantity).replace("GRMS", item.servingSize).replace("ATTRNAME", item.itemName).replace("ATTRCARBS", item.carbs).replace("ATTRFATS", item.fats).replace("ATTRPROTEINS", item.proteins).replace("ATTRGRAMS", item.servingSize));
             }            
        }

    } else {
        $(entriesContainer).append("<div class='parent both-full'><div class='child'><p class='text-center width-full font-size-18'>"+msg+".</p></div></div>");
    }
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

$(document).on("change", ".displayMsgRadio", function () {
    $(".displayMsgRadio:not(#" + $(this).attr("id") + ")").prop("checked", false);
});

$(document).on("change", ".displayMsgRadio", function () {
    $(".displayMsgRadio:not(#" + $(this).attr("id") + ")").prop("checked", false);
});

$(document).on("click", ".textNextToRadioOnAlert", function () {
    if ($(this).html().trim().toLowerCase() == "grams") {
        $("#displayMessage #grams").prop("checked", true);
        $("#displayMessage #percentages").prop("checked", false);
    } else {
        $("#displayMessage #percentages").prop("checked", true);
        $("#displayMessage #grams").prop("checked", false);
    }
});


$(document).on("click", "#continueGoalSet", function () {
    var what = $(".displayMsgRadio:checked").val().substr(0, 1).toUpperCase() + $(".displayMsgRadio:checked").val().substr(1).toLowerCase();
    alertMsgToAppend("setGoals"+ what);
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
    localStorage.setItem("historyTotalMacros",JSON.stringify( _historyTotalMacros));
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
        $("#alertBg").attr(item["attrName"], item["attrValue"]);
    });

   
}

//Track Food Section 
$(document).on("input", "#foodName", function () {
    $(this).val(camelCaseInput($(this).val()));
});

function camelCaseInput(string) {
    var camel = "";
    var lastLetter = string.substr(string.length - 1) == " " ? " " : "";
    var x = string.trim().split(" ");
    var tmpSpace = "";
    for (var i = 0; i <= x.length - 1; i++) {
        if (i > 0) {
            tmpSpace = " ";
        }
        camel +=  tmpSpace + x[i].substr(0, 1).toUpperCase() + x[i].substr(1).toLowerCase();
    }
    return camel + lastLetter;
}

$(document).on("focusin", "#foodName", function () {
    $(this).attr("placeholder", "");
});

$(document).on("focusout", "#foodName", function () {
    $(this).attr("placeholder", "Type Food Name Here");
});

$(document).on("input", "#singleFoodCarbs input, #singleFoodProteins input, #singleFoodFats input, #singleFoodServingSize input", function () {
    $(this).val($(this).val().replace(",", ".").trim().match(/^\d*\.?\d*$/));
    if ($(this).val().trim() == ".")
        $(this).val("0.");
});

$(document).on("focusin", "#singleFoodCarbs input, #singleFoodProteins input, #singleFoodFats input, #singleFoodServingSize input", function () {
    if ($(this).val().trim() == "0")
        $(this).val("");
});

$(document).on("focusout", "#singleFoodCarbs input, #singleFoodProteins input, #singleFoodFats input, #singleFoodServingSize input", function () {
    if ($(this).val().trim().length <= 0)
        $(this).val("0");
});

$(document).on("click", "#addServing", function () {
    var serving = $("#singleFoodServingSize input").val().trim();
    if (_totalMacros.calculateCalories() > 0) {
        if (serving.length > 0 && serving !== "0") {
            var name = $("#foodName").val().trim().length > 0 ? $("#foodName").val().trim() : "Unnamed Entry";
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
    var serving = $("#alertBg").attr("servingSize");//grams
    var servingQuantity = $("#servingSize").val().trim();//servings
    var name = $("#foodName").val().trim().length > 0 ? $("#foodName").val().trim() : "Unnamed Entry";
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


function getDisplayDate(weekDay, month, day, year) {
    return window.dayNames[weekDay] + ", " + window.monthNames[month] + " " + day + ", " + year;
}

function checkHistoryServings(weekDay, day, month, year) {
    var displayDate = getDisplayDate(weekDay, month - 1, day, year);
    var date = day + "/" + month + "/" + year;
    $("#caloriesCounterHistory").removeClass("hidden");
    $("#dayEntriesShownFor").html(displayDate).attr("day", day).attr("month", month).attr("year", year);
    if (!doesNotExist(localStorage.getItem("historyTotalMacros"))) {
        _historyTotalMacros = JSON.parse(localStorage.getItem("historyTotalMacros"));
        console.log(_historyTotalMacros);
    }
}

function returnPastDate(daysToSubtract, startDate = "", subtract = true) {
    var d = (startDate.length > 0 ? new Date(startDate) : new Date());
    if (subtract == true)
        d.setDate(d.getDate() - daysToSubtract);
    else 
        d.setDate(d.getDate() + daysToSubtract);

    return d;
}

//Handle previous food entry display

$(document).on("mouseenter touchstart", "#menu-left, #menu-right", function () {
    $(this).addClass("btnHover");
});

$(document).on("mouseleave touchend", "#menu-left, #menu-right", function () {
    $(this).removeClass("btnHover");
});

$(document).on("click", "#menu-left", function () {
    var date = returnPastDate(1, $("#dayEntriesShownFor").attr("year") + "," + $("#dayEntriesShownFor").attr("month") + "," + $("#dayEntriesShownFor").attr("day"))
    $("#dayEntriesShownFor").html(getDisplayDate(date.getDay(), date.getMonth(), date.getDate(), date.getFullYear())).attr("year", date.getFullYear()).attr("month", date.getMonth() + 1).attr("day", date.getDate());
    if ($("#menu-right").hasClass("hidden")) {
        var currentDate = returnPastDate(1); //yesterday date not current
        if (date.getDate() < currentDate.getDate() && date.getMonth() == currentDate.getMonth() && date.getFullYear() == currentDate.getFullYear())
            $("#menu-right").removeClass("hidden");
    }

    updateOldBarWidths(date);

});

$(document).on("click", "#menu-right", function () {
    if(!$(this).hasClass("hidden")){
        var date = returnPastDate(1, $("#dayEntriesShownFor").attr("year") + "," + $("#dayEntriesShownFor").attr("month") + "," + $("#dayEntriesShownFor").attr("day"), false)
        $("#dayEntriesShownFor").html(getDisplayDate(date.getDay(), date.getMonth(), date.getDate(), date.getFullYear())).attr("year", date.getFullYear()).attr("month", date.getMonth() + 1).attr("day", date.getDate());
        var currentDate = returnPastDate(1); //yesterday date not current
        if (date.getDate() >= currentDate.getDate() && date.getMonth() == currentDate.getMonth() && date.getFullYear() == currentDate.getFullYear())
            $(this).addClass("hidden");

        updateOldBarWidths(date);
    }

});

function updateOldBarWidths(date) {
    var totalMacrosId = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
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
    alertMsgToAppend("addFavorites", true, ["VALUETITLE", "VALUEFATS", "VALUECARBS", "VALUEPROTEINS", "VALUEGRAMS"], [$(this).attr("title"), $(this).attr("fats"), $(this).attr("carbs"), $(this).attr("proteins"), $(this).attr("grams")]);
});

$(document).on("click", "#saveItemToFavorites", function () {
    $(".errorMsg").slideUp();
    if ($("#fatsCount").val().trim().length > 0 && $("#carbsCount").val().trim().length > 0 && $("#proteinsCount").val().trim().length > 0 && $("#gramsCount").val().trim().length > 0 && $("#itemName").val().trim().length > 0) {
        _favoriteItems.push(new favoriteItem($("#itemName").val().trim(), $("#gramsCount").val().trim(), $("#proteinsCount").val().trim(), $("#fatsCount").val().trim(), $("#carbsCount").val().trim()));
        localStorage.setItem("favorites", JSON.stringify(_favoriteItems));
        closeAlert();
    } else {
        $(".errorMsg").slideDown(300);
    }
});

$(document).on("click", "#loadServing", function () {
    var options = (_favoriteItems.length == 0 ? "" : (function () { 
        var o = "";
        for (let j in _favoriteItems) {
            o += `<div class='favoriteEntry' title="` + _favoriteItems[j].title + `" carbs='` + _favoriteItems[j].carbs + `' fats='` + _favoriteItems[j].fats + `' proteins='` + _favoriteItems[j].proteins + `' grams='` + _favoriteItems[j].grams + `'>
                <div><p>` + _favoriteItems[j].title + `
                </p></div><p class='deleteFavorite' index='`+ j +`'><span class='glyphicon glyphicon-trash'></span></p>
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
    
});


$(document).on("click", ".favoriteEntry > div", function () {
    var parent = $(this).parent();
    $("#singleFoodServingSize > input").val(parent.attr("grams"));
    $("#singleFoodFats > input").val(parent.attr("fats"));
    $("#singleFoodCarbs > input").val(parent.attr("carbs"));
    $("#singleFoodProteins > input").val(parent.attr("proteins"));
    $("#foodName").val(parent.attr("title"));    
    closeAlert();
});

$(document).on("input", "#favoriteName", function () {
    $(this).val(camelCaseInput($(this).val()));
    if ($(this).val().trim().length == 0) {
        $(".favoriteEntry.hidden").removeClass("hidden");
    } else {
        var dis = $(this);
        $(".favoriteEntry").each(function () {
            if ($(this).attr("title").substr(0, dis.val().trim().length).toLowerCase() != dis.val().trim().toLowerCase()) {
                $(this).addClass("hidden");
            } else {
                $(this).removeClass("hidden");
            }
        });          
    }
    if($(".favoriteEntry:not(.hidden)").length == 0){
        $("#favoriteSelect > p").removeClass("hidden");
    } else {
        $("#favoriteSelect > p").addClass("hidden");
    }
});

$(document).on("click", ".deleteFavorite", function () {
    var indexToRemove = $(this).attr("index");
    $("#titleForDelete > span").html(_favoriteItems[indexToRemove].title);
    $("#removeFromFavorites").attr("index", indexToRemove);
    $("#deleteFromFavoritesConfirm").removeClass("hidden");

}); 

$(document).on("click", "#cancelRemoveFromFavorites", function () {
    $("#deleteFromFavoritesConfirm").addClass("hidden");
});


$(document).on("click", "#removeFromFavorites", function () {
    var indexToRemove = $("#removeFromFavorites").attr("index");
    _favoriteItems.splice(indexToRemove, 1);
    localStorage.setItem("favorites", JSON.stringify(_favoriteItems));
    closeAlert();
});

$(document).on("click", ".removeEntry", function () {
    var itemId = $(this).attr("itemid");
    console.log(itemId);
    alertMsgToAppend("deleteEntry", true, ["ITEMNAME", "ATTRID"], [_singleDayServing.servings[itemId].itemName, itemId]);
});

$(document).on("click", "#removeEntryFromServings", function () {
    var indexToRemove = $(this).attr("index");
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
        let singleDayServingId = pastDate.getDate() + "/" + (pastDate.getMonth() + 1) + "/" + pastDate.getFullYear();
       
        $("#xAxisDays p:nth-of-type(" + (8 - j) + ")").html(dayNames[pastDate.getDay()] + "<br/>" + pastDate.getDate());

        if (_historyServings.hasOwnProperty(singleDayServingId)) {
            let calsFats = round(_historyServings[singleDayServingId].fats * 9);
            let calsCarbs = round(_historyServings[singleDayServingId].carbs * 4);
            let calsProteins = round(_historyServings[singleDayServingId].proteins * 4);
            let fats = getHeightForGraph(calsFats, highestCalorieCountOfLast7Days, graphMaxHeight);
            let carbs = getHeightForGraph(calsCarbs, highestCalorieCountOfLast7Days, graphMaxHeight);
            let proteins = getHeightForGraph(calsProteins, highestCalorieCountOfLast7Days, graphMaxHeight);
            setGraphDivValues((8 - j), fats, carbs, proteins, graphMaxHeight, calsFats, calsCarbs, calsProteins);
        } else {
            setGraphDivValues((8 - j), 0, 0, 0);
        }
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

function setGraphDivValues(count, valueFats, valueCarbs, valueProteins, graphMaxHeight, calsFats, calsCarbs, calsProteins) {
    $("#myDopeTable > div:nth-of-type(" + count + ")").attr("data-fats", calsFats);
    $("#myDopeTable > div:nth-of-type(" + count + ")").attr("data-carbs", calsCarbs);
    $("#myDopeTable > div:nth-of-type(" + count + ")").attr("data-proteins", calsProteins);

    //sets graph heights
    $("#myDopeTable > div:nth-of-type(" + count + ") .fatsTable").css("height", valueFats + "px");
    $("#myDopeTable > div:nth-of-type(" + count + ") .carbsTable").css("height", valueCarbs + "px");
    $("#myDopeTable > div:nth-of-type(" + count + ") .proteinsTable").css("height", valueProteins + "px");

    
    $("#myDopeTable > div:nth-of-type(" + count + ") .fatsTable p:first-of-type").html((valueFats > 8 ? calsFats : "")); //min height of 8px for each block for calories text to fit in, otherwise hide
    $("#myDopeTable > div:nth-of-type(" + count + ") .carbsTable p:first-of-type").html((valueCarbs > 8 ? calsCarbs : ""));
    $("#myDopeTable > div:nth-of-type(" + count + ") .proteinsTable p:first-of-type").html((valueProteins > 8 ? calsProteins : ""));


    $("#myDopeTable > div:nth-of-type(" + count + ") .fatsTable p:last-of-type").html((valueFats > 23 ? parseFloat((calsFats / 9).toFixed(2)) + "g" : ""));//if height greater than 23px then can fit grams under calories
    $("#myDopeTable > div:nth-of-type(" + count + ") .carbsTable p:last-of-type").html((valueCarbs > 23 ? parseFloat((calsCarbs / 4).toFixed(2)) + "g" : ""));
    $("#myDopeTable > div:nth-of-type(" + count + ") .proteinsTable p:last-of-type").html((valueProteins > 23 ? parseFloat((calsProteins / 4).toFixed(2)) + "g" : ""));


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
        let pastDate = returnPastDate(j);
        let singleDayServingId = pastDate.getDate() + "/" + (pastDate.getMonth() + 1) + "/" + pastDate.getFullYear();

        if (_historyServings.hasOwnProperty(singleDayServingId)) {
            totalMacroIdsToCheck.push(_historyServings[singleDayServingId].totalMacrosId);
        }
    }
    var maxTotalMacros = 0;

    for (let j = 0; j < totalMacroIdsToCheck.length; j++) {
        if (_historyTotalMacros.hasOwnProperty(totalMacroIdsToCheck[j])) {
            if (!_historyTotalMacros[totalMacroIdsToCheck[j]].hasOwnProperty(calculateCalories)){
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
    if ($(this).attr("data-selected") == "open"){
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
            carbs: parseFloat((parseFloat($(this).attr("data-carbs")) / 4).toFixed(2)),
            proteins: parseFloat((parseFloat($(this).attr("data-proteins")) / 4).toFixed(2)),
            fats: parseFloat((parseFloat($(this).attr("data-fats")) / 9).toFixed(2)),
            calories: calculateCalories
        };
        console.log(calories);
        $("#graphOldValuesDisplayer > div").slideUp(250, function () {
            $("#graphOldValuesDisplayer > div > p").hide();

            $("#graphOldValuesDisplayer > div > div.row > div:nth-of-type(1) > p > span").html(round(calories.calories()));
            $("#graphOldValuesDisplayer > div > div.row > div:nth-of-type(2) > p:last-of-type").html(calories.fats + "g");
            $("#graphOldValuesDisplayer > div > div.row > div:nth-of-type(3) > p:last-of-type").html(calories.carbs + "g");
            $("#graphOldValuesDisplayer > div > div.row > div:nth-of-type(4) > p:last-of-type").html(calories.proteins + "g");

            $("#graphOldValuesDisplayer > div > div.row").show();
            $("#graphOldValuesDisplayer > div").slideDown(250);
        });
    }
    
});


function doesNotExist(item) {
    return (item === null || typeof item == "undefined" || item.length <= 2);//null is primitive type but typeof returns Object (a JS unsolvable bug)
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

