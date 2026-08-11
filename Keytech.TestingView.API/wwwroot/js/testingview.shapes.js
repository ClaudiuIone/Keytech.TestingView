L.getPositionShapes = function (chart) {
    if(!chart) {
        chart = L.c();
    }
    return chart.getAllShapes()
        .filter(s => s.name == 'long_position' || s.name == 'short_position')
        .map(s => L.getShapeById(s.id, chart, true));
}

L.generateEntryShapeCharts = function () {
    L.session.meta.entryShapeCharts = L.session.meta.entryShapeCharts || [];
    const cacheKey = `allShapes`;
    const cached = L.cache.getIfExists(cacheKey);
    
    if (!cached[0]) {
        L.applyOnCharts(chart => {
            const shapes = chart.getAllShapes();
            for (var i = shapes.length - 1; i >= 0; i--) {
                const shapeInfo = shapes[i];

                var isEntry = true;
                isEntry = isEntry && (shapeInfo.name === 'long_position' || shapeInfo.name === 'short_position');
                isEntry = isEntry && !L.session.meta.entryShapeCharts.some(s => s.shapeInfo.id == shapeInfo.id);
                isEntry = isEntry && !L.session.positions.some(position => position.getShape()?.shapeId === shapeInfo.id);
                isEntry = isEntry && chart.barsHistoryEntries.length;

                if (isEntry) {
                    shapeInfo.timeAdded = chart.barsHistoryEntries.slice(-1)[0].time;
                    L.session.meta.entryShapeCharts.push({ shapeInfo, chart });
                }
            }
        });

        for (var shapeChartIndex = L.session.meta.entryShapeCharts.length - 1; shapeChartIndex >= 0; shapeChartIndex--) {
            const shapeChartInfo = L.session.meta.entryShapeCharts[shapeChartIndex];
            const shape = L.getShapeById(shapeChartInfo.shapeInfo.id, shapeChartInfo.chart, true);
            if(!shape) {
                L.session.meta.entryShapeCharts.splice(shapeChartIndex, 1);
                continue;
            }
        }
        
        L.cache.set(cacheKey, true, 1);
    }
}

L.showBeLine = async function (position, chart) {
    if (chart && !position.exitTime) {
        if (!(position.meta.beLineId && L.getShapeById(position.meta.beLineId, chart))) {
            position.meta.beLineId = await chart.createShape(
                { price: position.bePrice() || (position.entryPrice + Math.sign(position.quantity) * Math.abs(position.targetPrice() - position.entryPrice) / 2), time: position.entryTime },
                {
                    shape: "horizontal_line",
                    disableSelection: true,
                    disableSave: true,
                    //disableUndo: true, //this leads to the shape being drawn only on 1 chart
                    showInObjectsTree: false,
                    lineWidth: 1,
                });
        }

        L.setGeneratedShape(position.meta.beLineId);
        const beLine = L.getShapeById(position.meta.beLineId, chart);

        beLine.lineDataSource().properties().linestyle.setValue(2);
        beLine.lineDataSource().properties().linecolor.setValue("#FFFF00CC");

        $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(7, -9) /* show-be-button */}`).hide();
        $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(8, -3) /* hide-be-button */}`).show();
    }
}

L.removeBeLine = function (position, chart) {
    if (chart) {
        if (position.meta.beLineId) {
            L.removeShapeById(position.meta.beLineId, chart);
        }

        delete position.meta.beLineId;
        position.bePrice(0);

        $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(7, -9) /* show-be-button */}`).show();
        $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(8, -3) /* hide-be-button */}`).hide();
    }
}

L.syncLinesWithPositions = function () {
    if (L.session.meta.lastSyncLinesWithPositions && (new Date() - L.session.meta.lastSyncLinesWithPositions) < 2000) {
        return;
    }
    L.session.meta.lastSyncLinesWithPositions = new Date();

    for (const position of L.session.getActivePositions()) {
        if (position.meta.stopLineId) {
            const stopLine = L.getShapeById(position.meta.stopLineId);
            if (stopLine) {
                L.setStopPrice(position, stopLine.lineDataSource().points()[0].price);
            }
        }

        if (position.meta.targetLineId) {
            const targetLine = L.getShapeById(position.meta.targetLineId);
            if (targetLine) {
                L.setTargetPrice(position, targetLine.lineDataSource().points()[0].price);
            }
        }

        if (position.meta.beLineId) {
            const beLine = L.getShapeById(position.meta.beLineId);
            if (beLine) {
                L.setBePrice(position, beLine.lineDataSource().points()[0].price);
            }
        }
    }
}

L.syncShapeWithPosition = function (shape, position) {
    const points = shape.getPoints();

    if (points[0].price !== position.entryPrice || points[1].price !== position.entryPrice || points[0].time !== position.entryTime || position.exitTime) {
        const shapeLength = points[1].time - points[0].time;
        shape.setPoints([{ price: position.entryPrice, time: position.entryTime }, { price: position.entryPrice, time: Math.max(position.exitTime || 0, position.entryTime + shapeLength) }]);
    }
}

L.createLinesForPosition = async function (position, chart) {
    if(!chart) {
        return;
    }
    
    var lineProperties = {
        shape: "horizontal_ray",
        disableSelection: true,
        disableSave: true,
        //disableUndo: true, //this leads to the shape being drawn only on 1 chart
        lock: true,
        showInObjectsTree: false,
        lineWidth: 1,
        showLabel: true,
        horzLabelsAlign: "right",
        text: position.quantity > 0 ? "⬆️" : "⬇️",
        vertLabelsAlign: position.quantity > 0 ? "top" : "bottom",
        linestyle: 1,
        linecolor: "#0000FFCC",
        textcolor: "#0000FFCC"
    };

    var lineShape = L.getShapeById(position.meta.entryLineId, chart, true);
    if (!lineShape) {
        position.meta.entryLineId = await chart.createShape(
            { price: position.entryPrice, time: position.entryTime },
            lineProperties);
        lineShape = L.getShapeById(position.meta.entryLineId, chart);
    }

    lineShape.setPoints([{ price: position.entryPrice, time: position.entryTime }]);
    lineShape.setProperties(lineProperties);
    L.setGeneratedShape(position.meta.entryLineId);

    lineProperties = {
        shape: "horizontal_line",
        disableSelection: true,
        disableSave: true,
        //disableUndo: true, //this leads to the shape being drawn only on 1 chart
        showInObjectsTree: false,
        lineWidth: 1,
        showLabel: true,
        horzLabelsAlign: "right",
        text: `${position.getProfitAtPrice(position.stopPrice())} ${L.session.currencyId} (${position.getProfitPercentage(position.getProfitAtPrice(position.stopPrice(), true))}%)`,
        vertLabelsAlign: position.quantity > 0 ? "top" : "bottom",
        linestyle: 1,
        linecolor: "#FF0000CC",
        textcolor: "#FF0000CC"
    };

    lineShape = L.getShapeById(position.meta.stopLineId, chart, true);
    if (!lineShape && position.stopPrice() !== undefined) {
        position.meta.stopLineId = await chart.createShape(
            { price: position.stopPrice(), time: position.entryTime },
            lineProperties);
        lineShape = L.getShapeById(position.meta.stopLineId, chart);
    }

    if(lineShape) {
        lineShape.setPoints([{ price: position.stopPrice(), time: position.entryTime }]);
        lineShape.setProperties(lineProperties);
        L.setGeneratedShape(position.meta.stopLineId);
    }

    lineProperties = {
        shape: "horizontal_line",
        disableSelection: true,
        disableSave: true,
        //disableUndo: true, //this leads to the shape being drawn only on 1 chart
        showInObjectsTree: false,
        lineWidth: 1,
        showLabel: true,
        horzLabelsAlign: "right",
        text: `${position.getProfitAtPrice(position.targetPrice())} ${L.session.currencyId} (${position.getProfitPercentage(position.getProfitAtPrice(position.targetPrice(), true))}%)`,
        vertLabelsAlign: position.quantity > 0 ? "bottom" : "top",
        linestyle: 1,
        linecolor: "#00FF00CC",
        textcolor: "#00FF00CC"
    };

    lineShape = L.getShapeById(position.meta.targetLineId, chart, true);
    if (!lineShape && position.targetPrice() !== undefined) {
        position.meta.targetLineId = await chart.createShape(
            { price: position.targetPrice(), time: position.entryTime },
            lineProperties);
        lineShape = L.getShapeById(position.meta.targetLineId, chart);
    }

    if(lineShape) {
        lineShape.setPoints([{ price: position.targetPrice(), time: position.entryTime }]);
        lineShape.setProperties(lineProperties);
        L.setGeneratedShape(position.meta.targetLineId);
    }

    if(position.bePrice()) {
        lineProperties = {
            shape: "horizontal_line",
            disableSelection: true,
            disableSave: true,
            //disableUndo: true, //this leads to the shape being drawn only on 1 chart
            showInObjectsTree: false,
            lineWidth: 1,
            linestyle: 2,
            linecolor: "#FFFF00CC"
        };
        
        lineShape = L.getShapeById(position.meta.beLineId, chart, true);
        if (!lineShape && position.bePrice() !== undefined) {
            position.meta.beLineId = await chart.createShape(
                { price: position.bePrice(), time: position.entryTime },
                lineProperties);
            lineShape = L.getShapeById(position.meta.beLineId, chart);
        }

        if(lineShape) {
            lineShape.setPoints([{ price: position.bePrice(), time: position.entryTime }]);
            lineShape.setProperties(lineProperties);
            L.setGeneratedShape(position.meta.beLineId);
        }
    }
}

L.drawShapeForPosition = function (position) {
    var shapeExists = null;
    position.meta.pendingDrawShapeForPositionId = Date.now();
    var currentPendingDrawShapeForPositionId = position.meta.pendingDrawShapeForPositionId;

    return L.applyOnChartsAsync(async (chart) => {
        if(currentPendingDrawShapeForPositionId != position.meta.pendingDrawShapeForPositionId) {
            return -1;
        }

        var shapeId = position.getShape().shapeId;
        
        var shape = L.getShapeById(shapeId, chart, true);
        if(shapeExists == null) {
            shapeExists = !!shape;
        }

        if (chart && L.hasSameSymbol(chart, position)) {
            const firstBarTime = chart.chartModel().mainSeries().firstBar()[0];
            if(position.entryTime >= firstBarTime) {
                const points = [{ price: position.entryPrice, time: position.entryTime }, { price: position.entryPrice, time: position.getShape().endTime }];
                if (!shape) {
                    shapeId = await chart.createShape(
                        points,
                        {
                            shape: position.getShape().name,
                        }
                    );
                    L.setGeneratedShape(shapeId);
                    shape = L.getShapeById(shapeId, chart);
                }

                if (!position.exitTime) {
                    L.createLinesForPosition(position, chart);
                }

                await L.delay(200);
                if(!shapeExists) {
                    L.tryExec(() => shape.setPoints(points), true);

                    L.syncShapeWithPosition(shape, position);

                    const shapeDataSourceProperties = shape.lineDataSource().properties();

                    shapeDataSourceProperties.targetPrice.setValue(position.getShape().targetPrice);
                    shapeDataSourceProperties.stopPrice.setValue(position.getShape().stopPrice);

                    const shapeProperties = {
                        currency: L.session.currencyId,
                        accountSize: position.meta.initialBalance,
                        lotSize: position.symbol.meta.contractSize,
                        entryPrice: position.entryPrice,
                        risk: position.getRiskPercentage(true),
                        riskDisplayMode: "percents",
                    }

                    L.setPositionShapeSettings(shapeDataSourceProperties, {id: shapeId, ...shapeProperties});

                    shape.setProperties(position.getShape());

                    shapeDataSourceProperties.riskDisplayMode.setValue("percents");
                    shapeDataSourceProperties.risk.setValue(shapeProperties.risk);
                    position.getShape().shapeId = shapeId;
                    position.meta.hasShapeRedraw = true;
                }
            }
        }
        
        return shape;
    }, true, true);
}

L.removeShapeForPosition = function (position, ignoreErrors) {
    if (position.exitTime && position.positionId != position.getShape().shapeId) {
        L.removeShapeById(position.getShape().shapeId, null, ignoreErrors);
        position.meta.hasShapeRedraw = false;
        position.meta.pendingDrawShapeForPositionId = 0;
    }
}