L.getIsoDay = function(date) {
    return date.toISOString().split('T')[0]; // "2025-12-27"
}

L.getDateInTimezone = function (timestamp, timezone) {
    const date = L.isNumber(timestamp) ? new Date(timestamp * 1000) : new Date(timestamp);

    // Get UTC offset in minutes
    const tzOffsetMinutes = L.getUTCOffsetInMinutes(timezone, date);

    // Apply offset to create a new adjusted Date object
    return new Date(date.getTime() + tzOffsetMinutes * 60 * 1000);
}

L.getUtcDate = function (timestamp, timezone) {
    const date = L.isNumber(timestamp) ? new Date(timestamp * 1000) : new Date(timestamp);

    // Get UTC offset in minutes
    const tzOffsetMinutes = L.getUTCOffsetInMinutes(timezone, date);

    // Apply offset to create a new adjusted Date object
    return new Date(date.getTime() - tzOffsetMinutes * 60 * 1000);
}

L.getUTCOffsetInMinutes = function (timezone, date) {
    const cacheKey = L.s(4, 9, timezone, date) /* getUTCOffsetInMinutes-{0}-{1} */;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const options = { timeZone: timezone, timeZoneName: "longOffset" };
    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);

    const offsetPart = parts.find(part => part.type === "timeZoneName");
    if (offsetPart) {
        const match = offsetPart.value.match(/([+-]\d{2}):(\d{2})/);
        if (match) {
            const offsetMinutes = parseInt(match[1]) * 60 + parseInt(match[2]); // Convert to minutes
            L.cache.set(cacheKey, offsetMinutes, 3600); // Cache for 1 hour
            return offsetMinutes;
        }
    }
    L.cache.set(cacheKey, 0, 3600); // Cache default UTC offset for 1 hour
    return 0; // Default to UTC if parsing fails
}

L.getLastMonday = function(date) {
    const day = date.getDay();
    const diff = day === 0 ? 6 : day - 1;
    date.setDate(date.getDate() - diff);
    return date;
}

L.toTradingViewDateTimeFormat = function (timestamp, timezone, chart) {
    if (!chart) {
        chart = L.getCharts()[0];
    }

    if (!timezone) {
        timezone = chart.getTimezone();
    }

    const cacheKey = L.s(5, 0, timestamp, timezone) /* toTradingViewDateTimeFormat-{0}-{1} */;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }
    
    const date = L.getDateInTimezone(timestamp, timezone);

    if(!chart._lastDateTimeFormatter?._timeFormatter) {
        if (L.isDate(timestamp)) {
            timestamp = timestamp.getTime() / 1000;
        } else if (!L.isNumber(timestamp)) {
            timestamp = new Date(timestamp) / 1000;
        }

        let formatterChart = chart;
        if (!formatterChart.chartModel().dateTimeFormatter()._timeFormatter) {
            const charts = L.getCharts();
            for (const c of charts) {
                if (c.chartModel().dateTimeFormatter()._timeFormatter) {
                    formatterChart = c;
                    break;
                }
            }
        }
        const timeFormatter = formatterChart.chartModel().dateTimeFormatter()._timeFormatter;
        if(timeFormatter) {
            timeFormatter._valuesAndDelimeters = ["%h",":","%m", ":", "%s"];
        }

        if(!chart._lastDateTimeFormatter || timeFormatter) {
            chart._lastDateTimeFormatter = formatterChart.chartModel().dateTimeFormatter();
        }
    }

    const formattedDate = chart._lastDateTimeFormatter.format(date);

    L.cache.set(cacheKey, formattedDate, 60); // Cache for 1 minute
    return formattedDate;
}

L.getNextDateTime = function(startDate, time) {
    var [hours, minutes] = time.split(":").map(Number);
    var timeNow = new Date();
    var timeNowInTimezone = L.getDateInTimezone(timeNow /1000, L.c().getTimezone());

    hours = hours - (timeNowInTimezone.getUTCHours() - timeNow.getHours());
    minutes = minutes - (timeNowInTimezone.getUTCMinutes() - timeNow.getMinutes());

    const symbolInfo = L.c().chartModel().mainSeries().symbolInfo();
    const sessionStr = symbolInfo.session;
    let sessions = [];
    
    sessionStr.split('|').forEach(s => {
        const [time, days] = s.split(':');
        const [start, end] = time.split('-');
        
        if (days) {
            for(const day of days) {
                sessions.push({
                    day: parseInt(day) - 1,
                    startHour: parseInt(start.substring(0, 2)),
                    startMinute: parseInt(start.substring(2)),
                    endHour: parseInt(end.substring(0, 2)),
                    endMinute: parseInt(end.substring(2))
                });
            }
        } else {
            const existingDays = sessions.map(s => s.day);
            if(existingDays.length == 0) {
                for (let d = 0; d <= 6; d++) {
                    sessions.push({
                        day: d,
                        startHour: 0,
                        startMinute: 0,
                        endHour: 23,
                        endMinute: 59
                    });
                }
            } else {
                for (let d = 1; d <= 5; d++) {
                    if (!existingDays.includes(d)) {
                        sessions.push({
                            day: d,
                            startHour: parseInt(start.substring(0, 2)),
                            startMinute: parseInt(start.substring(2)),
                            endHour: parseInt(end.substring(0, 2)),
                            endMinute: parseInt(end.substring(2))
                        });
                    }
                }
            }
        }
    });

    let nextDate = L.getDateInTimezone(startDate, L.c().getTimezone());
    let found = false;
    let maxAttempts = 30; 

    while (!found && maxAttempts > 0) {
        
        nextDate.setHours(hours, minutes, 0, 0);
        
        if (nextDate.getTime() / 1000 <= startDate) {
            // Move to next day if time is in the past
            nextDate.setDate(nextDate.getDate() + 1);
            continue;
        }

        // Check if this day & time is within market hours
        const dayOfWeek = nextDate.getDay() || 7; // Convert Sunday from 0 to 7
        const session = sessions.find(s => s.day === dayOfWeek);

        if (session) {
            found = true;
        }

        if (!found) {
            nextDate.setDate(nextDate.getDate() + 1);
        }
        maxAttempts--;
    }

    if(found) {
        return nextDate;
    }
}

L.getYesterdayTimestamp = function() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return yesterday.getTime() / 1000;
}

L.getDefaultRandomizedSessionRange = function() {
    const yesterday = new Date(L.getYesterdayTimestamp() * 1000);
    const earliestDate = new Date(yesterday);
    earliestDate.setFullYear(earliestDate.getFullYear() - 4);

    const minEndDate = new Date(earliestDate);
    minEndDate.setFullYear(minEndDate.getFullYear() + 3);

    const endDate = new Date(minEndDate.getTime() + Math.random() * (yesterday.getTime() - minEndDate.getTime()));

    const latestStartDate = new Date(endDate);
    latestStartDate.setFullYear(latestStartDate.getFullYear() - 3);
    const startDate = new Date(earliestDate.getTime() + Math.random() * (latestStartDate.getTime() - earliestDate.getTime()));

    return {
        startDate: startDate.getTime() / 1000,
        endDate: endDate.getTime() / 1000
    };
}

L.isRandomizedSessionRangeValid = function(startDate, endDate) {
    if(!L.isDate(startDate) || !L.isDate(endDate)) {
        return false;
    }

    const yesterday = new Date(L.getYesterdayTimestamp() * 1000);
    if(startDate > yesterday || endDate > yesterday) {
        return false;
    }

    if(startDate >= endDate) {
        return false;
    }

    return true;
}

L.getRandomDateInRange = function(startDate, endDate) {
    return startDate + Math.random() * (endDate - startDate);
}

L.enableTemporaryPastDateNavigation = function(durationMs) {
    if(!L.session?.meta) {
        return;
    }

    clearTimeout(L.session.meta.allowPastDateNavigationTimeout);
    L.session.allowPastDateNavigation = true;
    L.session.meta.allowPastDateNavigationTimeout = setTimeout(() => {
        L.session.allowPastDateNavigation = false;
    }, durationMs || 7000);
}

L.resolutionToSeconds = function (resolution) {
    if (resolution.endsWith(L.s(5, 1) /* T */)) return parseInt(resolution);   // Convert ticks to seconds
    else if (resolution.endsWith(L.s(5, 2) /* S */)) return parseInt(resolution);   // Get the seconds
    else if (resolution.toLocaleLowerCase().endsWith(L.s(5, 3) /* h */)) return parseInt(resolution) * 60 * 60;   // Convert hours to seconds
    else if (resolution.endsWith(L.s(5, 4) /* D */)) return parseInt(resolution) * 1440 * 60; // Convert days to seconds
    else if (resolution.endsWith(L.s(5, 5) /* W */)) return parseInt(resolution) * 10080 * 60; // Convert weeks to seconds
    else if (resolution.endsWith(L.s(5, 6) /* M */) && resolution.length > 1) return parseInt(resolution) * 43200 * 60; // Convert months to seconds
    else if (!isNaN(resolution)) return parseInt(resolution) * 60;              // Convert minutes to seconds
    else return 0; // unknown
}

L.resolutionToFriendlyText = function (resolution) {
    if (resolution.endsWith(L.s(5, 1) /* T */)) return resolution.replace("T", "t");
    else if (resolution.endsWith(L.s(5, 2) /* S */)) return resolution.replace("S", "s");
    else if (!isNaN(resolution)) return resolution + "m";
    else return resolution;
}

L.formatLocalTime = function(seconds) {
    const chart = L.c();
    return chart.chartModel().timeFormatter().format(L.getDateInTimezone(seconds, chart.getTimezone()));
}

L.formatTimestamp = function (seconds) {
    const m = ~~((seconds % 3600) / 60);
    const s = seconds % 60;

    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

L.getDurationText = function(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    const parts = [];
    if (days) parts.push(days + 'd');
    if (hours) parts.push(hours + 'h');
    if (mins) parts.push(mins + 'm');
    if (secs || parts.length === 0) parts.push(secs + 's');

    return (totalSeconds < 0 ? '-' : '') + parts.join(' ');
};

L.getSessionStartUtcTime = function (timeStr, timezone) {
    // Extract the first word (should be HHMM format)
    const match = timeStr.match(/^\d{4}/); // Matches 4-digit numbers at the start

    if (!match) {
        return 0;
    }

    const time = match[0]; // Extracted 4-digit time
    const hours = parseInt(time.substring(0, 2), 10);
    const minutes = parseInt(time.substring(2, 4), 10);

    // Validate if the extracted value is a valid time (00:00 - 23:59)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return 0;
    }

    // Create a date with the specified time in UTC
    const sessionOpenDate = new Date(0);
    sessionOpenDate.setUTCHours(hours, minutes, 0, 0);

    // If timezone is provided, convert from timezone to UTC
    if (timezone) {
        const tzOffsetMinutes = L.getUTCOffsetInMinutes(timezone, sessionOpenDate);
        // Subtract the offset to convert from local timezone to UTC
        sessionOpenDate.setTime(sessionOpenDate.getTime() - tzOffsetMinutes * 60 * 1000);
    }

    // Convert to Unix timestamp (seconds)
    const sessionOpenUtcTime = Math.floor(sessionOpenDate.getTime() / 1000);
    return sessionOpenUtcTime;
}

L.isDate = function (value) {
    return value instanceof Date && !isNaN(value.getTime());
}

L.gotoTime = function (utcTime) {
    L.applyOnCharts(chart => chart.chartModel().gotoTime(L.getDateInTimezone(utcTime, chart.getTimezone())));
}