// Which page are we on?
var urlConst = function () {
    this.watchList = document.URL.match(/flb\/(watchlist)/);
    this.freeAgency = document.URL.match(/flb\/(freeagency)/);
    this.yahooMatch = document.URL.match(/yahoo.com/);
    this.freeAgencyYahoo = document.URL.match(/\/(players)/);
    this.watchlistYahoo = document.URL.match(/\/(playerswatch)/);
};

// We find which page we are on and run the appropriate functions
function start() {
    urlMatch = new urlConst();
    if (urlMatch.yahooMatch) {
        addLinksYahoo();
        checkUpdateYahoo();
    } else {
        addLinksEspn();
        observeTblFilters();
        checkUpdate();
    }
}

//Observes ESPN's table filter.  If it changes, then our FantasyRig links are gone and we must re-add them with the addLinksEspn() function
function observeTblFilters() {
    var myObserver = new window.MutationObserver(mutationCb);

    $("#playerTableContainerDiv").each(function () {
        myObserver.observe(this, {childList: true})
    });

    function mutationCb(mutations) {
        mutations.forEach(function (mutation) {
            addLinksEspn();
        });
    }
}

//Fixes filter menu when our custom Link is clicked.
//If we click on a FantasyRig link, then we must unhighlight and recreate the old filter option (oldFilter) 
//oldFilter is highlighted by the "playertablefiltersmenucontaineron" class on the div, so we remove it
//We then need to recreate oldFilter's <a> inside of the div
//We copy the first filter option's <a> (or 2nd if we're replacing the first) and clone it
//We edit the onClick data to represent oldFilter and place it in the oldFilter div 
function fixFiltersMenu() {
    var statPath = {
            "2018 Season": "currSeason",
            "2017": "lastSeason",
            "2018 Projections": "projections",
            "Last 7": "last7",
            "Last 15": "last15",
            "Last 30": "last30",
            "BVP": "bvp"
        },
        elementTitle,
        newStatPath,
        elementToCopy,
        currentClick,
        newClick;
    $("#ptfiltersmenuleft > div").each(function (index) {
        if ($(this).hasClass("playertablefiltersmenucontaineron")) {
            $(this).removeClass("playertablefiltersmenucontaineron").addClass("playertablefiltersmenucontainer");
            if (!($(this).hasClass("fr"))) {
                elementTitle = $(this).text();
                newStatPath = "version=" + statPath[elementTitle];
                $(this).html("");
                if (index > 0) {
                    elementToCopy = $("#ptfiltersmenuleft > div:first > a").clone();
                } else {
                    elementToCopy = $("#ptfiltersmenuleft > div:nth-child(2) > a").clone();
                }
                currentClick = elementToCopy.attr("onclick");
                newClick = currentClick.replace(/today|last7|last15|last30|currSeason|BVP|lastSeason|projections/g, statPath[elementTitle]);
                elementToCopy.attr("onclick", newClick);
                elementToCopy.text(elementTitle);
                elementToCopy.appendTo($(this));
            }
        }
    });
}

// Adds FantasyRig links to ESPN page
function addLinksEspn() {

    // The last link won't fit in the div unless we make the div it a tiny bit bigger. It defaults at 700px.
    $("#ptfiltersmenuleft").css("width", "710px");
    $("#ptfiltersmenuleft").append("<div class='playertablefiltersmenucontainer'><strong>FantasyRig:</strong></div>");
    $("#ptfiltersmenuleft").append("<div style='cursor:pointer;' class='fr playertablefiltersmenucontainer'><span id='fantasyRigRos'><u>ROS</u></span></div>");
    $("#ptfiltersmenuleft").append("<div style='cursor:pointer;' class='fr playertablefiltersmenucontainer'><span id='fantasyRigMain'><u>2018</u></span></div>");
    $("#ptfiltersmenuleft").append("<div style='cursor:pointer;' class='fr playertablefiltersmenucontainer'><span id='fantasyRigLast'><u>2017</u></span></div>");
    $("#ptfiltersmenuleft").append("<div style='cursor:pointer;' class='fr playertablefiltersmenucontainer'><span id='fantasyRigThree'><u>3-Year</u></span></div>");
    bindLinksEspn();
}

function bindLinksEspn() {
    var dfd = $.Deferred();
    dfd.done(console.log("resolve"), addOnClickEspn());
    $(".fr").on("click", function () {
        disableRigLinkEspn(this);
        $(this).addClass("playertablefiltersmenucontaineron");
        clearCurrent();
        // dfd.resolve();
        // Alex: I don't understand this code nor remember why it's here
    });
}

function disableRigLinkEspn(rigLink) {

    // $(rigLink).find("span").prop('onclick',null).off('click');
    // $(rigLink).prop('onclick',null).off('click');
    // $(rigLink).addClass("playertablefiltersmenucontaineron");
    $(".fr").each(function () {
        $(this).find("span").prop('onclick', null).off('click');
        $(this).prop('onclick', null).off('click');
    });
}

function addOnClickEspn() {
    var sourceMapBat = {
            "depthCharts": "dcBat",
            "steamer": "steamBat",
            "zips": "zipsBat"
        },
        sourceMapPit = {
            "depthCharts": "dcPitch",
            "steamer": "steamPitch",
            "zips": "zipsPitch"
        },
        sourceResult,
        battingSourceRos,
        pitchingSourceRos;
    $("#fantasyRigMain").on("click", function () {
        sendFiller("currBat", ["K%", "BB%", "BABIP", "ISO", "wOBA", "wRC+"], "bat18", "2018", false);
        sendFiller("currPitch", ["K%", "BB%", "BABIP", "FIP", "xFIP", "SIERA"], "pitch18", "2018", true);
    });
    $("#fantasyRigLast").on("click", function () {
        sendFiller("lastBat", ["K%", "BB%", "BABIP", "ISO", "wOBA", "wRC+"], "bat17", "2017", false);
        sendFiller("lastPitch", ["K%", "BB%", "BABIP", "FIP", "xFIP", "SIERA"], "pitch17", "2017", true);
    });
    $("#fantasyRigThree").on("click", function () {
        sendFiller("threeBat", ["K%", "BB%", "BABIP", "ISO", "wOBA", "wRC+"], "bat3yr", "3-Year", false);
        sendFiller("threePitch", ["K%", "BB%", "BABIP", "FIP", "xFIP", "SIERA"], "pit3yr", "3-Year", true);
    });

    $("#fantasyRigRos").on("click", function () {
        chrome.storage.local.get("rosSource", function (rosResult) {
            if (typeof(rosResult["rosSource"]) === "undefined") {
                sourceResult = "depthCharts";
            } else {
                sourceResult = rosResult["rosSource"];
            }
            battingSourceRos = sourceMapBat[sourceResult];
            pitchingSourceRos = sourceMapPit[sourceResult];
            sendFiller("rosBat", ["FP/G", "FP", "AVG", "OBP", "SLG", "OPS", "wOBA"], battingSourceRos, "ROS", false);
            sendFiller("rosPitch", ["FP/G", "FP", "ERA", "WHIP", "K/9", "BB/9", "FIP"], pitchingSourceRos, "ROS", true);
        });
    });
}

function sendFiller(titleListName, defaultTitles, dataName, timeFrame, pitcherBool) {
    chrome.storage.local.get(titleListName, function (result) {
        var newTitles = result[titleListName];
        if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
            newTitles = defaultTitles;
        }
        addColumns(dataName, timeFrame, newTitles, pitcherBool);
    });
}

function clearCurrent() {
    var columnsAllowed = 3;
    tdCount = 0,
        spacerCount = 0,
        tds = $(".playerTableBgRowHead").first().children(),
        urlMatch = new urlConst();

    if (!urlMatch.watchList && !urlMatch.freeAgency) {
        columnsAllowed = 2;
    }

    //Clear topmost headers
    while (spacerCount < columnsAllowed && tdCount < tds.length) {
        if ($(tds[tdCount]).hasClass("sectionLeadingSpacer")) {
            spacerCount++;
        }
        tdCount++;
    }
    tdCount--;

    while ($(".playerTableBgRowHead").first().children().length > tdCount) {
        $(".playerTableBgRowHead").first().children()[tdCount].remove();
    }

    if (!urlMatch.freeAgency) {
        tdCount = 0;
        spacerCount = 0;
        tds = $(".playerTableBgRowHead").last().children();
        while (spacerCount < columnsAllowed && tdCount < tds.length) {
            if ($(tds[tdCount]).hasClass("sectionLeadingSpacer")) {
                spacerCount++;
            }
            tdCount++;
        }
        tdCount--;

        while ($(".playerTableBgRowHead").last().children().length > tdCount) {
            $(".playerTableBgRowHead").last().children()[tdCount].remove();
        }
        tdCount = 0;
        spacerCount = 0;
        tds = $("#playertable_1 tr.pncPlayerRow").first().find("td");
        while (spacerCount < columnsAllowed && tdCount < tds.length) {
            if ($(tds[tdCount]).hasClass("sectionLeadingSpacer")) {
                spacerCount++;
            }
            tdCount++;
        }
        tdCount--;

        while ($("#playertable_1 tr").find("td:eq(" + tdCount + ")").length > 0) {
            $("#playertable_1 tr").find("td:eq(" + tdCount + ")").remove();
        }
    }

    tdCount = 0;
    spacerCount = 0;
    tds = $("#playertable_0 tr.pncPlayerRow").first().find("td");
    while (spacerCount < columnsAllowed && tdCount < tds.length) {
        if ($(tds[tdCount]).hasClass("sectionLeadingSpacer")) {
            spacerCount++;
        }
        tdCount++;
    }
    tdCount--;

    while ($("#playertable_0 tr").find("td:eq(" + tdCount + ")").length > 0) {
        $("#playertable_0 tr").find("td:eq(" + tdCount + ")").remove();
    }

    if (!urlMatch.watchList && !urlMatch.freeAgency) {
        tdCount = 0;
        spacerCount = 0;
        tds = $(".playerTableBgRowTotals").first().find("td");
        while (spacerCount < columnsAllowed && tdCount < tds.length) {
            if ($(tds[tdCount]).hasClass("sectionLeadingSpacer")) {
                spacerCount++;
            }
            tdCount++;
        }
        tdCount--;

        while ($(".playerTableBgRowTotals").find("td:eq(" + tdCount + ")").length > 0) {
            $(".playerTableBgRowTotals").find("td:eq(" + tdCount + ")").remove();
        }
        $(".playerTableBgRowTotals").find("td:eq(2)").text("");
    }
}

//adds espn columns
function addColumns(dataName, timeTitle, columnTitles, pitchers) {
    var leagueId = document.URL.match(/leagueId=(\d+)/)[1],
        spacer = "<td class='sectionLeadingSpacer'></td>",
        rigHeader = "<th colspan=" + columnTitles.length + ">" + timeTitle + "</th>",
        currentHead,
        newData,
        currentRow,
        playerName,
        statHtml,
        urlMatch = new urlConst(),
        tableName = "playertable_0",
        faPitchers;

    if (urlMatch.freeAgency) {
        faPitchers = $("th.playertableSectionHeaderFirst").text() === "PITCHERS";
        if (faPitchers && !pitchers) {
            return;
        } else if (!faPitchers && pitchers) {
            return;
        }
    } else {
        if (pitchers) {
            tableName = "playertable_1";
        }
    }

    //if the last element in the row is not a spacer, add a spacer
    if (!$("#" + tableName + " .playertableSectionHeader :last-child").hasClass("sectionLeadingSpacer")) {
        $("#" + tableName + " .playertableSectionHeader").append(spacer);
    }

    //if the last element in the row is not a spacer, add a spacer
    if (!$("#" + tableName + " .playerTableBgRowSubhead :last-child").hasClass("sectionLeadingSpacer")) {
        $("#" + tableName + " .playerTableBgRowSubhead").append(spacer);
    }

    //add main header (2018 or ROS)
    $("#" + tableName + " .playertableSectionHeader").append(rigHeader);

    $.each(columnTitles, function (index, value) {
        currentHead = "<td class='playertableData'>" + value + "</td>";
        $("#" + tableName + " .playerTableBgRowSubhead").append(currentHead);
    });

    chrome.storage.local.get(dataName, function (result) {
        newData = result;
        $("#" + tableName + " .pncPlayerRow").each(function () {
            currentRow = $(this);
            if (!currentRow.find("td:last").hasClass("sectionLeadingSpacer")) {
                currentRow.append(spacer);
            }

            playerName = currentRow.find(".playertablePlayerName").find("a").first().text();

            $.each(columnTitles, function (index, value) {
                currentStat = "N/A";
                if (playerName in newData[dataName]) {
                    if (value === "FP") {
                        currentStat = newData[dataName][playerName][leagueId];
                    } else if (value === "FP/G") {
                        currentStat = newData[dataName][playerName][leagueId + "-FP/G"];
                    } else {
                        currentStat = newData[dataName][playerName][value];
                    }
                }
                //If the currentStat is undefined, NaN, etc., then revert it to "N/A"
                if (typeof currentStat === "undefined" || !currentStat) {
                    currentStat = "N/A"
                }
                ;
                statHtml = "<td class='playertableStat'>" + currentStat + "</td>";
                currentRow.append(statHtml);
            });
        })
    });
}

function createProjections(leagueId) {
    var leagueUrl = "http://games.espn.com/flb/leaguesetup/sections/scoring?leagueId=" + leagueId;

    $.ajax({
        url: leagueUrl,
        cache: false
    })
        .then(function (response) {
            return scrapeSets(response);
        })
        .then(function (pointSets) {
            setProjections(pointSets, leagueId);
        });
}

function scrapeSets(responseData) {
    var hittingNames = [],
        pitchingNames = [],
        hittingPoints = [],
        pitchingPoints = [],
        pointSettings = {"pitching": {}, "hitting": {}},
        fixedNamesHitting = {
            "Caught Stealing (CS)": "CS",
            "Hit by Pitch (HBP)": "HBP",
            "Runs Batted In (RBI)": "RBI",
            "Runs Scored (R)": "R",
            "Stolen Bases (SB)": "SB",
            "Strikeouts (K)": "SO",
            "Total Bases (TB)": "TB",
            "Walks (BB)": "BB",
            "Singles (1B)": "1B",
            "Doubles (2B)": "2B",
            "Triples (3B)": "3B",
            "Home Runs (HR)": "HR",
            "At Bats (AB)": "AB",
            "Extra Base Hits (XBH)": "XBH",
            "Hits (H)": "H"
        },
        fixedNamesPitching = {
            "Earned Runs (ER)": "ER",
            "Hit Batsmen (HB)": "HBP",
            "Hits Allowed (H)": "H",
            "Innings Pitched (IP)": "IP",
            "Losses (L)": "L",
            "Quality Starts (QS)": "QS",
            "Saves (SV)": "S",
            "Strikeouts (K)": "SO",
            "Walks Issued (BB)": "BB",
            "Wins (W)": "W",
            "Holds (HD)": "HD",
            "Appearances (G)": "G",
            "Games Started (GS)": "GS",
            "Batters Faced (BF)": "BF",
            "Runs Allowed (RA)": "R",
            "Home Runs Allowed (HR)": "HR",
            "Saves Plus Holds (SVHD)": "SVHD"
        };
    $(responseData).find("td.categoryName").each(function (index) {
        if ($(this).text() === "Batting") {
            //If there's no statpoints, it's Roto
            if ($(this).parent().find("td.statPoints").length === 0) {
                return;
            }
            $(this).parent().find("td.statPoints").each(function (index) {
                if ($.isNumeric($(this).text())) {
                    hittingPoints.push($(this).text());
                }
            });
            $(this).parent().find("td.statName").each(function (index) {
                hittingNames.push($(this).text());
            });
            for (i = 0; i < hittingNames.length; i++) {
                if (hittingNames[i] in fixedNamesHitting) {
                    pointSettings["hitting"][fixedNamesHitting[hittingNames[i]]] = parseFloat(hittingPoints[i]);
                }
            }
        } else if ($(this).text() === "Pitching") {
            //If there's no statpoints, it's Roto
            if ($(this).parent().find("td.statPoints").length === 0) {
                return;
            }
            $(this).parent().find("td.statPoints").each(function (index) {
                if ($.isNumeric($(this).text())) {
                    pitchingPoints.push($(this).text());
                }
            });
            $(this).parent().find("td.statName").each(function (index) {
                pitchingNames.push($(this).text());
            });
            for (i = 0; i < pitchingNames.length; i++) {
                //Add "if pointsetting is in fixedNames" because we can't predict them all (e.g. balks, errors) and the ones we can't do aren't in the dict
                if (pitchingNames[i] in fixedNamesPitching) {
                    pointSettings["pitching"][fixedNamesPitching[pitchingNames[i]]] = parseFloat(pitchingPoints[i]);
                }
            }
        }
    });
    return pointSettings;
}

function setProjections(pointSettings, leagueId) {
    $.each(["dcPitch", "steamPitch", "zipsPitch"], function (index, sourceValue) {
        chrome.storage.local.get(sourceValue, function (result) {
            $.each(result[sourceValue], function (key, sourceData) {
                var fantasyPoints = 0

                if ("SVHD" in pointSettings["pitching"]) {
                    sourceData["SVHD"] = parseFloat(sourceData["SV"] + sourceData["HD"]);
                    ;
                }
                if ("BF" in pointSettings["pitching"]) {
                    sourceData["BF"] = parseFloat((sourceData["IP"] * 3) + sourceData["H"] + sourceData["BB"]);
                }
                if ("R" in pointSettings["pitching"]) {
                    sourceData["R"] = parseFloat(sourceData["ER"]);
                }
                if ("QS" in pointSettings["pitching"]) {
                    sourceData["QS"] = parseFloat(sourceData["GS"] * (0.95 - ((0.33 * (sourceData["FIP"] ^ (1.7))) / 10)));
                }

                $.each(pointSettings["pitching"], function (keyTwo, sourceDataTwo) {
                    if (keyTwo in sourceData) {
                        fantasyPoints = fantasyPoints + (sourceDataTwo * parseFloat(sourceData[keyTwo]));
                    }
                });
                result[sourceValue][key][leagueId] = fantasyPoints.toFixed(0);
                result[sourceValue][key][leagueId + "-FP/G"] = (fantasyPoints / parseFloat(sourceData["G"])).toFixed(1);
            });
            chrome.storage.local.set(result);
        });
    });
    $.each(["dcBat", "steamBat", "zipsBat"], function (index, sourceValue) {
        chrome.storage.local.get(sourceValue, function (result) {
            $.each(result[sourceValue], function (key, sourceData) {
                var fantasyPoints = 0

                if ("XBH" in pointSettings["hitting"]) {
                    sourceData["XBH"] = parseFloat(sourceData["2B"] + sourceData["3B"] + sourceData["HR"]);
                    ;
                }
                if ("1B" in pointSettings["hitting"]) {
                    sourceData["1B"] = parseFloat(sourceData["H"] - sourceData["2B"] - sourceData["3B"] - sourceData["HR"]);
                }
                result[sourceValue][key]["TB"] = parseFloat(sourceData["H"]) + parseFloat(sourceData["2B"]) + parseFloat(sourceData["3B"] * 2) + parseFloat(sourceData["HR"] * 3);
                $.each(pointSettings["hitting"], function (keyTwo, sourceDataTwo) {
                    if (keyTwo in sourceData) {
                        fantasyPoints = fantasyPoints + (sourceDataTwo * parseFloat(sourceData[keyTwo]));
                    }
                });
                result[sourceValue][key][leagueId] = fantasyPoints.toFixed(0);
                result[sourceValue][key][leagueId + "-FP/G"] = (fantasyPoints / parseFloat(sourceData["G"])).toFixed(1);
            });
            chrome.storage.local.set(result);
        });
    });
}

function createProjectionsYahoo(leagueId) {
    var leagueUrl = "https://baseball.fantasysports.yahoo.com/b1/" + leagueId + "/settings";

    $.ajax({
        url: leagueUrl,
        cache: false
    })
        .then(function (response) {
            return scrapeSetsYahoo(response);
        })
        .then(function (pointSets) {
            setProjectionsYahoo(pointSets, leagueId);
        });
}

function scrapeSetsYahoo(responseData) {
    var fixedNamesHitting = {
        "Caught Stealing (CS)": "CS",
        "Hit by Pitch (HBP)": "HBP",
        "Runs Batted In (RBI)": "RBI",
        "Runs (R)": "R",
        "Stolen Bases (SB)": "SB",
        "Strikeouts (K)": "SO",
        "Total Bases (TB)": "TB",
        "Walks (BB)": "BB",
        "Singles (1B)": "1B",
        "Doubles (2B)": "2B",
        "Triples (3B)": "3B",
        "Home Runs (HR)": "HR",
        "At Bats (AB)": "AB",
        "Extra Base Hits (XBH)": "XBH",
        "Hits (H)": "H",
        "Plate Appearances (PA)": "PA",
        "Net Stolen Bases (NSB)": "NSB",
        "Games Played (GP)": "G",
    }
    var fixedNamesPitching = {
        "Hits (H)": "H",
        "Innings Pitched (IP)": "IP",
        "Losses (L)": "L",
        "Quality Starts (QS)": "QS",
        "Saves (SV)": "S",
        "Strikeouts (K)": "SO",
        "Walks (BB)": "BB",
        "Wins (W)": "W",
        "Holds (HD)": "HD",
        "Pitching Appearances (APP)": "G",
        "Games Started (GS)": "GS",
        "Home Runs (HR)": "HR",
        "Outs (OUT)": "OUT",
        "Total Batters Faced (TBF)": "BF",
        "Runs (R)": "R",
        "Earned Runs (ER)": "ER",
        "Saves + Holds (SV+H)": "SVHD"
    }
    var pointSettings = {"pitching": {}, "hitting": {}};
    var statSections = $(responseData).find("section.Thm-inherit");
    statSections.each(function () {
        var statCat = $(this).find("th").first().text();
        if (statCat === "Setting") {
            $(this).find("td").each(function () {
                var settingTitle = $(this).text();
                if (settingTitle === "Scoring Type:") {
                    var settingAnswer = $(this).next().find("b").text();
                    if (settingAnswer === "Head-to-Head") {
                        //This is roto/categories
                        return;
                    }
                }
            });
        } else if (statCat === "Batters Stat Category") {
            $(this).find("td.first").each(function () {
                pointSettings["hitting"][fixedNamesHitting[$(this).text()]] = $(this).next().text();
            });
        } else if (statCat === "Pitchers Stat Category") {
            $(this).find("td.first").each(function () {
                pointSettings["pitching"][fixedNamesPitching[$(this).text()]] = $(this).next().text();
            });
        }
    });
    return pointSettings;
}

function setProjectionsYahoo(pointSettings, leagueId) {

    $.each(["dcPitch", "steamPitch", "zipsPitch"], function (index, sourceValue) {
        chrome.storage.local.get(sourceValue, function (result) {
            $.each(result[sourceValue], function (key, sourceData) {
                var fantasyPoints = 0

                if ("SVHD" in pointSettings["pitching"]) {
                    sourceData["SVHD"] = parseFloat(sourceData["SV"] + sourceData["HD"]);
                    ;
                }
                if ("BF" in pointSettings["pitching"]) {
                    sourceData["BF"] = parseFloat((sourceData["IP"] * 3) + sourceData["H"] + sourceData["BB"]);
                }
                if ("R" in pointSettings["pitching"]) {
                    sourceData["R"] = parseFloat(sourceData["ER"]);
                }
                if ("QS" in pointSettings["pitching"]) {
                    sourceData["QS"] = parseFloat(sourceData["GS"] * (0.95 - ((0.33 * (sourceData["FIP"] ^ (1.7))) / 10)));
                }

                $.each(pointSettings["pitching"], function (keyTwo, sourceDataTwo) {
                    if (keyTwo in sourceData) {
                        fantasyPoints = fantasyPoints + (sourceDataTwo * parseFloat(sourceData[keyTwo]));
                    }
                });
                result[sourceValue][key][leagueId + "-FP/G"] = (fantasyPoints / parseFloat(sourceData["G"])).toFixed(1);
                result[sourceValue][key][leagueId] = fantasyPoints.toFixed(0);
            });
            chrome.storage.local.set(result);
        });
    });
    $.each(["dcBat", "steamBat", "zipsBat"], function (index, sourceValue) {
        chrome.storage.local.get(sourceValue, function (result) {
            $.each(result[sourceValue], function (key, sourceData) {
                var fantasyPoints = 0

                //Gotta add these manually
                if ("XBH" in pointSettings["hitting"]) {
                    sourceData["XBH"] = parseFloat(sourceData["2B"] + sourceData["3B"] + sourceData["HR"]);
                    ;
                }
                if ("1B" in pointSettings["hitting"]) {
                    sourceData["1B"] = parseFloat(sourceData["H"] - sourceData["2B"] - sourceData["3B"] - sourceData["HR"]);
                }
                result[sourceValue][key]["TB"] = parseFloat(sourceData["H"]) + parseFloat(sourceData["2B"]) + parseFloat(sourceData["3B"] * 2) + parseFloat(sourceData["HR"] * 3);

                $.each(pointSettings["hitting"], function (keyTwo, sourceDataTwo) {
                    if (keyTwo in sourceData) {
                        fantasyPoints = fantasyPoints + (sourceDataTwo * parseFloat(sourceData[keyTwo]));
                    }
                });
                result[sourceValue][key][leagueId + "-FP/G"] = (fantasyPoints / parseFloat(sourceData["G"])).toFixed(1);
                result[sourceValue][key][leagueId] = fantasyPoints.toFixed(0);
            });
            chrome.storage.local.set(result);
        });
    });
}

//Adds FantasyRig link
function addLinksYahoo() {
    var urlMatch = new urlConst(),
        copyElement,
        rigButtonRos = "<div class='Grid-u Mbot-sm'><button type='button' class='Btn-primary Btn-positive Mtop-xxl Mstart-med fantasyRigRos'>ROS</button></div>";
    rigButtonCurr = "<div class='Grid-u Mbot-sm'><button type='button' class='Btn-primary Btn-positive Mtop-xxl Mstart-med fantasyRigCurr'>2018</button></div>";
    rigButtonLast = "<div class='Grid-u Mbot-sm'><button type='button' class='Btn-primary Btn-positive Mtop-xxl Mstart-med fantasyRigLast'>2017</button></div>";
    rigButtonThree = "<div class='Grid-u Mbot-sm'><button type='button' class='Btn-primary Btn-positive Mtop-xxl Mstart-med fantasyRigThree'>3-Year</button></div>";

    if (!urlMatch.watchlistYahoo && urlMatch.freeAgencyYahoo) {

        $("#yspmaincontent").find("section").first().append("<div class='Grid-u Mbot-sm'><strong>FantasyRig</strong></div>");
        $("#yspmaincontent").find("section").first().append(rigButtonRos);
        $("#yspmaincontent").find("section").first().append(rigButtonCurr);
        $("#yspmaincontent").find("section").first().append(rigButtonLast);
        $("#yspmaincontent").find("section").first().append(rigButtonThree);

    } else {
        $("#statnav").append("<li class='Navitem Mstart-xxl Ta-c'><span><strong>FantasyRig:</strong></span></li>");
        $("#statsubnav > div.Subnav-main > ul:first").append("<li class='Navitem Mstart-xxl Ta-c'><span><strong>FantasyRig:</strong></span></li>");

        copyElement = $("#statnav > li:first").clone()
        copyElement.css("cursor", "pointer");
        copyElement.addClass("fantasyRigRos");
        copyElement.removeClass("Selected");
        copyElement.empty();
        copyElement.append("<span style='color: rgb(0, 192, 115);'>ROS</span>");
        $("#statnav").append(copyElement);
        $("#statsubnav > div.Subnav-main > ul:first").append(copyElement.clone());

        copyElement = $("#statnav > li:first").clone()
        copyElement.css("cursor", "pointer");
        copyElement.addClass("fantasyRigCurr");
        copyElement.removeClass("Selected");
        copyElement.empty();
        copyElement.append("<span style='color: rgb(0, 192, 115);'>2018</span>");
        $("#statnav").append(copyElement);
        $("#statsubnav > div.Subnav-main > ul:first").append(copyElement.clone());

        copyElement = $("#statnav > li:first").clone()
        copyElement.css("cursor", "pointer");
        copyElement.addClass("fantasyRigLast");
        copyElement.removeClass("Selected");
        copyElement.empty();
        copyElement.append("<span style='color: rgb(0, 192, 115);'>2017</span>");
        $("#statnav").append(copyElement);
        $("#statsubnav > div.Subnav-main > ul:first").append(copyElement.clone());

        copyElement = $("#statnav > li:first").clone()
        copyElement.css("cursor", "pointer");
        copyElement.addClass("fantasyRigThree");
        copyElement.removeClass("Selected");
        copyElement.empty();
        copyElement.append("<span style='color: rgb(0, 192, 115);'>3-Year</span>");
        $("#statnav").append(copyElement);
        $("#statsubnav > div.Subnav-main > ul:first").append(copyElement.clone());
    }
    $(".fantasyRigRos").on("click", function () {
        fillRosYahoo();
    });
    $(".fantasyRigCurr").on("click", function () {
        fillCurrYahoo();
    });
    $(".fantasyRigLast").on("click", function () {
        fillLastYahoo();
    });
    $(".fantasyRigThree").on("click", function () {
        fillThreeYahoo();
    });

}

function fillRosYahoo() {
    var sourceMapBat = {
            "depthCharts": "dcBat",
            "steamer": "steamBat",
            "zips": "zipsBat"
        },
        sourceMapPit = {
            "depthCharts": "dcPitch",
            "steamer": "steamPitch",
            "zips": "zipsPitch"
        },
        newTitles;
    clearCurrentYahoo();
    chrome.storage.local.get("rosSource", function (rosResult) {
        var sourceResult;
        if (typeof(rosResult["rosSource"]) === "undefined") {
            sourceResult = "depthCharts";
        } else {
            sourceResult = rosResult["rosSource"];
        }
        chrome.storage.local.get("rosBat", function (result) {
            newTitles = result["rosBat"];
            if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
                newTitles = ["FP", "AVG", "OBP", "SLG", "OPS", "wOBA"];
            }
            addColumnsYahoo(sourceMapBat[sourceResult], "statTable0", newTitles, false, tableFillYahoo);

            chrome.storage.local.get("rosPitch", function (pitchResult) {
                newTitles = pitchResult["rosPitch"];
                if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
                    newTitles = ["FP", "ERA", "WHIP", "K/9", "BB/9", "FIP"];
                }
                addColumnsYahoo(sourceMapPit[sourceResult], "statTable1", newTitles, true, tableFillYahoo);
            });
        });
    });
}

function fillCurrYahoo() {
    var newTitles;
    clearCurrentYahoo();
    chrome.storage.local.get("currBat", function (result) {
        newTitles = result["currBat"];
        if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
            newTitles = ["BB%", "K%", "ISO", "BABIP", "BABIP", "wOBA", "wRC+", "LD%", "GB%", "FB%", "HR/FB", "Soft%", "Med%", "Hard%"];
        }

        addColumnsYahoo("bat18", "statTable0", newTitles, false, tableFillYahoo);
        chrome.storage.local.get("currPitch", function (pitchResult) {
            newTitles = pitchResult["currPitch"];
            if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
                newTitles = ["K/9", "BB/9", "HR/9", "K%", "BB%", "AVG", "WHIP", "BABIP", "LOB%", "FIP", "xFIP", "SIERA", "LD%", "GB%", "FB%", "HR/FB", "Soft%", "Med%", "Hard%"];
            }
            addColumnsYahoo("pitch18", "statTable1", newTitles, true, tableFillYahoo);
        });
    });
}

function fillLastYahoo() {
    var newTitles;
    clearCurrentYahoo();
    chrome.storage.local.get("lastBat", function (result) {
        newTitles = result["lastBat"];
        if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
            newTitles = ["BB%", "K%", "ISO", "BABIP", "BABIP", "wOBA", "wRC+", "LD%", "GB%", "FB%", "HR/FB", "Soft%", "Med%", "Hard%"];
        }
        addColumnsYahoo("bat17", "statTable0", newTitles, false, tableFillYahoo);

        chrome.storage.local.get("lastPitch", function (pitchResult) {
            newTitles = pitchResult["lastPitch"];
            if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
                newTitles = ["K/9", "BB/9", "HR/9", "K%", "BB%", "AVG", "WHIP", "BABIP", "LOB%", "FIP", "xFIP", "SIERA", "LD%", "GB%", "FB%", "HR/FB", "Soft%", "Med%", "Hard%"];
            }
            addColumnsYahoo("pitch17", "statTable1", newTitles, true, tableFillYahoo);
        });
    });
}

function fillThreeYahoo() {
    var newTitles;
    clearCurrentYahoo();
    chrome.storage.local.get("threeBat", function (result) {
        newTitles = result["threeBat"];
        if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
            newTitles = ["BB%", "K%", "ISO", "BABIP", "BABIP", "wOBA", "wRC+", "LD%", "GB%", "FB%", "HR/FB", "Soft%", "Med%", "Hard%"];
        }
        addColumnsYahoo("bat3yr", "statTable0", newTitles, false, tableFillYahoo);

        chrome.storage.local.get("threePitch", function (pitchResult) {
            newTitles = pitchResult["threePitch"];
            if (typeof(newTitles) === "undefined" || newTitles.length === 0) {
                newTitles = ["K/9", "BB/9", "HR/9", "K%", "BB%", "AVG", "WHIP", "BABIP", "LOB%", "FIP", "xFIP", "SIERA", "LD%", "GB%", "FB%", "HR/FB", "Soft%", "Med%", "Hard%"];
            }
            addColumnsYahoo("pit3yr", "statTable1", newTitles, true, tableFillYahoo);
        });
    });
}

function clearCurrentYahoo() {
    var urlMatch = new urlConst(),
        columnsAllowed,
        badColumn,
        curTable,
        badColumnNames = ["Highlight", "Action", "Forecast"];
    if (urlMatch.watchlistYahoo) {
        $("table.Table-px-sm").each(function (index, value) {

            while ($(this).find("thead> tr:first").find("th:eq(1)").length > 0) {
                $(this).find("thead > tr:first").find("th:eq(1)").remove();
            }
            //Find the right-most column that we allow, which is the "Status" column. Store its index.
            $(this).find("thead> tr:last").find("th").each(function (index) {
                if ($(this).text() === "Owner") {
                    columnsAllowed = index + 1;
                }
            });
            //Remove all header cells past the columnAllowed for the lower header
            while ($(this).find("thead> tr:last").find("th:eq(" + columnsAllowed + ")").length > 0) {
                $(this).find("thead > tr:last").find("th:eq(" + columnsAllowed + ")").remove();
            }
            //Remove all table cells past the columnAllowed
            while ($(this).find("tbody> tr").find("td:eq(" + columnsAllowed + ")").length > 0) {
                $(this).find("tbody > tr").find("td:eq(" + columnsAllowed + ")").remove();
            }
        });
    }
    else if (!urlMatch.freeAgencyYahoo) {
        //Do separately for the hitters and pitchers table
        $.each(["statTable0", "statTable1"], function (index, value) {
            //Remove the "Bad" columns (highlight and forecast) that can't be chopped because they're in between good columns
            $("#" + value + "> thead > tr:last > th").each(function (index) {
                if (badColumnNames.includes($(this).text())) {
                    if (!badColumn) {
                        badColumn = index;
                    }
                    $(this).remove();
                    $("#" + value + " > tbody > tr").find("td:eq(" + badColumn + ")").remove();
                }
            });
            //Find the right-most column that we allow, which is the "Status" column. Store its index.
            $("#" + value + " > thead> tr:last").find("th").each(function (index) {
                if ($(this).text() === "Status") {
                    columnsAllowed = index + 1;
                }
            });
            //Remove all header cells on the upper header--it's useless and too dynamic to try and accurately chop
            while ($("#" + value + " > thead> tr:first").find("th:eq(0)").length > 0) {
                $("#" + value + " > thead > tr:first").find("th:eq(0)").remove();
            }
            //Remove all header cells past the columnAllowed for the lower header
            while ($("#" + value + " > thead> tr:last").find("th:eq(" + columnsAllowed + ")").length > 0) {
                $("#" + value + " > thead > tr:last").find("th:eq(" + columnsAllowed + ")").remove();
            }
            //Remove all table cells past the columnAllowed
            while ($("#" + value + " > tbody> tr").find("td:eq(" + columnsAllowed + ")").length > 0) {
                $("#" + value + " > tbody > tr").find("td:eq(" + columnsAllowed + ")").remove();
            }
        });
    } else {
        //If both batters & pitchers are on the page, then there are 2 divs with class "players-table"
        //If only 1 playertype , there is one div class "players". Both scenarios live inside the #players-table div
        //By searching and iterating over both possibilities, we make sure we run the function on that div regardless
        $("#players-table").find("div.players-table, div.players").each(function () {
            curTable = $(this);
            //Remove the "Bad" columns (highlight and forecast) that can't be chopped because they're in between good columns
            curTable.find("thead").find("tr:last").find("th").each(function (index) {
                if (badColumnNames.includes($(this).text())) {
                    if (!badColumn) {
                        badColumn = index;
                    }
                    $(this).remove();
                    curTable.find("tbody").find("tr").find("td:eq(" + badColumn + ")").remove();
                }
            });

            //Find the right-most column that we allow, which is the "Owner" column. Store its index.
            curTable.find("thead").find("tr:last").find("th").each(function (index) {
                if ($(this).text() === "Owner") {
                    columnsAllowed = index + 1;
                }
            });
            //Remove all header cells on the upper header--it's useless and too dynamic to try and accurately chop
            while (curTable.find("thead").find("tr:first").find("th:eq(0)").length > 0) {
                curTable.find("thead").find("tr:first").find("th:eq(0)").remove();
            }
            //Remove all header cells past the columnAllowed for the lower header
            while (curTable.find("thead").find("tr:last").find("th:eq(" + columnsAllowed + ")").length > 0) {
                curTable.find("thead").find("tr:last").find("th:eq(" + columnsAllowed + ")").remove();
            }
            //Remove all table cells past the columnAllowed
            while (curTable.find("tbody").find("tr").find("td:eq(" + columnsAllowed + ")").length > 0) {
                curTable.find("tbody").find("tr").find("td:eq(" + columnsAllowed + ")").remove();
            }

        });
    }
}

//adds batter columns
function addColumnsYahoo(statSource, table, columnTitles, pitchers, callback) {

    var topMostHeaderLength = 4,
        topMostRig = "<th class='Ta-c' colspan=" + columnTitles.length + "'><div>FantasyRig</div></th>",
        newTopMost,
        currentHead,
        urlMatch = new urlConst(),
        currentTable;

    if (urlMatch.watchlistYahoo) {
        topMostHeaderLength = 1;
        currentTable = $("#playerswatchform");
        if (pitchers) {
            if (currentTable.find("thead:first").find("tr:first").find("th:first").text() === "Pitchers"
                || currentTable.find("thead:first").find("tr:first").find("th:first").text().slice(0, -1) === "Pitchers") {
                currentTable = currentTable.find("table").first();
            } else {
                currentTable = currentTable.find("table").last();
            }
        } else {
            if (currentTable.find("thead:first").find("tr:first").find("th:first").text() === "Pitchers"
                || currentTable.find("thead:first").find("tr:first").find("th:first").text().slice(0, -1) === "Pitchers") {
                return;
            } else {
                currentTable = currentTable.find("table").first();
            }
        }
    } else if (urlMatch.freeAgencyYahoo) {
        topMostHeaderLength = 5;
        currentTable = $("#players-table")

        if (currentTable.find("thead").find("tr:last").find("th:nth-child(2)").text() === "Pitchers"
            || currentTable.find("thead").find("tr:last").find("th:nth-child(2)").text().slice(0, -1) === "Pitchers") {
            if (!pitchers) {
                return;
            }
        } else {
            if (pitchers) {
                return;
            }
        }
    } else {
        currentTable = $("#" + table);
    }

    //TopMost Header
    newTopMost = "<th colspan='" + topMostHeaderLength + "'><div>&nbsp;</div></th>";
    currentTable.find("thead").find("tr:first").append(newTopMost);
    currentTable.find("thead").find("tr:first").append(topMostRig);

    //Adds Column Titles
    $.each(columnTitles, function (index, value) {
        currentHead = "<th class='customHeader Ta-end Nowrap'><div>" + value + "</div></th>";
        currentTable.find("thead").find("tr:last").append(currentHead);
    });

    //Fills Columns
    chrome.storage.local.get(statSource, function (result) {
        callback(currentTable, columnTitles, result[statSource], rowFillYahoo)
    });
}

function tableFillYahoo(currentTable, columnTitles, storageData, callback) {
    var playerName,
        currentRow;
    currentTable.find("tbody > tr").each(function () {
        currentRow = $(this);
        playerName = currentRow.find("a.name").text()
        $.each(columnTitles, function (index, value) {
            callback(storageData, currentRow, value, playerName);
        });
    })
}

function rowFillYahoo(storageData, currentRow, statTitle, playerName) {
    var nameChanges = {
            "Shin-soo Choo": "Shin-Soo Choo",
            "Seung Hwan Oh": "Seung-Hwan Oh",
            "J.C. Ramírez": "JC Ramirez"
        },
        leagueId = document.URL.match(/baseball.fantasysports.yahoo.com\/b1\/(\d+)/)[1],
        currentStat = "N/A",
        statHtml;
    if (playerName in storageData) {
        if (statTitle === "FP") {
            currentStat = storageData[playerName][leagueId];
        } else {
            currentStat = storageData[playerName][statTitle];
        }
    } else if (playerName.replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u").replace(/á/g, "a") in storageData) {
        if (statTitle === "FP") {
            currentStat = storageData[playerName.replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u").replace(/á/g, "a")][leagueId];
        } else {
            currentStat = storageData[playerName.replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u").replace(/á/g, "a")][statTitle];
        }
    } else if (nameChanges[playerName] in storageData) {

        if (statTitle === "FP") {
            currentStat = storageData[nameChanges[playerName]][leagueId];
        } else {
            currentStat = storageData[nameChanges[playerName]][statTitle];
        }
    }
    if (typeof currentStat === "undefined" || !currentStat) {
        currentStat = "N/A"
    }
    ;
    statHtml = "<td class='Ta-end Nowrap'>" + currentStat + "</td>";
    $(currentRow).append(statHtml);
}

//Check for last updated time.  If over  a day old, refresh
function checkUpdate() {
    var leagueId = document.URL.match(/leagueId=(\d+)/)[1],
        currentDate = new Date(),
        leaguesList,
        checkBool;

    chrome.storage.local.get("leaguesList", function (data) {
        leaguesList = data["leaguesList"];
        if (typeof leaguesList === "undefined" || !leaguesList || leaguesList.length === 0) {
            createProjections(leagueId);
            leaguesList = [leagueId]
            chrome.storage.local.set({"leaguesList": leaguesList});
        } else if (!(leaguesList.includes(leagueId))) {
            createProjections(leagueId);
            leaguesList.push(leagueId);
            chrome.storage.local.set({"leaguesList": leaguesList});
        }
    });

    chrome.storage.local.get("frUpdate", function (result) {
        checkBool = "frUpdate" in result;
        if (!checkBool || result["frUpdate"] < currentDate.getTime() - 86400000) {
            updateData();
        }
    });
}

//Check for last updated time.  If over  a day old, refresh
function checkUpdateYahoo() {
    var leagueId = document.URL.match(/baseball.fantasysports.yahoo.com\/b1\/(\d+)/)[1],
        currentDate = new Date(),
        leaguesListYahoo,
        checkBool;

    chrome.storage.local.get("leaguesListYahoo", function (data) {
        leaguesListYahoo = data["leaguesListYahoo"];
        if (typeof leaguesListYahoo === "undefined" || !leaguesListYahoo || leaguesListYahoo.length === 0) {
            createProjectionsYahoo(leagueId);
            leaguesListYahoo = [leagueId]
            chrome.storage.local.set({"leaguesListYahoo": leaguesListYahoo});

        } else if (!(leaguesListYahoo.includes(leagueId))) {
            createProjectionsYahoo(leagueId);
            leaguesListYahoo.push(leagueId);
            chrome.storage.local.set({"leaguesListYahoo": leaguesListYahoo});
        }
    });
    chrome.storage.local.get("frUpdateYahoo", function (result) {
        checkBool = "frUpdateYahoo" in result;
        if (!checkBool || result["frUpdateYahoo"] < currentDate.getTime() - 86400000) {
            updateData();
        }
    });
}

function updateData() {
    var currentDate = new Date(),
        urlMatch = new urlConst();
    $.ajax({
        url: "https://brainydfs.pythonanywhere.com/fantasyrig/fantasyrig2.json",
        dataType: "json"
    })
        .done(function (response) {
            mergeStorage("bat17", response["bat2017"]);
            mergeStorage("pitch17", response["pit2017"]);
            mergeStorage("bat18", response["bat2018"]);
            mergeStorage("pitch18", response["pit2018"]);
            mergeStorage("bat3yr", response["bat3yr"]);
            mergeStorage("pit3yr", response["pit3yr"]);
            mergeStorage("dcBat", response["rfangraphsdc-bat"]);
            mergeStorage("dcPitch", response["rfangraphsdc-pit"]);
            mergeStorage("steamBat", response["steamerr-bat"]);
            mergeStorage("steamPitch", response["steamerr-pit"]);
            mergeStorage("zipsBat", response["rzips-bat"]);
            mergeStorage("zipsPitch", response["rzips-pit"]);
        })
        .done(function () {
            if (urlMatch.yahooMatch) {
                chrome.storage.local.get("leaguesListYahoo", function (leaguesResult) {
                    $.each(leaguesResult["leaguesListYahoo"], function (index, value) {
                        console.log("Creating Fantasy Point Projections for League " + value);
                        createProjectionsYahoo(value);
                    });
                });
            } else {
                chrome.storage.local.get("leaguesList", function (leaguesResult) {
                    $.each(leaguesResult["leaguesList"], function (index, value) {
                        console.log("Creating Fantasy Point Projections for League " + value);
                        createProjections(value);
                    });
                });
            }
        }).done(function () {
        chrome.storage.local.set({"frUpdate": currentDate.getTime()});
        chrome.storage.local.set({"frUpdateYahoo": currentDate.getTime()});
    });
}

function mergeStorage(source, newData) {
    chrome.storage.local.get(source, function (result) {
        if (typeof result === "undefined" || jQuery.isEmptyObject(result)) {
            chrome.storage.local.set({[source]: newData});
        } else {
            chrome.storage.local.set({[source]: Object.assign(newData, result)});
        }
    });
}

start();
